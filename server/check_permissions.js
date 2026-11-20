const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'newleaf_test',
});

async function checkPermissions() {
  const client = await pool.connect();
  try {
    console.log('=== Checking permissions in newleaf_test ===');
    
    // Check who can create tables in public schema
    const perms = await client.query(`
      SELECT has_schema_privilege('postgres', 'public', 'create') AS has_create_privilege,
             has_schema_privilege('public', 'public', 'create') AS public_has_create
    `);
    console.log('Has create privilege:', perms.rows);
    
    // Check schema owner
    const owner = await client.query("SELECT schemaowner FROM pg_namespace WHERE nspname = 'public'");
    console.log('Schema owner from pg_namespace:', owner.rows);
    
    // Check pg_roles
    const roles = await client.query(`SELECT rolname, rolsuper FROM pg_roles WHERE rolname = 'postgres'`);
    console.log('Postgres role info:', roles.rows);
    
    // Check if we can see the schema ACL
    const acl = await client.query(`SELECT nspname, nspowner, nspacl FROM pg_namespace WHERE nspname = 'public'`);
    console.log('Schema ACL:', acl.rows);
    
    // Try creating a table in a different way - using IF NOT EXISTS
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS test_knex_migrations (id SERIAL PRIMARY KEY)`);
      console.log('Table created successfully with IF NOT EXISTS');
      await client.query(`DROP TABLE test_knex_migrations`);
    } catch (e) {
      console.log('Still cannot create table:', e.message);
    }
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

checkPermissions();