const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'template1',
});

async function recreateDatabase() {
  const client = await pool.connect();
  try {
    console.log('Dropping newleaf_test database...');
    // Can't drop database while connected, need to connect to different db
    // Let's connect to postgres database instead
    await client.query('SELECT 1');
    await pool.end();
    
    // Connect to postgres database
    const ppool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });
    const pclient = await ppool.connect();
    
    console.log('Dropping newleaf_test database...');
    await pclient.query('DROP DATABASE IF EXISTS newleaf_test');
    console.log('Database dropped');
    
    console.log('Creating newleaf_test database...');
    await pclient.query('CREATE DATABASE newleaf_test OWNER postgres');
    console.log('Database created');
    
    await pclient.query('GRANT ALL PRIVILEGES ON DATABASE newleaf_test TO postgres');
    console.log('Database privileges granted');
    
    await pclient.query('GRANT ALL ON SCHEMA public TO postgres');
    console.log('Schema privileges granted');
    
    await pclient.query("ALTER SCHEMA public OWNER TO postgres");
    console.log('Schema owner altered');
    
    await pclient.query('GRANT ALL ON SCHEMA public TO public');
    console.log('Granted to public');
    
    await ppool.end();
    await pool.end();
    
    console.log('=== Now testing table creation ===');
    
    // Now test with a new pool connecting to newleaf_test
    const tpool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'newleaf_test',
    });
    const tclient = await tpool.connect();
    
    try {
      console.log('Creating test table...');
      await tclient.query('CREATE TABLE test_permissions (id SERIAL PRIMARY KEY, name VARCHAR(100))');
      console.log('Table created successfully!');
      
      await tclient.query('DROP TABLE test_permissions');
      console.log('Table dropped');
    } catch (err) {
      console.error('Table creation error:', err.message);
    }
    
    await tpool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    try { await pool.end(); } catch(e) {}
    try { await ppool.end(); } catch(e) {}
    process.exit(1);
  }
}

recreateDatabase();