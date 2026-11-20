const knex = require('knex');
const config = require('./knexfile.js');
const testConfig = config.test;

const db = knex(testConfig);

db.migrate.latest({ directory: './server/src/database/migrations' })
  .then(() => {
    console.log('Migration completed successfully');
    return db.seed.run({ directory: './server/src/database/seeds' });
  })
  .then(() => {
    console.log('Seeding completed successfully');
    db.destroy();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    console.error(err.stack);
    db.destroy();
    process.exit(1);
  });