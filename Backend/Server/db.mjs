import sql from 'postgres';
const connectionString = 'postgresql://postgres.myjxlwoizaqecbhufbtx:MobileMarketplace-ServerSupabase@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const db = sql(connectionString, {
    ssl: 'require' 
});

db`SELECT now()`.then(res => {
    console.log('✅ Conectado ao Supabase com sucesso:', res[0].now);
}).catch(err => {
    console.error('❌ Erro ao conectar ao Supabase:', err.message);
});

export default db;