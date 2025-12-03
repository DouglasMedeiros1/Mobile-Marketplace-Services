// routes/quickService.js - Sistema de Serviços Rápidos
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { filterByProximity } = require('../utils/geolocation');
const { 
  loadAvailablePrestadores,
  claimPrestador,
  releaseClaim,
  addPendingRequest,
  removePendingRequest
} = require('../utils/quickServiceStorage');
const { v4: uuidv4 } = require('uuid');
const { 
  notifyUser, 
  sendQuickServiceRequest 
} = require('../wsManager');

// POST /quick-service/request - Cliente solicita serviço rápido
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { lat, lon, categoryId, descricao, valorMinimo } = req.body;

    // Validações básicas
    if (!lat || !lon || !categoryId || !valorMinimo) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: lat, lon, categoryId, valorMinimo' 
      });
    }

    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'Latitude inválida (deve estar entre -90 e 90)' });
    }

    if (typeof lon !== 'number' || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Longitude inválida (deve estar entre -180 e 180)' });
    }

    if (valorMinimo <= 0) {
      return res.status(400).json({ error: 'Valor do serviço deve ser maior que 0' });
    }

    // Verificar se usuário é cliente
    const userRoles = await db`
      SELECT role FROM role_user WHERE user_id = ${clienteId}
    `;
    const isCliente = userRoles.some(r => r.role === 'cliente');

    if (!isCliente) {
      return res.status(403).json({ error: 'Apenas clientes podem solicitar serviços rápidos' });
    }

    // Verificar se categoria existe
    const categoria = await db`SELECT id, nome FROM categories WHERE id = ${categoryId}`;
    if (categoria.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Buscar dados do cliente
    const cliente = await db`SELECT id, nome FROM users WHERE id = ${clienteId}`;
    if (cliente.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const requestId = uuidv4();
    
    // Salvar request em pending (com TTL de 5 minutos)
    await addPendingRequest(requestId, {
      clienteId,
      lat,
      lon,
      categoryId,
      descricao: descricao || '',
      valorMinimo,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      currentPrestadorIndex: 0,
      notifiedPrestadores: []
    });

    // Carregar prestadores disponíveis do JSON (não armazena coords no DB)
    const prestadoresDisponiveis = await loadAvailablePrestadores();
    
    // Filtrar por categoria e proximidade (raio máximo 5km = 5000m)
    const prestadoresProximos = filterByProximity(
      prestadoresDisponiveis.filter(p => p.categoryIds.includes(categoryId)),
      lat,
      lon,
      5000 // 5km
    );

    if (prestadoresProximos.length === 0) {
      await removePendingRequest(requestId);
      return res.status(404).json({ 
        success: false, 
        message: 'Nenhum prestador disponível na sua região' 
      });
    }

    // Iterar prestadores em ordem de proximidade
    for (const prestador of prestadoresProximos) {
      try {
        // Tentar reservar prestador atomicamente
        const claimed = await claimPrestador(prestador.userId, requestId, 30);
        
        if (!claimed) {
          continue; // Prestador já reservado, próximo
        }

        // Notificar prestador via WebSocket
        const notificationPayload = {
          type: 'quick_service_request',
          requestId,
          clienteId,
          clienteNome: cliente[0].nome,
          categoryId,
          categoriaNome: categoria[0].nome,
          descricao: descricao || 'Serviço rápido solicitado',
          valorMinimo,
          distanceMeters: Math.round(prestador.distance)
        };

        try {
          // Aguardar resposta do prestador (timeout 15s)
          const response = await sendQuickServiceRequest(
            prestador.userId, 
            notificationPayload, 
            15000
          );

          if (response === 'accept') {
            // Prestador aceitou - criar serviço no DB
            try {
              const result = await db.begin(async tx => {
                // 1. Criar service (quick = true, sem data/local)
                const service = await tx`
                  INSERT INTO services (
                    nome, descricao, valor_minimo, valor_maximo, 
                    data_inicio, data_fim, local, user_id, category_id, quick
                  )
                  VALUES (
                    'Serviço Rápido',
                    ${descricao || 'Serviço rápido solicitado'},
                    ${valorMinimo},
                    ${valorMinimo},
                    NULL,
                    NULL,
                    NULL,
                    ${clienteId},
                    ${categoryId},
                    TRUE
                  )
                  RETURNING id
                `;

                const serviceId = service[0].id;

                // 2. Criar proposal já aceita (valor = valor_minimo do serviço)
                await tx`
                  INSERT INTO proposals (service_id, prestador_id, valor, mensagem, status)
                  VALUES (
                    ${serviceId}, 
                    ${prestador.userId}, 
                    ${valorMinimo}, 
                    'Proposta aceita automaticamente via serviço rápido',
                    'aceito'
                  )
                `;

                // 3. Criar record_service com status 'em andamento'
                await tx`
                  INSERT INTO record_service (
                    service_id, prestador_id, cliente_id, valor, 
                    data_inicio, data_fim, status
                  )
                  VALUES (
                    ${serviceId},
                    ${prestador.userId},
                    ${clienteId},
                    ${valorMinimo},
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP + INTERVAL '2 hours',
                    'em andamento'
                  )
                `;

                return { serviceId, prestadorId: prestador.userId };
              });

              // Transação bem-sucedida - notificar ambos
              notifyUser(clienteId, {
                type: 'quick_service_matched',
                serviceId: result.serviceId,
                prestadorId: result.prestadorId,
                prestadorNome: prestador.nome
              });

              notifyUser(result.prestadorId, {
                type: 'quick_service_started',
                serviceId: result.serviceId,
                clienteId,
                clienteNome: cliente[0].nome
              });

              // Limpar claim e request
              await releaseClaim(prestador.userId);
              await removePendingRequest(requestId);

              return res.json({
                success: true,
                serviceId: result.serviceId,
                prestadorId: result.prestadorId,
                prestadorNome: prestador.nome
              });

            } catch (dbError) {
              console.error('Erro ao criar serviço rápido no DB:', dbError);
              await releaseClaim(prestador.userId);
              continue; // Tentar próximo prestador
            }
          } else {
            // Prestador recusou
            await releaseClaim(prestador.userId);
            continue;
          }

        } catch (wsError) {
          // Timeout ou erro de WebSocket
          console.error('Erro ao notificar prestador:', wsError.message);
          await releaseClaim(prestador.userId);
          continue; // Tentar próximo prestador
        }

      } catch (err) {
        console.error('Erro no loop de prestadores:', err);
        continue;
      }
    }

    // Nenhum prestador aceitou
    await removePendingRequest(requestId);
    return res.status(404).json({
      success: false,
      message: 'Nenhum prestador aceitou o serviço'
    });

  } catch (err) {
    console.error('POST /quick-service/request ERROR:', err);
    res.status(500).json({ error: 'Erro ao processar solicitação de serviço rápido' });
  }
});

// GET /quick-service/available-prestadores (debug/admin)
router.get('/available-prestadores', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    const userRoles = await db`
      SELECT role FROM role_user WHERE user_id = ${req.user.id}
    `;
    const isAdmin = userRoles.some(r => r.role === 'admin');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso permitido apenas para administradores' });
    }

    const prestadores = await loadAvailablePrestadores();
    res.json(prestadores);
  } catch (err) {
    console.error('GET /quick-service/available-prestadores ERROR:', err);
    res.status(500).json({ error: 'Erro ao buscar prestadores disponíveis' });
  }
});

module.exports = router;
