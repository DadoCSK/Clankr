const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const isSupabase = (process.env.DATABASE_URL || '').includes('supabase');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                       // Supabase free tier allows ~15 concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // remote DB needs longer timeout
  // Supabase requires SSL; skip cert verification for simplicity
  ssl: isSupabase || isProduction
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
