const { Pool } = require('pg');

// ─── Connection Pool ─────────────────────────────────────────
// Uses DATABASE_URL in production (Render), falls back to local config in dev
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Catch background pool errors to prevent process crash
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});

// ─── Initialize Tables ──────────────────────────────────────
async function initDB() {
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_color VARCHAR(10) DEFAULT '#E50914',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_lists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id INTEGER NOT NULL,
        content_type VARCHAR(10) NOT NULL CHECK(content_type IN ('movie', 'tv')),
        list_type VARCHAR(20) NOT NULL CHECK(list_type IN ('favorite', 'must_watch', 'watched')),
        title TEXT NOT NULL,
        poster_path TEXT,
        backdrop_path TEXT,
        vote_average REAL DEFAULT 0,
        overview TEXT,
        release_date TEXT,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, content_id, content_type, list_type)
      );

      CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON user_lists(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_lists_list_type ON user_lists(user_id, list_type);
    `);
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.warn('⚠️ Server will run in degraded mode (TMDB API proxy enabled; PostgreSQL auth/lists disabled until DB is available).');
  } finally {
    if (client) client.release();
  }
}

// Run init on import
initDB();

module.exports = pool;
