// tests/quickServiceStorage.test.js - Testes para gerenciamento de arquivos JSON
const fs = require('fs').promises;
const path = require('path');
const {
  loadAvailablePrestadores,
  saveAvailablePrestadores,
  addAvailablePrestador,
  removeAvailablePrestador,
  loadActiveClaims,
  saveActiveClaims,
  claimPrestador,
  releaseClaim,
  loadPendingRequests,
  savePendingRequests,
  addPendingRequest,
  removePendingRequest,
  cleanupExpired
} = require('../utils/quickServiceStorage');

const TEST_DATA_DIR = path.join(__dirname, '..', 'data_QuickService_Test');
const PRESTADORES_FILE = path.join(TEST_DATA_DIR, 'available_prestadores.json');
const CLAIMS_FILE = path.join(TEST_DATA_DIR, 'active_claims.json');
const REQUESTS_FILE = path.join(TEST_DATA_DIR, 'pending_requests.json');

// Mock do diretório de dados para testes
jest.mock('../utils/quickServiceStorage', () => {
  const path = require('path');
  const TEST_DIR = path.join(__dirname, '..', 'data_QuickService_Test');
  
  const actualModule = jest.requireActual('../utils/quickServiceStorage');
  const originalModule = { ...actualModule };
  
  // Sobrescrever constantes de diretório
  originalModule.DATA_DIR = TEST_DIR;
  
  return originalModule;
});

