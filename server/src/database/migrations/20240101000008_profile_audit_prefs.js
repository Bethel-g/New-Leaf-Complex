/**
 * Profile, audit and notification-preference support.
 *
 * - activity_logs.ip_address    : the client address behind an audited action.
 * - user_preferences            : per-user JSON preferences (notification
 *                                 categories). Kept in its own table so the
 *                                 `users` projection returned by login/`/auth/me`
 *                                 never changes shape.
 *
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('activity_logs', (t) => {
      t.string('ip_address', 64);
    })
    .createTable('user_preferences', (t) => {
      t.integer('user_id').unsigned().primary().references('id').inTable('users').onDelete('CASCADE');
      t.jsonb('notification_prefs').notNullable().defaultTo('{}');
      t.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('user_preferences')
    .alterTable('activity_logs', (t) => {
      t.dropColumn('ip_address');
    });
};
