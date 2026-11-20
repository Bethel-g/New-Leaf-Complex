const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});

pool.connect()
  .then(client => {
    console.log('Connected to postgres database');
    
    // Try to drop, ignore if fails (database doesn't exist or not owner)
    return client.query('DROP DATABASE IF EXISTS newleaf_test')
      .then(() => {
        console.log('Dropped newleaf_test (if existed)');
        return client.query('CREATE DATABASE newleaf_test OWNER postgres');
      })
      .then(() => {
        console.log('Created newleaf_test with owner=postgres');
        return client.query('GRANT ALL PRIVILEGES ON DATABASE newleaf_test TO postgres');
      })
      .then(() => {
        console.log('Granted database privileges');
        return client.query("ALTER SCHEMA public OWNER TO postgres");
      })
      .then(() => {
        console.log('Altered schema owner to postgres');
        return client.query('GRANT ALL ON SCHEMA public TO postgres');
      })
      .then(() => {
        console.log('Granted schema privileges to postgres');
        return client.query('GRANT ALL ON SCHEMA public TO public');
      })
      .then(() => {
        console.log('Granted schema privileges to public');
        console.log('\n=== Database setup complete ===');
        return client.query('SELECT 1').then(() => {
          console.log('Connection test passed');
          pool.end();
          process.exit(0);
        });
      })
      .catch(err => {
        console.error('SQL Error:', err.message);
        // Still try to grant schema permissions even if DB operations had issues
        console.log('Proceeding with schema permissions...');
        return client.query("ALTER SCHEMA public OWNER TO postgres").then(() => {
          return client.query('GRANT ALL ON SCHEMA public TO postgres');
        }).then(() => {
          return client.query('GRANT ALL ON SCHEMA public TO public');
        }).then(() => {
          console.log('Schema permissions granted');
          pool.end();
          process.exit(0);
        }).catch(err2 => {
          console.error('Schema grant error:', err2.message);
          pool.end();
          process.exit(1);
        });
      });
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  });