/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('system_settings', (t) => {
      t.increments('id').primary();
      t.string('key', 100).notNullable().unique();
      t.text('value');
      t.string('category', 100).defaultTo('general');
      t.string('description', 255);
      t.boolean('is_protected').defaultTo(false);
      t.timestamps(true, true);
    })
    .then(() => knex('system_settings').insert([
      { key: 'system_name', value: 'New Leaf Complex Operations System', category: 'general', description: 'Display name of the system', is_protected: true },
      { key: 'max_attachment_mb', value: '10', category: 'uploads', description: 'Maximum upload size per attachment (MB)', is_protected: false },
      { key: 'max_attachments', value: '5', category: 'uploads', description: 'Maximum number of attachments per request', is_protected: false },
      { key: 'session_timeout_minutes', value: '480', category: 'security', description: 'JWT/session lifetime in minutes (24h default)', is_protected: false },
    ]));
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('system_settings');
};