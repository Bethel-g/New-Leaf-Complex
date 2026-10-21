require('dotenv').config();

const connection = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'newleaf_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

module.exports = {
  development: {
    client: 'pg',
    connection,
    migrations: {
      directory: './src/database/migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },
  test: {
    client: 'pg',
    connection: {
      ...connection,
      database: process.env.TEST_DB_NAME || 'newleaf_test',
    },
    migrations: {
      directory: './src/database/migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    pool: { min: 0, max: 5 },
  },
};