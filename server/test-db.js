require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

async function test() {
  console.log('Connecting to:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'UNDEFINED');
  try {
    const client = await pool.connect();
    console.log('Connection successful!');
    const res = await client.query('SELECT NOW()');
    console.log('Time from DB:', res.rows[0].now);
    client.release();
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    pool.end();
  }
}

test();
