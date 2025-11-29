// routes/dashboards.js
const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs');
const db = dbModule.default;
const { authenticateToken, isAdmin } = require('../middleware/auth');

/**
 * GET /dashboards/cliente/:userId
 * Retorna dashboard completo do cliente
 * Requer: autenticação (admin ou próprio usuário)
 */
router.get('/cliente/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Validar permissão (só admin ou próprio usuário)
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar se usuário tem role de cliente
    const userRole = await db`
      SELECT role FROM role_user 
      WHERE user_id = ${userId} AND role = 'cliente'
    `;

    if (userRole.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // 1. Total de serviços criados pelo cliente
    const totalServicos = await db`
      SELECT COUNT(*)::int as total
      FROM services
      WHERE user_id = ${userId}
    `;

    // 2. Serviços por status
    const servicosPorStatus = await db`
      SELECT 
        COUNT(CASE WHEN rs.status = 'aberto' THEN 1 END)::int as abertos,
        COUNT(CASE WHEN rs.status = 'em andamento' THEN 1 END)::int as em_andamento,
        COUNT(CASE WHEN rs.status = 'concluido' THEN 1 END)::int as concluidos,
        COUNT(CASE WHEN rs.status = 'cancelado' THEN 1 END)::int as cancelados
      FROM services s
      LEFT JOIN record_service rs ON s.id = rs.service_id
      WHERE s.user_id = ${userId}
    `;

    // 3. Total de propostas recebidas
    const totalPropostasRecebidas = await db`
      SELECT COUNT(*)::int as total
      FROM proposals p
      INNER JOIN services s ON p.service_id = s.id
      WHERE s.user_id = ${userId}
    `;

    // 4. Propostas aceitas (status 'aceito')
    const propostasAceitas = await db`
      SELECT COUNT(*)::int as total
      FROM proposals p
      INNER JOIN services s ON p.service_id = s.id
      WHERE s.user_id = ${userId} AND p.status = 'aceito'
    `;

    // 5. Valor total das propostas aceitas
    const valorTotalAceito = await db`
      SELECT COALESCE(SUM(p.valor), 0)::numeric as total
      FROM proposals p
      INNER JOIN services s ON p.service_id = s.id
      WHERE s.user_id = ${userId} AND p.status = 'aceito'
    `;

    // 6. Avaliação média recebida pelo cliente
    const avaliacaoMedia = await db`
      SELECT COALESCE(AVG(avaliacao_cliente), 0)::numeric(3,2) as media
      FROM record_service
      WHERE cliente_id = ${userId} AND avaliacao_cliente IS NOT NULL
    `;

    // 7. Valor médio por serviço
    const valorMedioPorServico = await db`
      SELECT COALESCE(AVG(valor_minimo), 0)::numeric(10,2) as media
      FROM services
      WHERE user_id = ${userId}
    `;

    // 8. Serviços com proposta vs sem proposta
    const servicosComProposta = await db`
      SELECT 
        COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN s.id END)::int as com_proposta,
        COUNT(DISTINCT CASE WHEN p.id IS NULL THEN s.id END)::int as sem_proposta
      FROM services s
      LEFT JOIN proposals p ON s.id = p.service_id
      WHERE s.user_id = ${userId}
    `;

    // 9. Total gasto em serviços concluídos
    const totalGasto = await db`
      SELECT COALESCE(SUM(rs.valor), 0)::numeric as total
      FROM record_service rs
      WHERE rs.cliente_id = ${userId} AND rs.status = 'concluido'
    `;

    const dashboard = {
      userId,
      totalServicos: totalServicos[0].total,
      servicosAbertos: servicosPorStatus[0].abertos,
      servicosEmAndamento: servicosPorStatus[0].em_andamento,
      servicosConcluidos: servicosPorStatus[0].concluidos,
      servicosCancelados: servicosPorStatus[0].cancelados,
      totalPropostasRecebidas: totalPropostasRecebidas[0].total,
      propostasAceitas: propostasAceitas[0].total,
      valorTotalPropostasAceitas: parseFloat(valorTotalAceito[0].total),
      avaliacaoMedia: parseFloat(avaliacaoMedia[0].media),
      valorMedioPorServico: parseFloat(valorMedioPorServico[0].media),
      servicosComProposta: servicosComProposta[0].com_proposta,
      servicosSemProposta: servicosComProposta[0].sem_proposta,
      totalGasto: parseFloat(totalGasto[0].total)
    };

    res.json(dashboard);
  } catch (err) {
    console.error('Erro ao buscar dashboard do cliente:', err);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

/**
 * GET /dashboards/prestador/:userId
 * Retorna dashboard completo do prestador
 * Requer: autenticação (admin ou próprio usuário)
 */
router.get('/prestador/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Validar permissão (só admin ou próprio usuário)
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar se usuário tem role de prestador
    const userRole = await db`
      SELECT role FROM role_user 
      WHERE user_id = ${userId} AND role = 'prestador'
    `;

    if (userRole.length === 0) {
      return res.status(404).json({ error: 'Prestador não encontrado' });
    }

    // 1. Total de propostas criadas
    const totalPropostasCriadas = await db`
      SELECT COUNT(*)::int as total
      FROM proposals
      WHERE prestador_id = ${userId}
    `;

    // 2. Propostas por status
    const propostasPorStatus = await db`
      SELECT 
        COUNT(CASE WHEN status = 'aberto' THEN 1 END)::int as abertas,
        COUNT(CASE WHEN status = 'aceito' THEN 1 END)::int as aceitas,
        COUNT(CASE WHEN status = 'rejeitado' THEN 1 END)::int as rejeitadas,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END)::int as canceladas
      FROM proposals
      WHERE prestador_id = ${userId}
    `;

    // 3. Serviços finalizados
    const servicosFinalizados = await db`
      SELECT COUNT(*)::int as total
      FROM record_service
      WHERE prestador_id = ${userId} AND status = 'concluido'
    `;

    // 4. Serviços em andamento
    const servicosEmAndamento = await db`
      SELECT COUNT(*)::int as total
      FROM record_service
      WHERE prestador_id = ${userId} AND status = 'em andamento'
    `;

    // 5. Valor total ganho (serviços concluídos)
    const valorTotalGanho = await db`
      SELECT COALESCE(SUM(valor), 0)::numeric as total
      FROM record_service
      WHERE prestador_id = ${userId} AND status = 'concluido'
    `;

    // 6. Valor total em andamento
    const valorEmAndamento = await db`
      SELECT COALESCE(SUM(valor), 0)::numeric as total
      FROM record_service
      WHERE prestador_id = ${userId} AND status = 'em andamento'
    `;

    // 7. Avaliação média recebida
    const avaliacaoMedia = await db`
      SELECT COALESCE(AVG(avaliacao_prestador), 0)::numeric(3,2) as media
      FROM record_service
      WHERE prestador_id = ${userId} AND avaliacao_prestador IS NOT NULL
    `;

    // 8. Taxa de aceitação (propostas aceitas / total propostas)
    const taxaAceitacao = totalPropostasCriadas[0].total > 0
      ? ((propostasPorStatus[0].aceitas / totalPropostasCriadas[0].total) * 100).toFixed(2)
      : 0;

    // 9. Valor médio por serviço concluído
    const valorMedioPorServico = await db`
      SELECT COALESCE(AVG(valor), 0)::numeric(10,2) as media
      FROM record_service
      WHERE prestador_id = ${userId} AND status = 'concluido'
    `;

    // 10. Total de clientes únicos atendidos
    const clientesAtendidos = await db`
      SELECT COUNT(DISTINCT cliente_id)::int as total
      FROM record_service
      WHERE prestador_id = ${userId}
    `;

    // 11. Categorias mais trabalhadas
    const categoriasMaisTrabalhadas = await db`
      SELECT 
        c.nome,
        COUNT(*)::int as quantidade
      FROM record_service rs
      INNER JOIN services s ON rs.service_id = s.id
      INNER JOIN categories c ON s.category_id = c.id
      WHERE rs.prestador_id = ${userId}
      GROUP BY c.id, c.nome
      ORDER BY quantidade DESC
      LIMIT 5
    `;

    const dashboard = {
      userId,
      totalPropostasCriadas: totalPropostasCriadas[0].total,
      propostasAbertas: propostasPorStatus[0].abertas,
      propostasAceitas: propostasPorStatus[0].aceitas,
      propostasRejeitadas: propostasPorStatus[0].rejeitadas,
      propostasCanceladas: propostasPorStatus[0].canceladas,
      servicosFinalizados: servicosFinalizados[0].total,
      servicosEmAndamento: servicosEmAndamento[0].total,
      valorTotalGanho: parseFloat(valorTotalGanho[0].total),
      valorEmAndamento: parseFloat(valorEmAndamento[0].total),
      avaliacaoMedia: parseFloat(avaliacaoMedia[0].media),
      taxaAceitacao: parseFloat(taxaAceitacao),
      valorMedioPorServico: parseFloat(valorMedioPorServico[0].media),
      clientesAtendidos: clientesAtendidos[0].total,
      categoriasMaisTrabalhadas: categoriasMaisTrabalhadas.map(cat => ({
        nome: cat.nome,
        quantidade: cat.quantidade
      }))
    };

    res.json(dashboard);
  } catch (err) {
    console.error('Erro ao buscar dashboard do prestador:', err);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

/**
 * GET /dashboards/plataforma
 * Retorna dashboard geral da plataforma
 * Requer: autenticação como admin
 */
router.get('/plataforma', authenticateToken, isAdmin, async (req, res) => {
  try {
    // 1. Total de usuários por role
    const usuariosPorRole = await db`
      SELECT 
        role,
        COUNT(DISTINCT user_id)::int as total
      FROM role_user
      GROUP BY role
    `;

    // 2. Total de serviços criados
    const totalServicos = await db`
      SELECT COUNT(*)::int as total
      FROM services
    `;

    // 3. Serviços por status (via record_service)
    const servicosPorStatus = await db`
      SELECT 
        COUNT(CASE WHEN status = 'aberto' THEN 1 END)::int as abertos,
        COUNT(CASE WHEN status = 'em andamento' THEN 1 END)::int as em_andamento,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END)::int as concluidos,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END)::int as cancelados
      FROM record_service
    `;

    // 4. Total de propostas
    const totalPropostas = await db`
      SELECT COUNT(*)::int as total
      FROM proposals
    `;

    // 5. Média de propostas por serviço
    const mediaPropostasPorServico = await db`
      SELECT COALESCE(AVG(proposta_count), 0)::numeric(10,2) as media
      FROM (
        SELECT s.id, COUNT(p.id) as proposta_count
        FROM services s
        LEFT JOIN proposals p ON s.id = p.service_id
        GROUP BY s.id
      ) AS subquery
    `;

    // 6. Valor total movimentado (serviços concluídos)
    const valorTotalMovimentado = await db`
      SELECT COALESCE(SUM(valor), 0)::numeric as total
      FROM record_service
      WHERE status = 'concluido'
    `;

    // 7. Valor médio por serviço concluído
    const valorMedioPorServico = await db`
      SELECT COALESCE(AVG(valor), 0)::numeric(10,2) as media
      FROM record_service
      WHERE status = 'concluido'
    `;

    // 8. Total de empresas cadastradas
    const totalEmpresas = await db`
      SELECT COUNT(*)::int as total
      FROM companies
    `;

    // 9. Categorias mais populares
    const categoriasMaisPopulares = await db`
      SELECT 
        c.nome,
        c.area,
        COUNT(s.id)::int as total_servicos
      FROM categories c
      LEFT JOIN services s ON c.id = s.category_id
      GROUP BY c.id, c.nome, c.area
      ORDER BY total_servicos DESC
      LIMIT 10
    `;

    // 10. Avaliação média geral da plataforma
    const avaliacaoMediaPlataforma = await db`
      SELECT 
        COALESCE(AVG(avaliacao_prestador), 0)::numeric(3,2) as media_prestador,
        COALESCE(AVG(avaliacao_cliente), 0)::numeric(3,2) as media_cliente
      FROM record_service
      WHERE avaliacao_prestador IS NOT NULL OR avaliacao_cliente IS NOT NULL
    `;

    // 11. Taxa de conclusão de serviços
    const totalRecordService = await db`
      SELECT COUNT(*)::int as total FROM record_service
    `;
    const taxaConclusao = totalRecordService[0].total > 0
      ? ((servicosPorStatus[0].concluidos / totalRecordService[0].total) * 100).toFixed(2)
      : 0;

    // 12. Serviços rápidos (quick = true)
    const servicosRapidos = await db`
      SELECT COUNT(*)::int as total
      FROM services
      WHERE quick = TRUE
    `;

    // 13. Crescimento mensal (últimos 6 meses)
    const crescimentoMensal = await db`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*)::int as total_servicos
      FROM services
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mes DESC
    `;

    // 14. Taxa de aceitação geral de propostas
    const propostasAceitas = await db`
      SELECT COUNT(*)::int as total
      FROM proposals
      WHERE status = 'aceito'
    `;
    const taxaAceitacaoGeral = totalPropostas[0].total > 0
      ? ((propostasAceitas[0].total / totalPropostas[0].total) * 100).toFixed(2)
      : 0;

    const dashboard = {
      usuarios: {
        total: usuariosPorRole.reduce((sum, role) => sum + role.total, 0),
        porRole: usuariosPorRole.reduce((obj, role) => {
          obj[role.role] = role.total;
          return obj;
        }, {})
      },
      servicos: {
        total: totalServicos[0].total,
        abertos: servicosPorStatus[0].abertos,
        emAndamento: servicosPorStatus[0].em_andamento,
        concluidos: servicosPorStatus[0].concluidos,
        cancelados: servicosPorStatus[0].cancelados,
        rapidos: servicosRapidos[0].total,
        taxaConclusao: parseFloat(taxaConclusao)
      },
      propostas: {
        total: totalPropostas[0].total,
        aceitas: propostasAceitas[0].total,
        mediaPorServico: parseFloat(mediaPropostasPorServico[0].media),
        taxaAceitacao: parseFloat(taxaAceitacaoGeral)
      },
      financeiro: {
        valorTotalMovimentado: parseFloat(valorTotalMovimentado[0].total),
        valorMedioPorServico: parseFloat(valorMedioPorServico[0].media)
      },
      avaliacoes: {
        mediaPrestadores: parseFloat(avaliacaoMediaPlataforma[0].media_prestador),
        mediaClientes: parseFloat(avaliacaoMediaPlataforma[0].media_cliente)
      },
      empresas: {
        total: totalEmpresas[0].total
      },
      categorias: categoriasMaisPopulares.map(cat => ({
        nome: cat.nome,
        area: cat.area,
        totalServicos: cat.total_servicos
      })),
      crescimento: crescimentoMensal.map(mes => ({
        mes: mes.mes,
        totalServicos: mes.total_servicos
      }))
    };

    res.json(dashboard);
  } catch (err) {
    console.error('Erro ao buscar dashboard da plataforma:', err);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

module.exports = router;
