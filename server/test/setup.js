import { beforeAll, afterAll } from 'vitest';
import db from '../src/config/db.js';

// Each test file starts from a clean, freshly seeded database so the files
// are independent and repeatable.
beforeAll(async () => {
  await db.migrate.latest();
  await db.seed.run();
}, 120000);

afterAll(async () => {
  await db.destroy();
});