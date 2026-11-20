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
    console.log('=== Attempt 1: Revoking and re-granting ===');
    // First, revoke all
    await client.query('REVOKE ALL ON SCHEMA public FROM PUBLIC');
    await client.query('REVOKE ALL ON SCHEMA public FROM postgres');
    
    console.log('=== Attempt 2: Granting to public role ===');
    // Grant to public
    await client.query('GRANT ALL ON SCHEMA public TO public');
    console.log('Granted to public');
    
    console.log('=== Attempt 3: Granting to postgres ===');
    // Grant to postgres
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    console.log('Granted to postgres');
    
    console.log('=== Attempt 4: Setting search_path ===');
    // Set search path for the session
    await client.query('SET search_path TO public');
    console.log('Search path set');
    
    console.log('=== Testing table creation ===');
    // Try creating a simple table
    await client.query('CREATE TABLE test_permissions (id SERIAL PRIMARY KEY, name VARCHAR(100))');
    console.log('Table created successfully!');
    
    // Clean up
    await client.query('DROP TABLE test_permissions');
    console.log('Table dropped');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

fixDatabase();