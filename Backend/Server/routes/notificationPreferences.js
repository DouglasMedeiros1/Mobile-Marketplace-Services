// routes/notificationPreferences.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /notification-preferences
 * Retorna as preferências de notificação do usuário autenticado
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await db`
      SELECT 
        id,
        user_id,
        report_enabled,
        report_frequency,
        report_day_of_week,
        report_day_of_month,
        report_time,
        notification_method,
        last_sent_at,
        created_at,
        updated_at
      FROM user_notification_preferences
      WHERE user_id = ${userId}
    `;

    if (preferences.length === 0) {
      // Retornar valores padrão se não existir
      return res.json({
        user_id: userId,
        report_enabled: false,
        report_frequency: 'weekly',
        report_day_of_week: 1, // Segunda-feira
        report_day_of_month: 1,
        report_time: '09:00:00',
        notification_method: 'in-app',
        last_sent_at: null
      });
    }

    res.json(preferences[0]);
  } catch (err) {
    console.error('Erro ao buscar preferências de notificação:', err);
    res.status(500).json({ error: 'Erro ao buscar preferências de notificação' });
  }
});

/**
 * PUT /notification-preferences
 * Atualiza as preferências de notificação do usuário autenticado
 */
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      report_enabled,
      report_frequency,
      report_day_of_week,
      report_day_of_month,
      report_time,
      notification_method
    } = req.body;

    // Validações
    if (report_frequency && !['daily', 'weekly', 'monthly'].includes(report_frequency)) {
      return res.status(400).json({ 
        error: 'report_frequency deve ser "daily", "weekly" ou "monthly"' 
      });
    }

    if (report_day_of_week !== undefined && report_day_of_week !== null) {
      if (report_day_of_week < 0 || report_day_of_week > 6) {
        return res.status(400).json({ 
          error: 'report_day_of_week deve estar entre 0 (Domingo) e 6 (Sábado)' 
        });
      }
    }

    if (report_day_of_month !== undefined && report_day_of_month !== null) {
      if (report_day_of_month < 1 || report_day_of_month > 31) {
        return res.status(400).json({ 
          error: 'report_day_of_month deve estar entre 1 e 31' 
        });
      }
    }

    if (notification_method && !['in-app', 'email', 'both'].includes(notification_method)) {
      return res.status(400).json({ 
        error: 'notification_method deve ser "in-app", "email" ou "both"' 
      });
    }

    // Verificar se já existe registro
    const existing = await db`
      SELECT id FROM user_notification_preferences
      WHERE user_id = ${userId}
    `;

    let result;
    
    if (existing.length === 0) {
      // Criar novo registro
      result = await db`
        INSERT INTO user_notification_preferences (
          user_id,
          report_enabled,
          report_frequency,
          report_day_of_week,
          report_day_of_month,
          report_time,
          notification_method
        ) VALUES (
          ${userId},
          ${report_enabled ?? false},
          ${report_frequency ?? 'weekly'},
          ${report_day_of_week ?? 1},
          ${report_day_of_month ?? 1},
          ${report_time ?? '09:00'},
          ${notification_method ?? 'in-app'}
        )
        RETURNING *
      `;
    } else {
      // Atualizar registro existente
      const updates = [];
      const values = [];

      if (report_enabled !== undefined) {
        updates.push('report_enabled = $' + (values.length + 1));
        values.push(report_enabled);
      }
      if (report_frequency !== undefined) {
        updates.push('report_frequency = $' + (values.length + 1));
        values.push(report_frequency);
      }
      if (report_day_of_week !== undefined) {
        updates.push('report_day_of_week = $' + (values.length + 1));
        values.push(report_day_of_week);
      }
      if (report_day_of_month !== undefined) {
        updates.push('report_day_of_month = $' + (values.length + 1));
        values.push(report_day_of_month);
      }
      if (report_time !== undefined) {
        updates.push('report_time = $' + (values.length + 1));
        values.push(report_time);
      }
      if (notification_method !== undefined) {
        updates.push('notification_method = $' + (values.length + 1));
        values.push(notification_method);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      // Usar postgres.js corretamente
      const setClause = [];
      if (report_enabled !== undefined) setClause.push({ report_enabled });
      if (report_frequency !== undefined) setClause.push({ report_frequency });
      if (report_day_of_week !== undefined) setClause.push({ report_day_of_week });
      if (report_day_of_month !== undefined) setClause.push({ report_day_of_month });
      if (report_time !== undefined) setClause.push({ report_time });
      if (notification_method !== undefined) setClause.push({ notification_method });

      result = await db`
        UPDATE user_notification_preferences
        SET ${db(Object.assign({}, ...setClause))}
        WHERE user_id = ${userId}
        RETURNING *
      `;
    }

    res.json(result[0]);
  } catch (err) {
    console.error('Erro ao atualizar preferências de notificação:', err);
    res.status(500).json({ error: 'Erro ao atualizar preferências de notificação' });
  }
});

/**
 * DELETE /notification-preferences
 * Remove as preferências de notificação do usuário autenticado
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await db`
      DELETE FROM user_notification_preferences
      WHERE user_id = ${userId}
    `;

    res.json({ message: 'Preferências de notificação removidas com sucesso' });
  } catch (err) {
    console.error('Erro ao remover preferências de notificação:', err);
    res.status(500).json({ error: 'Erro ao remover preferências de notificação' });
  }
});

module.exports = router;
