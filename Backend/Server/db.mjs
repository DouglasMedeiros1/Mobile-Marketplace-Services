import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:[YOUR_PASSWORD]@db.myjxlwoizaqecbhufbtx.supabase.co:5432/postgres';

const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false }
});

sql`SELECT now()`
    .then(res => {
        if (res && res[0] && res[0].now) {
            console.log('✅ Conectado ao Supabase com sucesso:', res[0].now);
        } else {
            console.log('✅ Conectado ao Supabase (sem timestamp retornado)');
        }
    })
    .catch(err => {
        console.error('❌ Erro ao conectar ao Supabase:', err.message);
    });

export default sql;