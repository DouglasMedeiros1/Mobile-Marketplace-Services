// jobs/reportNotifications.js
const cron = require('node-cron');
const {
  getUsersToNotify,
  generateUserReport,
  formatClienteNotification,
  formatPrestadorNotification,
  updateLastSent
} = require('../services/reportNotificationService');
const { sendNotificationToUser } = require('../wsManager');

/**
 * Processa notificações de relatórios para todos os usuários elegíveis
 */
async function processReportNotifications() {
  try {
    console.log('[Report Notifications] Verificando usuários para notificar...');
    
    const usersToNotify = await getUsersToNotify();
    
    if (usersToNotify.length === 0) {
      console.log('[Report Notifications] Nenhum usuário para notificar neste momento.');
      return;
    }

    console.log(`[Report Notifications] Processando ${usersToNotify.length} usuário(s)...`);

    for (const user of usersToNotify) {
      try {
        // Gerar relatório do usuário
        const report = await generateUserReport(user.user_id);
        
        // Enviar notificação para cada role
        if (report.reports.cliente) {
          const notification = formatClienteNotification(
            report.reports.cliente,
            report.userName,
            user.report_frequency
          );
          
          // Enviar via WebSocket (in-app)
          if (user.notification_method === 'in-app' || user.notification_method === 'both') {
            sendNotificationToUser(user.user_id, {
              type: 'report',
              role: 'cliente',
              ...notification,
              timestamp: new Date().toISOString()
            });
          }
          
          // TODO: Enviar via email se necessário
          if (user.notification_method === 'email' || user.notification_method === 'both') {
            // Implementar envio de email aqui
            console.log(`[Report Notifications] Email para ${user.email} (cliente) - TODO`);
          }
        }

        if (report.reports.prestador) {
          const notification = formatPrestadorNotification(
            report.reports.prestador,
            report.userName,
            user.report_frequency
          );
          
          // Enviar via WebSocket (in-app)
          if (user.notification_method === 'in-app' || user.notification_method === 'both') {
            sendNotificationToUser(user.user_id, {
              type: 'report',
              role: 'prestador',
              ...notification,
              timestamp: new Date().toISOString()
            });
          }
          
          // TODO: Enviar via email se necessário
          if (user.notification_method === 'email' || user.notification_method === 'both') {
            // Implementar envio de email aqui
            console.log(`[Report Notifications] Email para ${user.email} (prestador) - TODO`);
          }
        }

        // Atualizar timestamp de último envio
        await updateLastSent(user.user_id);
        
        console.log(`[Report Notifications] ✓ Notificação enviada para usuário ${user.user_id} (${user.nome})`);
      } catch (err) {
        console.error(`[Report Notifications] Erro ao processar usuário ${user.user_id}:`, err);
        // Continuar processando outros usuários
      }
    }

    console.log('[Report Notifications] Processamento concluído.');
  } catch (err) {
    console.error('[Report Notifications] Erro ao processar notificações:', err);
  }
}

/**
 * Inicializa o agendamento de notificações
 * Executa a cada minuto para verificar se há notificações a enviar
 */
function startReportNotificationScheduler() {
  // Executa a cada minuto (0 * * * * *)
  // Em produção, você pode ajustar para executar com menos frequência
  cron.schedule('* * * * *', async () => {
    await processReportNotifications();
  });

  console.log('[Report Notifications] Agendador de notificações iniciado (executa a cada minuto).');
}

module.exports = {
  startReportNotificationScheduler,
  processReportNotifications
};
