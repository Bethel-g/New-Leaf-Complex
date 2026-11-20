const { Pool } = require('pg');

// First fix the template1/database level, then fix the test database
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'template1',
});

// Step 1: Create the test database if not exists (we can't drop, so just ensure it exists with right owner)
async function setup() {
  const client = await pool.connect();
  try {
    // Create database with postgres owner (will fail if exists, which is fine)
    try {
      await client.query('CREATE DATABASE newleaf_test OWNER postgres');
      console.log('Created newleaf_test database');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Database already exists - will fix permissions');
      } else {
        console.error('Create DB error:', e.message);
      }
    }
    await pool.end();
    
    // Step 2: Connect to newleaf_test and fix schema permissions
    const testPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'newleaf_test',
    });
    
    const tclient = await testPool.connect();
    try {
      // Grant schema permissions
      await tclient.query("ALTER SCHEMA public OWNER TO postgres");
      console.log('Altered public schema owner to postgres');
      
      await tclient.query('GRANT ALL ON SCHEMA public TO postgres');
      console.log('Granted ALL on public schema to postgres');
      
      await tclient.query('GRANT ALL ON SCHEMA public TO public');
      console.log('Granted ALL on public schema to public');
      
      // Test table creation
      await tclient.query('CREATE TABLE test_knex_migrations (id SERIAL PRIMARY KEY)');
      console.log('✓ Table creation test PASSED');
      await tclient.query('DROP TABLE test_knex_migrations');
      
      console.log('\n=== Database permissions fixed ===');
      await pool.end();
      await testPool.end();
      process.exit(0);
    } catch (err) {
      console.error('Error fixing schema in newleaf_test:', err.message);
      await pool.end();
      await testPool.end();
      process.exit(1);
    }
  } catch (err) {
    console.error('Setup error:', err.message);
    try { await pool.end(); } catch(e) {}
    process.exit(1);
  }
}

setup();