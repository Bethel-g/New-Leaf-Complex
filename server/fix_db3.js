const { Pool } = require('pg');

// Directly connect to newleaf_test and fix permissions
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'newleaf_test',
});

pool.connect()
  .then(client => {
    console.log('Connected to newleaf_test database');
    
    return client.query("ALTER SCHEMA public OWNER TO postgres")
      .then(() => {
        console.log('✓ Altered public schema owner to postgres');
        return client.query('GRANT ALL ON SCHEMA public TO postgres');
      })
      .then(() => {
        console.log('✓ Granted ALL on public schema to postgres');
        return client.query('GRANT ALL ON SCHEMA public TO public');
      })
      .then(() => {
        console.log('✓ Granted ALL on public schema to public');
        
        // Test table creation
        return client.query('CREATE TABLE test_knex_migrations (id SERIAL PRIMARY KEY)');
      })
      .then(() => {
        console.log('✓ Table creation PASSED - knex migrations will work');
        return client.query('DROP TABLE test_knex_migrations');
      })
      .then(() => {
        console.log('\n=== Database permissions fixed ===');
        pool.end();
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err.message);
        pool.end();
        process.exit(1);
      });
  })
  .catch(err => {
    console.error('Connection failed - database may not exist or user lacks privileges:', err.message);
    process.exit(1);
  });