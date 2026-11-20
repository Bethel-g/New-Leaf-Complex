const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'template1',
});

async function fixDatabase() {
  const client = await pool.connect();
  try {
    // Check if newleaf_test exists
    const dbCheck = await client.query(`SELECT datname FROM pg_database WHERE datname = 'newleaf_test'`);
    
    if (dbCheck.rows.length === 0) {
      console.log('Creating newleaf_test database...');
      await client.query('CREATE DATABASE newleaf_test');
      console.log('Database created');
    } else {
      console.log('Database already exists');
    }
    
    // Grant permissions - the essential ones
    console.log('Granting permissions...');
    await client.query('GRANT ALL PRIVILEGES ON DATABASE newleaf_test TO postgres');
    console.log('Database privileges granted');
    
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    console.log('Schema privileges granted');
    
    console.log('All essential permissions granted successfully');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

fixDatabase();