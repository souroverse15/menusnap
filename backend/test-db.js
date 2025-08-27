// Simple database connection test
const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const { Pool } = pg;

console.log('🔍 Testing database connection...');
console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@')); // Hide password

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('⏳ Attempting connection...');
    const client = await pool.connect();
    console.log('✅ Connected to database!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    client.release();
    console.log('🎉 Database connection test successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Host:', error.hostname || 'unknown');
    process.exit(1);
  }
}

testConnection();
