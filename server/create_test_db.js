const pgp = require('pg-promise')({});
const db = pgp('postgres://postgres:postgres@localhost:5432/template1');

db.connect()
  .then(() => db.query('CREATE DATABASE newleaf_test'))
  .then(() => db.query('GRANT ALL PRIVILEGES ON DATABASE newleaf_test TO postgres'))
  .then(() => {
    console.log('Database created and permissions granted');
    return db.destroy();
  })
  .catch(e => {
    if (e.message && e.message.includes('already exists')) {
      console.log('Database already exists');
      return db.query('GRANT ALL PRIVILEGES ON DATABASE newleaf_test TO postgres')
        .then(() => {
          console.log('Permissions granted');
          return db.destroy();
        })
        .catch(e2 => {
          console.error('Permissions error:', e2.message);
          return db.destroy();
        });
    } else {
      console.error('Connection error:', e.message);
      return db.destroy();
    }
  });