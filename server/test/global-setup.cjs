const { Client } = require('pg');
const knex = require('knex');
const knexConfig = require('../knexfile');

async function ensureTestDatabase() {
  const base = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
  const admin = new Client({ ...base, database: 'postgres' });
  await admin.connect();
  const dbName = process.env.TEST_DB_NAME || 'newleaf_test';
  try {
    const res = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (res.rowCount === 0) {
      // database identifier cannot be a bind parameter in CREATE DATABASE
      await admin.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end();
  }
}

module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.TEST_DB_NAME = 'newleaf_test';
  await ensureTestDatabase();
  const db = knex(knexConfig.test);
  await db.migrate.latest(knexConfig.test);
  await db.seed.run(knexConfig.test);
  await db.destroy();
};