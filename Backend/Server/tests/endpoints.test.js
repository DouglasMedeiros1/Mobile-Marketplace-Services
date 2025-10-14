jest.mock('../db.mjs', () => ({
  __esModule: true,
  default: {
    // Mock das funções que você usa, por exemplo:
    // query: jest.fn().mockResolvedValue([]),
    // ou qualquer função que seu código espera do db
  }
}));

const request = require('supertest');
const app = require('../index'); // Certifique-se que seu index.js exporta o app Express

describe('Testes básicos dos endpoints da API', () => {
  // AUTENTICAÇÃO
  it('POST /auth/login deve retornar erro com dados inválidos', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'fake@email.com', senha: 'errada' });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /auth/register deve retornar erro se faltar campos', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nome: 'Teste' }); // faltando email, senha, cpf
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  // USUÁRIOS
  it('GET /user/me sem token deve retornar 401', async () => {
    const res = await request(app).get('/user/me');
    expect(res.statusCode).toBe(401);
  });

  it('GET /user/99999 deve retornar erro se usuário não existe', async () => {
    const res = await request(app).get('/user/99999');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  // SERVIÇOS
  it('GET /services deve retornar 200', async () => {
    const res = await request(app).get('/services');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /services/99999 deve retornar erro se serviço não existe', async () => {
    const res = await request(app).get('/services/99999');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  // PROPOSTAS
  it('GET /proposals/service/99999 deve retornar erro se serviço não existe', async () => {
    const res = await request(app).get('/proposals/service/99999');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('GET /proposals/my sem token deve retornar 401', async () => {
    const res = await request(app).get('/proposals/my');
    expect(res.statusCode).toBe(401);
  });

  // EMPRESAS
  it('GET /company deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/company');
    expect(res.statusCode).toBe(401);
  });

  it('GET /company/99999/users deve retornar erro se empresa não existe', async () => {
    const res = await request(app).get('/company/99999/users');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});