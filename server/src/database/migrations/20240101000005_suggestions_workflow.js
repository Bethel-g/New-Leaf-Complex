/**
 * Suggestion & Improvement module: full review workflow support.
 *
 * - suggestions.assigned_to : the responsible staff member assigned to drive the improvement.
 * - suggestion_history      : complete status history (created, status changes, assignments, comments).
 * - suggestion_attachments  : optional supporting files attached by the submitter.
 * - Suggestion status renamed `Need More Information` -> `Needs More Information`.
 *
 * @param { import("knex").Knex } knex
 */
exports.up = async function (knex) {
  return knex.schema
    .alterTable('suggestions', (t) => {
      t.integer('assigned_to').unsigned().references('id').inTable('users').onDelete('SET NULL');
    })
    .createTable('suggestion_history', (t) => {
      t.increments('id').primary();
      t.integer('suggestion_id').unsigned().references('id').inTable('suggestions').onDelete('CASCADE');
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.string('action', 100).notNullable();
      t.string('old_value', 255);
      t.string('new_value', 255);
      t.timestamps(true, true);
    })
    .createTable('suggestion_attachments', (t) => {
      t.increments('id').primary();
      t.integer('suggestion_id').unsigned().references('id').inTable('suggestions').onDelete('CASCADE');
      t.string('file_name', 255).notNullable();
      t.string('file_path', 500).notNullable();
      t.timestamps(true, true);
    })
    .then(() =>
      knex('statuses')
        .where({ name: 'Need More Information', type: 'suggestion' })
        .update({ name: 'Needs More Information' })
    );
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function (knex) {
  return knex.schema
    .alterTable('suggestions', (t) => {
      t.dropColumn('assigned_to');
    })
    .dropTableIfExists('suggestion_attachments')
    .dropTableIfExists('suggestion_history')
    .then(() =>
      knex('statuses')
        .where({ name: 'Needs More Information', type: 'suggestion' })
        .update({ name: 'Need More Information' })
    );
};