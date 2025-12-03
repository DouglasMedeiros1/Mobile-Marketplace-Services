// Mock do db, bcrypt e fs
jest.mock('../db', () => {
  const mockDb = jest.fn(() => Promise.resolve([]));
  mockDb.begin = jest.fn((callback) => callback(mockDb));
  return mockDb;
});

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('fs', () => ({
  promises: {
    access: jest.fn().mockRejectedValue(new Error('Directory not found')),
    mkdir: jest.fn().mockResolvedValue(),
    readFile: jest.fn().mockRejectedValue(new Error('File not found')),
    writeFile: jest.fn().mockResolvedValue(),
    readdir: jest.fn().mockResolvedValue([]),
  }
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;

// Importa módulos necessários
const authModule = require('../routes/auth');
authModule.tokenBlacklist = [];

const app = require('../app');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

describe('Testes do Sistema de Chat', () => {
  let clienteToken, prestadorToken, adminToken;
  let clienteId = 5, prestadorId = 10, adminId = 1;

  beforeAll(() => {
    // Cria tokens de teste para diferentes roles
    clienteToken = jwt.sign(
      { userId: clienteId, roles: ['cliente'] },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    prestadorToken = jwt.sign(
      { userId: prestadorId, roles: ['prestador'] },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: adminId, roles: ['admin'] },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // TESTES DE AUTENTICAÇÃO E AUTORIZAÇÃO
  // ============================================================================

  describe('Autenticação e Autorização', () => {
    it('GET /chat/rooms sem token deve retornar 401', async () => {
      const res = await request(app).get('/chat/rooms');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('GET /chat/messages/10 sem token deve retornar 401', async () => {
      const res = await request(app).get('/chat/messages/10');
      expect(res.statusCode).toBe(401);
    });

    it('POST /chat/messages sem token deve retornar 401', async () => {
      const res = await request(app)
        .post('/chat/messages')
        .send({ otherUserId: 10, message: 'Teste' });
      expect(res.statusCode).toBe(401);
    });
  });

  // ============================================================================
  // TESTES DE VALIDAÇÃO DE ROLES
  // ============================================================================

  describe('Validação de Roles (Cliente <-> Prestador)', () => {
    it('Cliente deve poder iniciar chat com prestador', async () => {
      // Mock: retorna cliente e prestador
      db.mockResolvedValueOnce([
        { id: clienteId, nome: 'Maria Silva', roles: ['cliente'] },
        { id: prestadorId, nome: 'João Técnico', roles: ['prestador'] }
      ]);

      db.mockResolvedValueOnce([{ nome: 'Maria Silva' }]); // sender query

      const res = await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ otherUserId: prestadorId, message: 'Olá!' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Olá!');
      expect(res.body).toHaveProperty('senderId', clienteId);
    });

    it('Prestador deve poder iniciar chat com cliente', async () => {
      // Mock: retorna prestador e cliente
      db.mockResolvedValueOnce([
        { id: prestadorId, nome: 'João Técnico', roles: ['prestador'] },
        { id: clienteId, nome: 'Maria Silva', roles: ['cliente'] }
      ]);

      db.mockResolvedValueOnce([{ nome: 'João Técnico' }]); // sender query

      const res = await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${prestadorToken}`)
        .send({ otherUserId: clienteId, message: 'Como posso ajudar?' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Como posso ajudar?');
    });

    it('Cliente NÃO deve poder conversar com outro cliente', async () => {
      const outroClienteId = 6;

      // Mock: retorna dois clientes
      db.mockResolvedValueOnce([
        { id: clienteId, nome: 'Maria Silva', roles: ['cliente'] },
        { id: outroClienteId, nome: 'Pedro Santos', roles: ['cliente'] }
      ]);

      const res = await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ otherUserId: outroClienteId, message: 'Teste' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Chat permitido apenas entre cliente e prestador.');
    });

    it('Prestador NÃO deve poder conversar com outro prestador', async () => {
      const outroPrestadorId = 11;

      // Mock: retorna dois prestadores
      db.mockResolvedValueOnce([
        { id: prestadorId, nome: 'João Técnico', roles: ['prestador'] },
        { id: outroPrestadorId, nome: 'Ana Costa', roles: ['prestador'] }
      ]);

      const res = await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${prestadorToken}`)
        .send({ otherUserId: outroPrestadorId, message: 'Teste' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Chat permitido apenas entre cliente e prestador.');
    });

    it('Admin NÃO deve poder usar o chat', async () => {
      // Mock: retorna admin e prestador
      db.mockResolvedValueOnce([
        { id: adminId, nome: 'Admin', roles: ['admin'] },
        { id: prestadorId, nome: 'João Técnico', roles: ['prestador'] }
      ]);

      const res = await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ otherUserId: prestadorId, message: 'Teste' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Chat permitido apenas entre cliente e prestador.');
    });
  });

  // ============================================================================
  // TESTES DE ENDPOINTS REST
  // ============================================================================

  describe('Endpoints REST', () => {
    it('GET /chat/rooms deve retornar lista vazia quando não há conversas', async () => {
      fs.readdir.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/chat/rooms')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('GET /chat/rooms deve retornar conversas do usuário', async () => {
      const mockChatFile = JSON.stringify({
        clienteId: 5,
        prestadorId: 10,
        clienteNome: 'Maria Silva',
        prestadorNome: 'João Técnico',
        createdAt: '2024-01-01T10:00:00.000Z',
        messages: [
          {
            id: 1,
            senderId: 10,
            senderNome: 'João Técnico',
            message: 'Olá!',
            isRead: false,
            createdAt: '2024-01-01T10:00:00.000Z'
          }
        ]
      });

      fs.readdir.mockResolvedValueOnce(['510 - Chat Maria Silva e João Técnico.json']);
      fs.readFile.mockResolvedValueOnce(mockChatFile);

      const res = await request(app)
        .get('/chat/rooms')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('unreadCount', 1);
      expect(res.body[0]).toHaveProperty('clienteId', 5);
      expect(res.body[0]).toHaveProperty('prestadorId', 10);
    });

    it('GET /chat/messages/:otherUserId deve retornar histórico e marcar como lido', async () => {
      const mockChatFile = {
        clienteId: 5,
        prestadorId: 10,
        clienteNome: 'Maria Silva',
        prestadorNome: 'João Técnico',
        createdAt: '2024-01-01T10:00:00.000Z',
        messages: [
          {
            id: 1,
            senderId: 10,
            senderNome: 'João Técnico',
            message: 'Olá!',
            isRead: false,
            createdAt: '2024-01-01T10:00:00.000Z'
          }
        ]
      };

      db.mockResolvedValueOnce([
        { id: clienteId, nome: 'Maria Silva', roles: ['cliente'] },
        { id: prestadorId, nome: 'João Técnico', roles: ['prestador'] }
      ]);

      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockChatFile));

      const res = await request(app)
        .get(`/chat/messages/${prestadorId}`)
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(res.body.messages[0].isRead).toBe(true); // Deve marcar como lida
      expect(fs.writeFile).toHaveBeenCalled(); // Deve salvar o arquivo
    });

    it('POST /chat/messages deve rejeitar se faltar campos obrigatórios', async () => {
      const res = await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ otherUserId: 10 }); // falta message

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'otherUserId e message são obrigatórios.');
    });

    it('POST /chat/messages deve criar nova mensagem', async () => {
      db.mockResolvedValueOnce([
        { id: clienteId, nome: 'Maria Silva', roles: ['cliente'] },
        { id: prestadorId, nome: 'João Técnico', roles: ['prestador'] }
      ]);

      db.mockResolvedValueOnce([{ nome: 'Maria Silva' }]);

      fs.readFile.mockResolvedValueOnce(JSON.stringify({
        clienteId: 5,
        prestadorId: 10,
        clienteNome: 'Maria Silva',
        prestadorNome: 'João Técnico',
        createdAt: '2024-01-01T10:00:00.000Z',
        messages: []
      }));

      const res = await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ otherUserId: prestadorId, message: 'Nova mensagem!' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Nova mensagem!');
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('senderId', clienteId);
      expect(res.body).toHaveProperty('isRead', false);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TESTES DE ESTRUTURA DE ARQUIVO JSON
  // ============================================================================

  describe('Estrutura de Arquivos JSON', () => {
    it('Nome do arquivo deve seguir o padrão correto', async () => {
      db.mockResolvedValueOnce([
        { id: clienteId, nome: 'Maria Silva', roles: ['cliente'] },
        { id: prestadorId, nome: 'João Técnico', roles: ['prestador'] }
      ]);

      db.mockResolvedValueOnce([{ nome: 'Maria Silva' }]);

      await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ otherUserId: prestadorId, message: 'Teste' });

      // Verifica se writeFile foi chamado com o caminho correto
      expect(fs.writeFile).toHaveBeenCalled();
      const writePath = fs.writeFile.mock.calls[0][0];
      expect(writePath).toContain('510 - Chat Maria Silva e João Técnico.json');
    });

    it('Arquivo JSON deve ter estrutura correta', async () => {
      db.mockResolvedValueOnce([
        { id: clienteId, nome: 'Maria Silva', roles: ['cliente'] },
        { id: prestadorId, nome: 'João Técnico', roles: ['prestador'] }
      ]);

      db.mockResolvedValueOnce([{ nome: 'Maria Silva' }]);

      await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ otherUserId: prestadorId, message: 'Teste estrutura' });

      expect(fs.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(fs.writeFile.mock.calls[0][1]);

      expect(savedData).toHaveProperty('clienteId', 5);
      expect(savedData).toHaveProperty('prestadorId', 10);
      expect(savedData).toHaveProperty('clienteNome', 'Maria Silva');
      expect(savedData).toHaveProperty('prestadorNome', 'João Técnico');
      expect(savedData).toHaveProperty('createdAt');
      expect(savedData).toHaveProperty('messages');
      expect(Array.isArray(savedData.messages)).toBe(true);
    });
  });

  // ============================================================================
  // TESTES DE EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('Deve criar pasta data_Chat se não existir', async () => {
      db.mockResolvedValueOnce([
        { id: clienteId, nome: 'Maria Silva', roles: ['cliente'] },
        { id: prestadorId, nome: 'João Técnico', roles: ['prestador'] }
      ]);

      db.mockResolvedValueOnce([{ nome: 'Maria Silva' }]);

      await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ otherUserId: prestadorId, message: 'Teste' });

      expect(fs.mkdir).toHaveBeenCalled();
    });

    it('Deve lidar com usuário não encontrado', async () => {
      db.mockResolvedValueOnce([
        { id: clienteId, nome: 'Maria Silva', roles: ['cliente'] }
      ]); // Só retorna 1 usuário

      const res = await request(app)
        .post('/chat/messages')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ otherUserId: 999, message: 'Teste' });

      expect(res.statusCode).toBe(400);
    });

    it('Deve ignorar arquivos não-JSON na listagem', async () => {
      fs.readdir.mockResolvedValueOnce([
        '510 - Chat Maria Silva e João Técnico.json',
        'readme.txt',
        '.gitignore'
      ]);

      const mockChatFile = JSON.stringify({
        clienteId: 5,
        prestadorId: 10,
        clienteNome: 'Maria Silva',
        prestadorNome: 'João Técnico',
        createdAt: '2024-01-01T10:00:00.000Z',
        messages: []
      });

      fs.readFile.mockResolvedValueOnce(mockChatFile);

      const res = await request(app)
        .get('/chat/rooms')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1); // Apenas 1 arquivo JSON válido
    });
  });
});
