const fs = require('fs').promises;
const path = require('path');
const lockfile = require('proper-lockfile');

const DATA_DIR = path.join(__dirname, '..', 'data_QuickService');
const PRESTADORES_FILE = path.join(DATA_DIR, 'available_prestadores.json');
const CLAIMS_FILE = path.join(DATA_DIR, 'active_claims.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'pending_requests.json');

// Criar diretório se não existir
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Carregar prestadores disponíveis (filtra expirados)
async function loadAvailablePrestadores() {
  await ensureDataDir();
  
  try {
    await fs.access(PRESTADORES_FILE);
  } catch {
    return [];
  }

  try {
    const data = await fs.readFile(PRESTADORES_FILE, 'utf-8');
    const prestadores = JSON.parse(data);
    const now = new Date();
    
    // Filtrar apenas não expirados
    return prestadores.filter(p => new Date(p.expiresAt) > now);
  } catch (err) {
    console.error('Erro ao carregar prestadores:', err);
    return [];
  }
}

// Salvar prestadores disponíveis
async function saveAvailablePrestadores(prestadores) {
  await ensureDataDir();
  
  try {
    // Tentar adquirir lock
    let release;
    try {
      release = await lockfile.lock(PRESTADORES_FILE, { 
        retries: { retries: 5, minTimeout: 100 },
        stale: 10000
      });
    } catch (err) {
      // Se arquivo não existe, criar vazio primeiro
      await fs.writeFile(PRESTADORES_FILE, '[]', 'utf-8');
      release = await lockfile.lock(PRESTADORES_FILE, { 
        retries: { retries: 5, minTimeout: 100 },
        stale: 10000
      });
    }
    
    try {
      await fs.writeFile(PRESTADORES_FILE, JSON.stringify(prestadores, null, 2), 'utf-8');
    } finally {
      await release();
    }
  } catch (err) {
    console.error('Erro ao salvar prestadores:', err);
    throw err;
  }
}

// Adicionar prestador disponível
async function addAvailablePrestador(prestador) {
  const prestadores = await loadAvailablePrestadores();
  
  // Remover entrada antiga se existir
  const filtered = prestadores.filter(p => p.userId !== prestador.userId);
  filtered.push(prestador);
  
  await saveAvailablePrestadores(filtered);
}

// Remover prestador disponível
async function removeAvailablePrestador(userId) {
  const prestadores = await loadAvailablePrestadores();
  const filtered = prestadores.filter(p => p.userId !== userId);
  await saveAvailablePrestadores(filtered);
}

// Carregar claims ativos
async function loadActiveClaims() {
  await ensureDataDir();
  
  try {
    await fs.access(CLAIMS_FILE);
  } catch {
    return {};
  }

  try {
    const data = await fs.readFile(CLAIMS_FILE, 'utf-8');
    const claims = JSON.parse(data);
    const now = new Date();
    
    // Filtrar apenas não expirados
    const validClaims = {};
    for (const [key, claim] of Object.entries(claims)) {
      if (new Date(claim.expiresAt) > now) {
        validClaims[key] = claim;
      }
    }
    
    return validClaims;
  } catch (err) {
    console.error('Erro ao carregar claims:', err);
    return {};
  }
}

// Salvar claims
async function saveActiveClaims(claims) {
  await ensureDataDir();
  
  try {
    let release;
    try {
      release = await lockfile.lock(CLAIMS_FILE, { 
        retries: { retries: 5, minTimeout: 100 },
        stale: 10000
      });
    } catch (err) {
      await fs.writeFile(CLAIMS_FILE, '{}', 'utf-8');
      release = await lockfile.lock(CLAIMS_FILE, { 
        retries: { retries: 5, minTimeout: 100 },
        stale: 10000
      });
    }
    
    try {
      await fs.writeFile(CLAIMS_FILE, JSON.stringify(claims, null, 2), 'utf-8');
    } finally {
      await release();
    }
  } catch (err) {
    console.error('Erro ao salvar claims:', err);
    throw err;
  }
}

// Tentar reservar prestador atomicamente (simula SETNX)
async function claimPrestador(prestadorId, requestId, ttlSeconds = 30) {
  const claims = await loadActiveClaims();
  const key = `prestador_${prestadorId}`;
  const now = new Date();

  // Verificar se já existe claim válido
  if (claims[key]) {
    const expiresAt = new Date(claims[key].expiresAt);
    if (expiresAt > now) {
      return false; // Já reservado
    }
  }

  // Criar claim com TTL
  claims[key] = {
    requestId,
    claimedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString()
  };

  await saveActiveClaims(claims);
  return true;
}

// Liberar claim de prestador
async function releaseClaim(prestadorId) {
  const claims = await loadActiveClaims();
  const key = `prestador_${prestadorId}`;
  delete claims[key];
  await saveActiveClaims(claims);
}

// Carregar pending requests
async function loadPendingRequests() {
  await ensureDataDir();
  
  try {
    await fs.access(REQUESTS_FILE);
  } catch {
    return {};
  }

  try {
    const data = await fs.readFile(REQUESTS_FILE, 'utf-8');
    const requests = JSON.parse(data);
    const now = new Date();
    
    // Filtrar apenas não expirados
    const validRequests = {};
    for (const [key, request] of Object.entries(requests)) {
      if (new Date(request.expiresAt) > now) {
        validRequests[key] = request;
      }
    }
    
    return validRequests;
  } catch (err) {
    console.error('Erro ao carregar requests:', err);
    return {};
  }
}

// Salvar pending requests
async function savePendingRequests(requests) {
  await ensureDataDir();
  
  try {
    let release;
    try {
      release = await lockfile.lock(REQUESTS_FILE, { 
        retries: { retries: 5, minTimeout: 100 },
        stale: 10000
      });
    } catch (err) {
      await fs.writeFile(REQUESTS_FILE, '{}', 'utf-8');
      release = await lockfile.lock(REQUESTS_FILE, { 
        retries: { retries: 5, minTimeout: 100 },
        stale: 10000
      });
    }
    
    try {
      await fs.writeFile(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8');
    } finally {
      await release();
    }
  } catch (err) {
    console.error('Erro ao salvar requests:', err);
    throw err;
  }
}

// Adicionar request
async function addPendingRequest(requestId, requestData) {
  const requests = await loadPendingRequests();
  requests[requestId] = requestData;
  await savePendingRequests(requests);
}

// Remover request
async function removePendingRequest(requestId) {
  const requests = await loadPendingRequests();
  delete requests[requestId];
  await savePendingRequests(requests);
}

// Cleanup de expirados (rodar periodicamente)
async function cleanupExpired() {
  const now = new Date();

  // Limpar prestadores expirados
  const prestadores = await loadAvailablePrestadores();
  const validPrestadores = prestadores.filter(p => new Date(p.expiresAt) > now);
  if (validPrestadores.length !== prestadores.length) {
    await saveAvailablePrestadores(validPrestadores);
  }

  // Limpar claims expirados
  const claims = await loadActiveClaims();
  const validClaims = {};
  let claimsChanged = false;
  
  for (const [key, claim] of Object.entries(claims)) {
    if (new Date(claim.expiresAt) > now) {
      validClaims[key] = claim;
    } else {
      claimsChanged = true;
    }
  }
  
  if (claimsChanged) {
    await saveActiveClaims(validClaims);
  }

  // Limpar requests expirados
  const requests = await loadPendingRequests();
  const validRequests = {};
  let requestsChanged = false;
  
  for (const [key, request] of Object.entries(requests)) {
    if (new Date(request.expiresAt) > now) {
      validRequests[key] = request;
    } else {
      requestsChanged = true;
    }
  }
  
  if (requestsChanged) {
    await savePendingRequests(validRequests);
  }
}

module.exports = {
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
};
