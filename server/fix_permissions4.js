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
    console.log('Reassigning schema ownership...');
    
    // Try to change schema owner to postgres
    await client.query("ALTER SCHEMA public OWNER TO postgres");
    console.log('Schema owner reassigned to postgres');
    
    // Now grant all
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    console.log('Grant ALL on schema done');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

fixDatabase();