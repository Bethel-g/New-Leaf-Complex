const { Pool } = require('pg');

// Connect to postgres database (default database) to create new databases
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});

async function fixDatabase() {
  const client = await pool.connect();
  try {
    // Drop the existing newleaf_test if it exists
    console.log('Dropping existing newleaf_test database...');
    await client.query('DROP DATABASE IF EXISTS newleaf_test');
    console.log('Database dropped (if it existed)');
    
    // Create fresh database with postgres as owner
    console.log('Creating newleaf_test database...');
    await client.query('CREATE DATABASE newleaf_test OWNER postgres');
    console.log('Database created with owner=postgres');
    
    // Grant privileges
    await client.query('GRANT ALL PRIVILEGES ON DATABASE newleaf_test TO postgres');
    console.log('Database privileges granted');
    
    // Now connect to the new database and fix schema permissions
    await pool.end();
    
    // Connect to new database
    const newPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'newleaf_test',
    });
    const newClient = await newPool.connect();
    
    try {
      // Try to alter schema owner
      console.log('Altering schema owner...');
      await newClient.query("ALTER SCHEMA public OWNER TO postgres");
      console.log('Schema owner altered to postgres');
      
      // Grant all on schema
      await newClient.query('GRANT ALL ON SCHEMA public TO postgres');
      console.log('Grant ALL on schema to postgres');
      
      // Also grant to public role
      await newClient.query('GRANT ALL ON SCHEMA public TO public');
      console.log('Granted to public role');
      
      // Test table creation
      console.log('Testing table creation...');
      await newClient.query('CREATE TABLE test_table (id SERIAL PRIMARY KEY, name VARCHAR(100))');
      console.log('Table created successfully!');
      
      await newClient.query('DROP TABLE test_table');
      console.log('Table dropped');
      
      // Now try running knex migrations
      console.log('\\n=== Now trying knex migration ===');
      const knex = require('knex');
      const config = require('./knexfile.js');
      const testConfig = config.test;
      const db = knex(testConfig);
      
      try {
        await db.migrate.latest();
        console.log('Knex migration completed successfully!');
        
        // Now run the notification tests
        console.log('\\n=== Running notification tests ===');
        const { spawn } = require('child_process');
        const vitest = spawn('npx', ['vitest', 'run', 'test/notificationTasks.test.js'], {
          cwd: 'D:\\Projects\\New-Leaf\\server',
          stdio: 'inherit'
        });
        vitest.on('close', (code) => {
          console.log(`\\nTest process exited with code ${code}`);
          process.exit(code);
        });
      } catch (e) {
        console.log('Knex migration error:', e.message);
      }
      
      await newPool.end();
      process.exit(0);
    } catch (e) {
      console.error('Error during schema fix:', e.message);
      await newPool.end();
      process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    try { await pool.end(); } catch(e) {}
    process.exit(1);
  }
}

fixDatabase();