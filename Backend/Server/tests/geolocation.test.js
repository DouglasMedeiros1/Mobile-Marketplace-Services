// tests/geolocation.test.js - Testes para funções de geolocalização
const { haversineDistance, filterByProximity } = require('../utils/geolocation');

describe('Geolocation Utils', () => {
  describe('haversineDistance', () => {
    test('deve calcular distância zero entre coordenadas iguais', () => {
      const distance = haversineDistance(-23.5505, -46.6333, -23.5505, -46.6333);
      expect(distance).toBe(0);
    });

    test('deve calcular distância correta entre dois pontos conhecidos', () => {
      // São Paulo (Av. Paulista) -> São Paulo (Aeroporto Congonhas)
      // Distância real aproximada: ~10km
      const lat1 = -23.5505; // Av. Paulista
      const lon1 = -46.6333;
      const lat2 = -23.6261; // Congonhas
      const lon2 = -46.6562;
      
      const distance = haversineDistance(lat1, lon1, lat2, lon2);
      
      // Verificar se está na faixa esperada (~8.7km)
      expect(distance).toBeGreaterThan(8500);
      expect(distance).toBeLessThan(9000);
    });

    test('deve calcular distância entre pontos distantes', () => {
      // São Paulo -> Rio de Janeiro
      // Distância real aproximada: ~360km
      const lat1 = -23.5505; // São Paulo
      const lon1 = -46.6333;
      const lat2 = -22.9068; // Rio de Janeiro
      const lon2 = -43.1729;
      
      const distance = haversineDistance(lat1, lon1, lat2, lon2);
      
      // Verificar se está na faixa esperada (350-370km)
      expect(distance).toBeGreaterThan(350000);
      expect(distance).toBeLessThan(370000);
    });

    test('deve retornar valor positivo independente da ordem dos pontos', () => {
      const lat1 = -23.5505;
      const lon1 = -46.6333;
      const lat2 = -22.9068;
      const lon2 = -43.1729;
      
      const distance1 = haversineDistance(lat1, lon1, lat2, lon2);
      const distance2 = haversineDistance(lat2, lon2, lat1, lon1);
      
      expect(distance1).toBe(distance2);
      expect(distance1).toBeGreaterThan(0);
    });

    test('deve lidar com coordenadas no hemisfério norte', () => {
      // Nova York -> Boston
      const lat1 = 40.7128;
      const lon1 = -74.0060;
      const lat2 = 42.3601;
      const lon2 = -71.0589;
      
      const distance = haversineDistance(lat1, lon1, lat2, lon2);
      
      // Distância aproximada: ~300km
      expect(distance).toBeGreaterThan(280000);
      expect(distance).toBeLessThan(320000);
    });
  });

  describe('filterByProximity', () => {
    const prestadores = [
      { userId: 1, nome: 'João', lat: -23.5505, lon: -46.6333 }, // 0m
      { userId: 2, nome: 'Maria', lat: -23.5515, lon: -46.6343 }, // ~150m
      { userId: 3, nome: 'Carlos', lat: -23.5605, lon: -46.6433 }, // ~1.4km
      { userId: 4, nome: 'Ana', lat: -23.6005, lon: -46.6833 }, // ~7km
      { userId: 5, nome: 'Pedro', lat: -23.6505, lon: -46.7333 }, // ~15km
    ];

    test('deve filtrar prestadores dentro do raio e ordenar por distância', () => {
      const clienteLat = -23.5505;
      const clienteLon = -46.6333;
      const maxRadius = 2000; // 2km

      const result = filterByProximity(prestadores, clienteLat, clienteLon, maxRadius);

      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe(1); // Mais próximo
      expect(result[1].userId).toBe(2);
      expect(result[2].userId).toBe(3);
      expect(result[0].distance).toBeLessThan(result[1].distance);
      expect(result[1].distance).toBeLessThan(result[2].distance);
    });

    test('deve adicionar campo distance a cada prestador', () => {
      const clienteLat = -23.5505;
      const clienteLon = -46.6333;
      const maxRadius = 5000;

      const result = filterByProximity(prestadores, clienteLat, clienteLon, maxRadius);

      result.forEach(prestador => {
        expect(prestador).toHaveProperty('distance');
        expect(typeof prestador.distance).toBe('number');
        expect(prestador.distance).toBeGreaterThanOrEqual(0);
      });
    });

    test('deve retornar array vazio se nenhum prestador estiver no raio', () => {
      const clienteLat = -23.5505;
      const clienteLon = -46.6333;
      const maxRadius = 50; // 50m - muito pequeno
      
      // Prestadores distantes - nenhum dentro de 50 metros
      const distantPrestadores = [
        { userId: 10, nome: 'Distante 1', lat: -23.5605, lon: -46.6433 },
        { userId: 11, nome: 'Distante 2', lat: -23.5705, lon: -46.6533 }
      ];

      const result = filterByProximity(distantPrestadores, clienteLat, clienteLon, maxRadius);

      expect(result).toHaveLength(0);
    });

    test('deve retornar todos prestadores se raio for muito grande', () => {
      const clienteLat = -23.5505;
      const clienteLon = -46.6333;
      const maxRadius = 20000; // 20km

      const result = filterByProximity(prestadores, clienteLat, clienteLon, maxRadius);

      expect(result).toHaveLength(5);
    });

    test('deve manter propriedades originais dos prestadores', () => {
      const clienteLat = -23.5505;
      const clienteLon = -46.6333;
      const maxRadius = 5000;

      const result = filterByProximity(prestadores, clienteLat, clienteLon, maxRadius);

      result.forEach((prestador, index) => {
        expect(prestador).toHaveProperty('userId');
        expect(prestador).toHaveProperty('nome');
        expect(prestador).toHaveProperty('lat');
        expect(prestador).toHaveProperty('lon');
      });
    });

    test('deve ordenar corretamente por distância crescente', () => {
      const clienteLat = -23.5505;
      const clienteLon = -46.6333;
      const maxRadius = 10000;

      const result = filterByProximity(prestadores, clienteLat, clienteLon, maxRadius);

      for (let i = 1; i < result.length; i++) {
        expect(result[i].distance).toBeGreaterThanOrEqual(result[i - 1].distance);
      }
    });

    test('deve lidar com array vazio de prestadores', () => {
      const result = filterByProximity([], -23.5505, -46.6333, 5000);
      expect(result).toEqual([]);
    });

    test('deve calcular distância zero para coordenadas exatamente iguais', () => {
      const prestadoresIguais = [
        { userId: 1, nome: 'João', lat: -23.5505, lon: -46.6333 },
      ];

      const result = filterByProximity(prestadoresIguais, -23.5505, -46.6333, 100);

      expect(result).toHaveLength(1);
      expect(result[0].distance).toBe(0);
    });
  });
});
