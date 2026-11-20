const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'newleaf_test',
});

async function fixDatabase() {
  const client = await pool.connect();
  try {
    console.log('Granting schema permissions...');
    // Grant ALL on public schema to postgres
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    console.log('Schema privileges granted successfully');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

fixDatabase();