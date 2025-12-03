// services/reportNotificationService.js
const db = require('../db');

/**
 * Busca dados do dashboard do cliente para notificação
 */
async function getClienteReportData(userId) {
  try {
    // Total de serviços criados
    const totalServicos = await db`
      SELECT COUNT(*)::int as total
      FROM services
      WHERE user_id = ${userId}
    `;

    // Serviços por status
    const servicosPorStatus = await db`
      SELECT 
        COUNT(CASE WHEN rs.status = 'concluido' THEN 1 END)::int as concluidos,
        COUNT(CASE WHEN rs.status = 'em andamento' THEN 1 END)::int as em_andamento
      FROM services s
      LEFT JOIN record_service rs ON s.id = rs.service_id
      WHERE s.user_id = ${userId}
    `;

    // Propostas aceitas
    const propostasAceitas = await db`
      SELECT COUNT(*)::int as total
      FROM proposals p
      INNER JOIN services s ON p.service_id = s.id
      WHERE s.user_id = ${userId} AND p.status = 'aceito'
    `;

    // Total gasto
    const totalGasto = await db`
      SELECT COALESCE(SUM(rs.valor), 0)::numeric as total
      FROM record_service rs
      WHERE rs.cliente_id = ${userId} AND rs.status = 'concluido'
    `;

    return {
      totalServicos: totalServicos[0].total,
      servicosConcluidos: servicosPorStatus[0].concluidos,
      servicosEmAndamento: servicosPorStatus[0].em_andamento,
      propostasAceitas: propostasAceitas[0].total,
      totalGasto: parseFloat(totalGasto[0].total)
    };
  } catch (err) {
    console.error('Erro ao buscar dados de relatório do cliente:', err);
    throw err;
  }
}

/**
 * Busca dados do dashboard do prestador para notificação
 */
async function getPrestadorReportData(userId) {
  try {
    // Total de propostas criadas
    const totalPropostas = await db`
      SELECT COUNT(*)::int as total
      FROM proposals
      WHERE prestador_id = ${userId}
    `;

    // Propostas aceitas
    const propostasAceitas = await db`
      SELECT COUNT(*)::int as total
      FROM proposals
      WHERE prestador_id = ${userId} AND status = 'aceito'
    `;

    // Serviços finalizados
    const servicosFinalizados = await db`
      SELECT COUNT(*)::int as total
      FROM record_service
      WHERE prestador_id = ${userId} AND status = 'concluido'
    `;

    // Serviços em andamento
    const servicosEmAndamento = await db`
      SELECT COUNT(*)::int as total
      FROM record_service
      WHERE prestador_id = ${userId} AND status = 'em andamento'
    `;

    // Valor total ganho
    const valorTotalGanho = await db`
      SELECT COALESCE(SUM(valor), 0)::numeric as total
      FROM record_service
      WHERE prestador_id = ${userId} AND status = 'concluido'
    `;

    // Avaliação média
    const avaliacaoMedia = await db`
      SELECT COALESCE(AVG(avaliacao_prestador), 0)::numeric(3,2) as media
      FROM record_service
      WHERE prestador_id = ${userId} AND avaliacao_prestador IS NOT NULL
    `;

    return {
      totalPropostas: totalPropostas[0].total,
      propostasAceitas: propostasAceitas[0].total,
      servicosFinalizados: servicosFinalizados[0].total,
      servicosEmAndamento: servicosEmAndamento[0].total,
      valorTotalGanho: parseFloat(valorTotalGanho[0].total),
      avaliacaoMedia: parseFloat(avaliacaoMedia[0].media)
    };
  } catch (err) {
    console.error('Erro ao buscar dados de relatório do prestador:', err);
    throw err;
  }
}

/**
 * Formata mensagem de notificação para cliente
 */
function formatClienteNotification(data, userName, period) {
  const periodText = period === 'daily' ? 'hoje' : period === 'weekly' ? 'esta semana' : 'este mês';
  
  return {
    title: `📊 Seu Relatório ${period === 'daily' ? 'Diário' : period === 'weekly' ? 'Semanal' : 'Mensal'}`,
    message: `Olá ${userName}! Aqui está seu resumo ${periodText}:\n\n` +
             `📝 Serviços criados: ${data.totalServicos}\n` +
             `✅ Serviços concluídos: ${data.servicosConcluidos}\n` +
             `⏳ Em andamento: ${data.servicosEmAndamento}\n` +
             `🤝 Propostas aceitas: ${data.propostasAceitas}\n` +
             `💰 Total gasto: R$ ${data.totalGasto.toFixed(2)}`,
    data: data
  };
}

