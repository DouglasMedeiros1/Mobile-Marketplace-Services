import db from './db.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data_QuickService');
const PRESTADORES_FILE = path.join(DATA_DIR, 'available_prestadores.json');

async function seedQuickService() {
  try {
    console.log('🚀 Iniciando seed do Quick Service...\n');

    // 1. Verificar se diretório existe, senão criar
    try {
      await fs.access(DATA_DIR);
      console.log('✅ Diretório data_QuickService já existe');
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
      console.log('✅ Diretório data_QuickService criado');
    }

    // 2. Buscar prestadores no banco de dados
    const prestadores = await db`
      SELECT DISTINCT u.id, u.nome
      FROM users u
      INNER JOIN role_user ru ON u.id = ru.user_id
      WHERE ru.role = 'prestador'
      ORDER BY u.id
      LIMIT 5
    `;

    if (prestadores.length === 0) {
      console.log('⚠️  Nenhum prestador encontrado no banco de dados');
      console.log('   Execute primeiro o seed de usuários ou crie prestadores manualmente');
      process.exit(1);
    }

    console.log(`\n📋 Prestadores encontrados: ${prestadores.length}`);
    console.table(prestadores);

    // 3. Buscar categorias disponíveis
    const categorias = await db`
      SELECT id, nome FROM categories ORDER BY id LIMIT 8
    `;

    if (categorias.length === 0) {
      console.log('\n⚠️  Nenhuma categoria encontrada');
      console.log('   Execute: node insertCategories.mjs');
      process.exit(1);
    }

    console.log(`\n📂 Categorias disponíveis: ${categorias.length}`);
    console.table(categorias);

    // 4. Atualizar flag disponivel_servico_rapido no banco
    console.log('\n🔄 Atualizando disponibilidade dos prestadores no banco...');
    for (const prestador of prestadores) {
      await db`
        UPDATE users 
        SET disponivel_servico_rapido = true 
        WHERE id = ${prestador.id}
      `;
    }
    console.log('✅ Flags disponivel_servico_rapido atualizadas');

    // 5. Criar dados de teste com coordenadas de São Paulo
    // Localizações reais em São Paulo (diferentes bairros)
    const localizacoes = [
      { lat: -23.550520, lon: -46.633308, bairro: 'Centro' },
      { lat: -23.561414, lon: -46.655882, bairro: 'Paulista' },
      { lat: -23.574321, lon: -46.623456, bairro: 'Vila Mariana' },
      { lat: -23.533773, lon: -46.625290, bairro: 'Santana' },
      { lat: -23.602811, lon: -46.682617, bairro: 'Santo Amaro' }
    ];

    const prestadoresDisponiveis = prestadores.map((prestador, index) => {
      const loc = localizacoes[index % localizacoes.length];
      
      // Cada prestador tem 2-4 categorias aleatórias
      const numCategorias = Math.floor(Math.random() * 3) + 2; // 2 a 4
      const categoryIds = [];
      const categoriasDisponiveis = [...categorias];
      
      for (let i = 0; i < numCategorias && categoriasDisponiveis.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * categoriasDisponiveis.length);
        categoryIds.push(categoriasDisponiveis[randomIndex].id);
        categoriasDisponiveis.splice(randomIndex, 1);
      }

      return {
        userId: prestador.id,
        nome: prestador.nome,
        lat: loc.lat,
        lon: loc.lon,
        bairro: loc.bairro,
        categoryIds: categoryIds.sort(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hora para testes
      };
    });

    // 6. Salvar no arquivo JSON
    await fs.writeFile(
      PRESTADORES_FILE,
      JSON.stringify(prestadoresDisponiveis, null, 2),
      'utf-8'
    );

    console.log('\n✅ Arquivo available_prestadores.json criado com sucesso!');
    console.log(`📍 Localização: ${PRESTADORES_FILE}\n`);

    // 7. Exibir resultado
    console.log('📊 Prestadores disponíveis cadastrados:');
    console.table(prestadoresDisponiveis.map(p => ({
      ID: p.userId,
      Nome: p.nome,
      Bairro: p.bairro,
      Lat: p.lat.toFixed(6),
      Lon: p.lon.toFixed(6),
      Categorias: p.categoryIds.join(', '),
      Expira: new Date(p.expiresAt).toLocaleTimeString('pt-BR')
    })));

    // 8. Criar arquivos vazios para claims e requests se não existirem
    const CLAIMS_FILE = path.join(DATA_DIR, 'active_claims.json');
    const REQUESTS_FILE = path.join(DATA_DIR, 'pending_requests.json');

    try {
      await fs.access(CLAIMS_FILE);
    } catch {
      await fs.writeFile(CLAIMS_FILE, '{}', 'utf-8');
      console.log('\n✅ Arquivo active_claims.json criado');
    }

    try {
      await fs.access(REQUESTS_FILE);
    } catch {
      await fs.writeFile(REQUESTS_FILE, '{}', 'utf-8');
      console.log('✅ Arquivo pending_requests.json criado');
    }

    console.log('\n🎉 Seed do Quick Service concluído com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Inicie o servidor: npm start');
    console.log('   2. Teste o endpoint: GET /quick-service/debug/state');
    console.log('   3. Solicite um serviço: POST /quick-service/request');
    console.log('\n💡 Dica: Os prestadores expiram em 1 hora. Para atualizar, rode este script novamente.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro ao executar seed:', err);
    process.exit(1);
  }
}

seedQuickService();
