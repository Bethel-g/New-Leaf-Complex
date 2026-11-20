const { Pool } = require('pg');

// Try connecting to newleaf_test directly
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
    console.log('Checking current user and permissions...');
    
    // Check current user
    const user = await client.query('SELECT current_user');
    console.log('Current user:', user.rows[0].current_user);
    
    // Check schema ownership
    const schema = await client.query("SELECT schema_name, schema_owner FROM information_schema.schemata WHERE schema_name = 'public'");
    console.log('Schema owner:', schema.rows.length > 0 ? schema.rows[0].schema_owner : 'not found');
    
    // Try to grant all on schema
    console.log('Granting ALL on public schema to postgres...');
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    console.log('Grant done');
    
    // Also try altering default privileges
    try {
      await client.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL TO postgres");
      console.log('Default privileges granted');
    } catch(e) {
      console.log('Default privileges note:', e.message);
    }
    
    console.log('Permissions processed');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

fixDatabase();