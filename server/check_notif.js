const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'newleaf_test',
});

pool.connect()
  .then(client => {
    return client.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5')
      .then(r => {
        console.log('Notifications in DB:');
        r.rows.forEach(n => {
          console.log(' - ID:', n.id, '| Title:', n.title, '| User:', n.user_id, '| Read:', n.is_read, '| Entity:', n.entity_type);
        });
        if (r.rows.length === 0) {
          console.log('  (no notifications found)');
        }
      })
      .catch(err => {
        console.error('DB query error:', err.message);
      })
      .finally(() => {
        pool.end();
        process.exit(0);
      });
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    pool.end();
    process.exit(1);
  });