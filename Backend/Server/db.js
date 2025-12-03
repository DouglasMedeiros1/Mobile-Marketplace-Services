const postgres = require('postgres');
const dotenv = require('dotenv');
const dns = require('dns').promises;
const { URL } = require('url');

dotenv.config();

// Prefer explicit pooler URL when available (recommended for IPv4 networks)
const poolUrl = process.env.POOL_DATABASE_URL;
const envUrl = process.env.DATABASE_URL;
const connectionString = poolUrl || envUrl || 'postgresql://postgres:[YOUR_PASSWORD]@db.myjxlwoizaqecbhufbtx.supabase.co:5432/postgres';

// Decide SSL based on host: disable for localhost to connect to local Postgres without TLS
let sslOption = { rejectUnauthorized: false };
try {
    const parsed = new URL(connectionString);
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        sslOption = false;
    }
} catch (e) {
    // ignore parsing error and keep default sslOption
}

// Create sql client (postgres library returns a tagged template function)
const sql = postgres(connectionString, {
    ssl: sslOption
});

// Async DNS checks and optional helpful warnings
(async () => {
    try {
        // Extract host from connection string
        let host;
        try {
            const u = new URL(connectionString);
            host = u.hostname;
        } catch (err) {
            console.warn('[db] Não foi possível parsear a connection string para extrair host.');
        }

        if (host) {
            // Check if host has an IPv4 (A) record
            let hasIPv4 = false;
            try {
                const res4 = await dns.lookup(host, { family: 4 });
                if (res4 && res4.address) hasIPv4 = true;
            } catch (err) {
                // lookup failed for IPv4
                hasIPv4 = false;
            }

            if (!hasIPv4) {
                console.warn(`\n[db] Host '${host}' parece não possuir registro IPv4 (A record).`);
                if (!poolUrl) {
                    console.warn('[db] Se sua rede não tiver suporte a IPv6, a conexão falhará.');
                    console.warn('[db] Recomendações:');
                    console.warn("  - Use o Supabase Pooler (adicionando a variável POOL_DATABASE_URL no seu .env)");
                    console.warn("  - Ou habilite o IPv4 add-on no painel Supabase (fornece endpoint com A record)");
                    console.warn("  - Ou execute a aplicação em ambiente com rota IPv6 disponível\n");
                } else {
                    console.warn('[db] Usando POOL_DATABASE_URL (pooler) — verifique se ele fornece IPv4.');
                }
            }
        }

        // Test a connection quickly to surface errors early
        try {
            const res = await sql`SELECT now()`;
            if (res && res[0] && res[0].now) {
                console.log('✅ Conectado ao Supabase com sucesso:', res[0].now);
            } else {
                console.log('✅ Conectado ao Supabase (sem timestamp retornado)');
            }
        } catch (err) {
            console.error('❌ Erro ao conectar ao Supabase:', err && err.message ? err.message : err);
            if (!poolUrl) {
                console.error('[db] Sugestão: configure POOL_DATABASE_URL com o Pooler do Supabase ou habilite o IPv4 add-on.');
            }
        }

    } catch (err) {
        console.error('[db] Erro inesperado durante checagens de DNS:', err);
    }
})();

module.exports = sql;