/**
 * Formata mensagem de notificação para prestador
 */
function formatPrestadorNotification(data, userName, period) {
  const periodText = period === 'daily' ? 'hoje' : period === 'weekly' ? 'esta semana' : 'este mês';
  
  return {
    title: `📊 Seu Relatório ${period === 'daily' ? 'Diário' : period === 'weekly' ? 'Semanal' : 'Mensal'}`,
    message: `Olá ${userName}! Aqui está seu resumo ${periodText}:\n\n` +
             `💼 Propostas enviadas: ${data.totalPropostas}\n` +
             `✅ Propostas aceitas: ${data.propostasAceitas}\n` +
             `🎯 Serviços finalizados: ${data.servicosFinalizados}\n` +
             `⏳ Em andamento: ${data.servicosEmAndamento}\n` +
             `💰 Total ganho: R$ ${data.valorTotalGanho.toFixed(2)}\n` +
             `⭐ Avaliação média: ${data.avaliacaoMedia.toFixed(1)}/5.0`,
    data: data
  };
}

/**
 * Gera relatório completo para um usuário
 */
async function generateUserReport(userId) {
  try {
    // Buscar informações do usuário
    const user = await db`
      SELECT u.id, u.nome, u.email, array_agg(ru.role) as roles
      FROM users u
      LEFT JOIN role_user ru ON u.id = ru.user_id
      WHERE u.id = ${userId}
      GROUP BY u.id, u.nome, u.email
    `;

    if (user.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const userData = user[0];
    const roles = userData.roles || [];
    const reports = {};

    // Gerar relatório para cada role do usuário
    if (roles.includes('cliente')) {
      const clienteData = await getClienteReportData(userId);
      reports.cliente = clienteData;
    }

    if (roles.includes('prestador')) {
      const prestadorData = await getPrestadorReportData(userId);
      reports.prestador = prestadorData;
    }

    return {
      userId: userData.id,
      userName: userData.nome,
      email: userData.email,
      roles: roles,
      reports: reports
    };
  } catch (err) {
    console.error('Erro ao gerar relatório do usuário:', err);
    throw err;
  }
}

/**
 * Busca usuários que devem receber notificação agora
 */
async function getUsersToNotify() {
  try {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentDayOfMonth = now.getDate();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Buscar usuários com notificações habilitadas
    const users = await db`
      SELECT 
        unp.user_id,
        unp.report_frequency,
        unp.report_day_of_week,
        unp.report_day_of_month,
        unp.report_time,
        unp.notification_method,
        unp.last_sent_at,
        u.nome,
        u.email,
        array_agg(ru.role) as roles
      FROM user_notification_preferences unp
      INNER JOIN users u ON unp.user_id = u.id
      LEFT JOIN role_user ru ON u.id = ru.user_id
      WHERE unp.report_enabled = true
      GROUP BY unp.user_id, unp.report_frequency, unp.report_day_of_week, 
               unp.report_day_of_month, unp.report_time, unp.notification_method, 
               unp.last_sent_at, u.nome, u.email
    `;

    // Filtrar usuários que devem receber notificação agora
    const usersToNotify = users.filter(user => {
      const reportTime = user.report_time;
      const lastSent = user.last_sent_at ? new Date(user.last_sent_at) : null;

      // Verificar se já foi enviado hoje
      if (lastSent) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (lastSent >= today) {
          return false; // Já enviado hoje
        }
      }

      // Verificar hora
      const userTime = reportTime.substring(0, 5); // "HH:MM"
      if (userTime !== currentTime) {
        return false;
      }

      // Verificar frequência
      if (user.report_frequency === 'daily') {
        return true;
      }

      if (user.report_frequency === 'weekly') {
        return user.report_day_of_week === currentDayOfWeek;
      }

      if (user.report_frequency === 'monthly') {
        return user.report_day_of_month === currentDayOfMonth;
      }

      return false;
    });

    return usersToNotify;
  } catch (err) {
    console.error('Erro ao buscar usuários para notificar:', err);
    throw err;
  }
}

/**
 * Atualiza timestamp de último envio
 */
async function updateLastSent(userId) {
  try {
    await db`
      UPDATE user_notification_preferences
      SET last_sent_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `;
  } catch (err) {
    console.error('Erro ao atualizar last_sent_at:', err);
    throw err;
  }
}

module.exports = {
  getClienteReportData,
  getPrestadorReportData,
  formatClienteNotification,
  formatPrestadorNotification,
  generateUserReport,
  getUsersToNotify,
  updateLastSent
};
