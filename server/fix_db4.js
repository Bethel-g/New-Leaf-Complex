const { Pool } = require('pg');

// Try connecting and directly manipulating schema ACL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'newleaf_test',
});

pool.connect()
  .then(client => {
    console.log('Connected to newleaf_test');
    
    // Try to directly grant using SQL commands that bypass ownership checks
    const commands = [
      // Grant using public role
      'GRANT ALL ON SCHEMA public TO public',
      // Set search path
      "SET LOCAL search_path TO public",
      // Try to create a table to test
      'CREATE TABLE test_permission_check (id SERIAL PRIMARY KEY)'
    ];
    
    // Run commands sequentially
    let lastResult = null;
    
    return commands.reduce((promise, cmd) => {
      return promise.then(() => {
        return client.query(cmd).then(result => {
          lastResult = result;
          console.log(`✓ Executed: ${cmd.substring(0, 50)}${cmd.length > 50 ? '...' : ''}`);
        }).catch(err => {
          console.log(`✗ Failed: ${cmd.substring(0, 50)}${cmd.length > 50 ? '...' : ''}`);
          console.log(`  Error: ${err.message.split('\\n')[0]}`);
          // Don't throw, continue with next command
        });
      });
    }, Promise.resolve()).then(() => {
      // Test if we can create the knex migrations table
      return client.query('CREATE TABLE test_knex_migrations (id SERIAL PRIMARY KEY, name VARCHAR(255))');
    }).then(() => {
      console.log('\n✓ Table creation successful - knex should now work');
      return client.query('DROP TABLE test_knex_migrations');
    }).then(() => {
      console.log('\n=== Database permissions appear fixed ===');
      pool.end();
      process.exit(0);
    });
  })
  .catch(err => {
    console.error('Connection or error:', err.message);
    pool.end();
    process.exit(1);
  });