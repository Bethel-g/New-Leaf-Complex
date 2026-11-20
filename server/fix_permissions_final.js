const { Pool } = require('pg');

// Try connecting as postgres to template1 and create database fresh
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
    console.log('=== Attempting to fix newleaf_test database permissions ===\n');
    
    // Step 1: Try to drop the database (connecting to postgres db)
    console.log('Step 1: Dropping existing newleaf_test database...');
    const dropPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });
    const dclient = await dropPool.connect();
    try {
      // This might fail if postgres doesn't own it, but let's try
      await dclient.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = \'newleaf_test\' AND pid <> pg_backend_pid()');
      await dclient.query('DROP DATABASE IF EXISTS newleaf_test');
      console.log('Database dropped successfully');
    } catch (e) {
      console.log('Could not drop database (may not exist or cannot terminate connections):', e.message);
    }
    await dropPool.end();
    
    // Step 2: Create fresh database
    console.log('\nStep 2: Creating newleaf_test database...');
    try {
      await client.query('CREATE DATABASE newleaf_test OWNER postgres');
      console.log('Database created successfully with owner=postgres');
    } catch (e) {
      console.log('Create database error (may already exist):', e.message);
      // Try without specifying owner
      try {
        await client.query('CREATE DATABASE newleaf_test');
        console.log('Database created without explicit owner');
      } catch (e2) {
        console.log('Could not create database:', e2.message);
      }
    }
    
    // Step 3: Grant privileges on the new database
    console.log('\nStep 3: Granting database privileges...');
    try {
      await client.query('GRANT ALL PRIVILEGES ON DATABASE newleaf_test TO postgres');
      console.log('Database privileges granted');
    } catch (e) {
      console.log('Could not grant database privileges:', e.message);
    }
    
    // Step 4: Connect to the new database and fix schema permissions
    console.log('\nStep 4: Fixing schema permissions in newleaf_test...');
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
      // Try ALTER SCHEMA OWNER
      console.log('Attempting ALTER SCHEMA OWNER...');
      try {
        await newClient.query("ALTER SCHEMA public OWNER TO postgres");
        console.log('Schema owner changed to postgres');
      } catch (e) {
        console.log('ALTER SCHEMA OWNER failed:', e.message);
      }
      
      // Grant ALL on schema
      console.log('Granting ALL on schema public to postgres...');
      try {
        await newClient.query('GRANT ALL ON SCHEMA public TO postgres');
        console.log('Schema privileges granted');
      } catch (e) {
        console.log('Grant schema failed:', e.message);
      }
      
      // Try ALTER DEFAULT PRIVILEGES
      console.log('Setting ALTER DEFAULT PRIVILEGES...');
      try {
        await newClient.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL TO postgres");
        console.log('Default privileges set');
      } catch (e) {
        console.log('ALTER DEFAULT PRIVILEGES failed:', e.message);
      }
      
      // Test table creation
      console.log('\nStep 5: Testing table creation...');
      try {
        await newClient.query('CREATE TABLE test_knex_migrations (id SERIAL PRIMARY KEY, migration_name VARCHAR(255))');
        console.log('Table created successfully!');
        await newClient.query('DROP TABLE test_knex_migrations');
        console.log('Table dropped');
      } catch (e) {
        console.log('Table creation still failed:', e.message);
      }
      
      // Try running knex migration
      console.log('\nStep 6: Running knex migration...');
      const knex = require('knex');
      const config = require('./knexfile.js');
      const testConfig = config.test;
      const db = knex(testConfig);
      
      try {
        await db.migrate.latest();
        console.log('✓ Knex migration completed successfully!');
        
        // Now run the notification tests
        console.log('\n=== Running notificationTasks tests ===');
        const { spawn } = require('child_process');
        const vitest = spawn('npx', ['vitest', 'run', 'test/notificationTasks.test.js'], {
          cwd: 'D:\\Projects\\New-Leaf\\server',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        vitest.stdout.on('data', (data) => {
          console.log('vitest output:', data.toString());
        });
        
        vitest.stderr.on('data', (data) => {
          console.error('vitest error:', data.toString());
        });
        
        vitest.on('close', (code) => {
          console.log(`\nTest process exited with code ${code}`);
          // Cleanup
          try { newPool.end(); } catch(e) {}
          try { pool.end(); } catch(e) {}
          process.exit(code);
        });
      } catch (e) {
        console.log('Knex migration error:', e.message);
        await newPool.end();
        process.exit(1);
      }
    } catch (e) {
      console.error('Error during schema fix:', e.message);
      await newPool.end();
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

fixDatabase();