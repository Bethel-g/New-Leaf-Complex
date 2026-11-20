const { migrateLatest } = require('knex');

const config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'newleaf_test',
    user: 'postgres',
    password: 'postgres',
  },
  migrations: {
    directory: 'D:\\Projects\\New-Leaf\\server\\src\\database\\migrations',
  },
  pool: { min: 0, max: 5 },
};

async function main() {
  try {
    const knexInstance = require('knex')(config);
    await knexInstance.migrate.latest({ env: 'test' });
    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

main();