const { migrateLatest } = require('knex');

migrateLatest({ client: require('knex/lib/config/defaults').default })
  .then(() => console.log('Migration complete'))
  .catch(err => console.error('Migration error:', err));