// Script para verificar e configurar usuários para teste de chat
const db = require('./db');

async function setupChatTestUsers() {
  console.log('🔍 Verificando usuários e roles...\n');

  try {
    // Verificar usuários existentes
    const users = await db`
      SELECT u.id, u.nome, u.email, ARRAY_AGG(ru.role) as roles
      FROM users u
      LEFT JOIN role_user ru ON u.id = ru.user_id
      GROUP BY u.id, u.nome, u.email
      ORDER BY u.id
    `;

    console.log('📋 Usuários no banco:');
    users.forEach(user => {
      console.log(`  ID: ${user.id} | Nome: ${user.nome} | Email: ${user.email}`);
      console.log(`    Roles: ${user.roles[0] ? user.roles.join(', ') : 'NENHUMA ❌'}`);
    });

    // Verificar se Maria (ID 1) tem role de cliente
    const maria = users.find(u => u.id === 1);
    if (maria && !maria.roles.includes('cliente')) {
      console.log('\n➕ Adicionando role "cliente" para Maria (ID 1)...');
      await db`INSERT INTO role_user (user_id, role) VALUES (1, 'cliente') ON CONFLICT DO NOTHING`;
    }

    // Verificar se João (ID 5) tem role de prestador
    const joao = users.find(u => u.id === 5);
    if (joao && !joao.roles.includes('prestador')) {
      console.log('➕ Adicionando role "prestador" para João (ID 5)...');
      await db`INSERT INTO role_user (user_id, role) VALUES (5, 'prestador') ON CONFLICT DO NOTHING`;
    }

    // Verificar roles após inserção
    const updatedUsers = await db`
      SELECT u.id, u.nome, ARRAY_AGG(ru.role) as roles
      FROM users u
      LEFT JOIN role_user ru ON u.id = ru.user_id
      WHERE u.id IN (1, 5)
      GROUP BY u.id, u.nome
    `;

    console.log('\n✅ Configuração final:');
    updatedUsers.forEach(user => {
      console.log(`  ${user.nome} (ID ${user.id}): ${user.roles.join(', ')}`);
    });

    console.log('\n💡 Para testar o chat:');
    console.log('  1. Faça login como Maria (maria@example.com) - CLIENTE');
    console.log('  2. Vá para tela de Chat');
    console.log('  3. WebSocket conectará automaticamente');
    console.log('  4. Na ChatScreen, envie mensagem com otherUserId: 5 (João - PRESTADOR)');
    console.log('  5. Ou faça login como João (joao@example.com) e envie para otherUserId: 1 (Maria)');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await db.end();
  }
}

setupChatTestUsers();
