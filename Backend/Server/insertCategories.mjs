import db from './db.mjs';

async function insertCategories() {
  try {
    console.log('Inserindo categorias...');
    
    await db`
      INSERT INTO categories (nome) VALUES 
      ('Limpeza'),
      ('Jardinagem'),
      ('Informática'),
      ('Aulas Particulares'),
      ('Reparos'),
      ('Beleza'),
      ('Transporte'),
      ('Eventos')
    `;
    
    console.log('✅ Categorias inseridas com sucesso!');
    
    const result = await db`SELECT * FROM categories ORDER BY id`;
    console.log('\nCategorias cadastradas:');
    console.table(result);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao inserir categorias:', err);
    process.exit(1);
  }
}

insertCategories();
