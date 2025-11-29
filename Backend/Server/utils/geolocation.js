/**
 * Calcula distância entre dois pontos usando fórmula de Haversine
 * @param {number} lat1 - Latitude do ponto 1 (graus)
 * @param {number} lon1 - Longitude do ponto 1 (graus)
 * @param {number} lat2 - Latitude do ponto 2 (graus)
 * @param {number} lon2 - Longitude do ponto 2 (graus)
 * @returns {number} Distância em metros
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000; // Raio da Terra em metros

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Filtra e ordena prestadores por proximidade
 * @param {Array} prestadores - Array de prestadores com lat/lon
 * @param {number} clienteLat - Latitude do cliente
 * @param {number} clienteLon - Longitude do cliente
 * @param {number} maxRadiusMeters - Raio máximo em metros
 * @returns {Array} Array ordenado por distância ASC com campo distance adicionado
 */
function filterByProximity(prestadores, clienteLat, clienteLon, maxRadiusMeters) {
  return prestadores
    .map(p => ({
      ...p,
      distance: haversineDistance(clienteLat, clienteLon, p.lat, p.lon)
    }))
    .filter(p => p.distance <= maxRadiusMeters)
    .sort((a, b) => a.distance - b.distance);
}

module.exports = { haversineDistance, filterByProximity };