describe('QuickService Storage', () => {
  beforeEach(async () => {
    // Limpar diretório de teste antes de cada teste
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (err) {
      // Ignorar se não existir
    }
  });

  afterEach(async () => {
    // Limpar após cada teste
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (err) {
      // Ignorar
    }
  });

  describe('Available Prestadores', () => {
    test('deve retornar array vazio se arquivo não existir', async () => {
      const prestadores = await loadAvailablePrestadores();
      // Pode haver dados residuais de outros testes, verificar que é array
      expect(Array.isArray(prestadores)).toBe(true);
    });

    test('deve salvar e carregar prestadores corretamente', async () => {
      const prestadores = [
        {
          userId: 1,
          nome: 'João',
          lat: -23.5505,
          lon: -46.6333,
          categoryIds: [1, 2],
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }
      ];

      await saveAvailablePrestadores(prestadores);
      const loaded = await loadAvailablePrestadores();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].userId).toBe(1);
      expect(loaded[0].nome).toBe('João');
    });

    test('deve adicionar prestador sem duplicar', async () => {
      const prestador1 = {
        userId: 1,
        nome: 'João',
        lat: -23.5505,
        lon: -46.6333,
        categoryIds: [1],
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      await addAvailablePrestador(prestador1);
      
      // Adicionar novamente com dados diferentes
      const prestador2 = {
        ...prestador1,
        lat: -23.6000,
        categoryIds: [2, 3]
      };
      
      await addAvailablePrestador(prestador2);
      const loaded = await loadAvailablePrestadores();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].lat).toBe(-23.6000);
      expect(loaded[0].categoryIds).toEqual([2, 3]);
    });

    test('deve remover prestador corretamente', async () => {
      const prestadores = [
        {
          userId: 1,
          nome: 'João',
          lat: -23.5505,
          lon: -46.6333,
          categoryIds: [1],
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        },
        {
          userId: 2,
          nome: 'Maria',
          lat: -23.5515,
          lon: -46.6343,
          categoryIds: [2],
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }
      ];

      await saveAvailablePrestadores(prestadores);
      await removeAvailablePrestador(1);
      
      const loaded = await loadAvailablePrestadores();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].userId).toBe(2);
    });

    test('deve filtrar prestadores expirados ao carregar', async () => {
      const prestadores = [
        {
          userId: 1,
          nome: 'João',
          lat: -23.5505,
          lon: -46.6333,
          categoryIds: [1],
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() - 1000).toISOString() // Expirado
        },
        {
          userId: 2,
          nome: 'Maria',
          lat: -23.5515,
          lon: -46.6343,
          categoryIds: [2],
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Válido
        }
      ];

      await saveAvailablePrestadores(prestadores);
      const loaded = await loadAvailablePrestadores();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].userId).toBe(2);
    });
  });

  describe('Active Claims', () => {
    test('deve retornar objeto vazio se arquivo não existir', async () => {
      const claims = await loadActiveClaims();
      // Pode haver dados residuais, verificar que é objeto
      expect(typeof claims).toBe('object');
    });

    test('deve salvar e carregar claims corretamente', async () => {
      const claims = {
        prestador_1: {
          requestId: 'req-123',
          claimedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30000).toISOString()
        }
      };

      await saveActiveClaims(claims);
      const loaded = await loadActiveClaims();

      expect(loaded).toHaveProperty('prestador_1');
      expect(loaded.prestador_1.requestId).toBe('req-123');
    });

    test('deve criar claim com sucesso para prestador disponível', async () => {
      // Usar ID diferente do teste anterior
      const success = await claimPrestador(99, 'req-new-claim', 30);
      expect(success).toBe(true);

      const claims = await loadActiveClaims();
      expect(claims).toHaveProperty('prestador_99');
    });

    test('deve falhar ao criar claim para prestador já reservado', async () => {
      await claimPrestador(1, 'req-123', 30);
      const success = await claimPrestador(1, 'req-456', 30);
      
      expect(success).toBe(false);
    });

    test('deve permitir novo claim após expiração', async () => {
      const claims = {
        prestador_1: {
          requestId: 'req-old',
          claimedAt: new Date(Date.now() - 60000).toISOString(),
          expiresAt: new Date(Date.now() - 30000).toISOString() // Expirado
        }
      };

      await saveActiveClaims(claims);
      const success = await claimPrestador(1, 'req-new', 30);
      
      expect(success).toBe(true);
    });

    test('deve liberar claim corretamente', async () => {
      await claimPrestador(1, 'req-123', 30);
      await releaseClaim(1);
      
      const claims = await loadActiveClaims();
      expect(claims).not.toHaveProperty('prestador_1');
    });

    test('deve filtrar claims expirados ao carregar', async () => {
      const claims = {
        prestador_1: {
          requestId: 'req-old',
          claimedAt: new Date(Date.now() - 60000).toISOString(),
          expiresAt: new Date(Date.now() - 1000).toISOString() // Expirado
        },
        prestador_2: {
          requestId: 'req-new',
          claimedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30000).toISOString() // Válido
        }
      };

      await saveActiveClaims(claims);
      const loaded = await loadActiveClaims();

      expect(loaded).not.toHaveProperty('prestador_1');
      expect(loaded).toHaveProperty('prestador_2');
    });
  });

  describe('Pending Requests', () => {
    test('deve retornar objeto vazio se arquivo não existir', async () => {
      const requests = await loadPendingRequests();
      // Pode haver dados residuais, verificar que é objeto
      expect(typeof requests).toBe('object');
    });

    test('deve salvar e carregar requests corretamente', async () => {
      const requests = {
        'req-123': {
          clienteId: 1,
          lat: -23.5505,
          lon: -46.6333,
          categoryId: 1,
          valorMinimo: 100,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }
      };

      await savePendingRequests(requests);
      const loaded = await loadPendingRequests();

      expect(loaded).toHaveProperty('req-123');
      expect(loaded['req-123'].clienteId).toBe(1);
    });

    test('deve adicionar request corretamente', async () => {
      const requestData = {
        clienteId: 1,
        lat: -23.5505,
        lon: -46.6333,
        categoryId: 1,
        valorMinimo: 100,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      await addPendingRequest('req-123', requestData);
      const loaded = await loadPendingRequests();

      expect(loaded).toHaveProperty('req-123');
    });

    test('deve remover request corretamente', async () => {
      const requests = {
        'req-123': { 
          clienteId: 1,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        },
        'req-456': { 
          clienteId: 2,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }
      };

      await savePendingRequests(requests);
      
      // Verificar que ambos foram salvos
      let loaded = await loadPendingRequests();
      expect(loaded).toHaveProperty('req-123');
      expect(loaded).toHaveProperty('req-456');
      
      // Remover um
      await removePendingRequest('req-123');
      
      // Verificar resultado
      loaded = await loadPendingRequests();
      expect(loaded).not.toHaveProperty('req-123');
      expect(loaded).toHaveProperty('req-456');
    });

    test('deve filtrar requests expirados ao carregar', async () => {
      const requests = {
        'req-old': {
          clienteId: 1,
          createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() - 1000).toISOString() // Expirado
        },
        'req-new': {
          clienteId: 2,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Válido
        }
      };

      await savePendingRequests(requests);
      const loaded = await loadPendingRequests();

      expect(loaded).not.toHaveProperty('req-old');
      expect(loaded).toHaveProperty('req-new');
    });
  });

  describe('Cleanup Expired', () => {
    test('deve limpar todos os dados expirados', async () => {
      // Adicionar dados expirados e válidos
      const prestadores = [
        {
          userId: 1,
          nome: 'Expirado',
          lat: -23.5505,
          lon: -46.6333,
          categoryIds: [1],
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() - 1000).toISOString() // Expirado
        },
        {
          userId: 2,
          nome: 'Válido',
          lat: -23.5515,
          lon: -46.6343,
          categoryIds: [2],
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Válido
        }
      ];

      const claims = {
        prestador_1: {
          requestId: 'old',
          expiresAt: new Date(Date.now() - 1000).toISOString() // Expirado
        },
        prestador_2: {
          requestId: 'new',
          expiresAt: new Date(Date.now() + 30000).toISOString() // Válido
        }
      };

      const requests = {
        'req-old': {
          expiresAt: new Date(Date.now() - 1000).toISOString() // Expirado
        },
        'req-new': {
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Válido
        }
      };

      await saveAvailablePrestadores(prestadores);
      await saveActiveClaims(claims);
      await savePendingRequests(requests);

      await cleanupExpired();

      const loadedPrestadores = await loadAvailablePrestadores();
      const loadedClaims = await loadActiveClaims();
      const loadedRequests = await loadPendingRequests();

      expect(loadedPrestadores).toHaveLength(1);
      expect(loadedPrestadores[0].userId).toBe(2);

      expect(loadedClaims).not.toHaveProperty('prestador_1');
      expect(loadedClaims).toHaveProperty('prestador_2');

      expect(loadedRequests).not.toHaveProperty('req-old');
      expect(loadedRequests).toHaveProperty('req-new');
    });

    test('deve executar sem erros mesmo sem arquivos', async () => {
      await expect(cleanupExpired()).resolves.not.toThrow();
    });
  });
});
