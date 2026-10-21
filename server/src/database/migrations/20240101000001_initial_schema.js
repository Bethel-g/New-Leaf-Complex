/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('roles', (t) => {
      t.increments('id').primary();
      t.string('name', 50).notNullable().unique();
      t.string('description', 255);
      t.timestamps(true, true);
    })
    .createTable('departments', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable().unique();
      t.string('description', 255);
      t.timestamps(true, true);
    })
    .createTable('categories', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable();
      t.enum('type', ['it', 'maintenance']).notNullable();
      t.string('description', 255);
      t.timestamps(true, true);
    })
    .createTable('statuses', (t) => {
      t.increments('id').primary();
      t.string('name', 50).notNullable();
      t.enum('type', ['it', 'maintenance', 'suggestion']).notNullable();
      t.integer('sort_order').defaultTo(0);
      t.timestamps(true, true);
    })
    .createTable('priorities', (t) => {
      t.increments('id').primary();
      t.string('name', 50).notNullable().unique();
      t.integer('level').notNullable();
      t.timestamps(true, true);
    })
    .createTable('users', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable();
      t.string('employee_id', 50).unique();
      t.string('email', 100).notNullable().unique();
      t.string('password', 255).notNullable();
      t.string('phone', 30);
      t.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('role_id').unsigned().references('id').inTable('roles').onDelete('SET NULL');
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
    })
    .createTable('tickets', (t) => {
      t.increments('id').primary();
      t.string('ticket_number', 20).notNullable().unique();
      t.enum('type', ['it', 'maintenance']).notNullable();
      t.integer('requester_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
      t.integer('priority_id').unsigned().references('id').inTable('priorities').onDelete('SET NULL');
      t.integer('status_id').unsigned().references('id').inTable('statuses').onDelete('SET NULL');
      t.integer('assigned_to').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.string('title', 255).notNullable();
      t.text('description');
      t.string('location', 255);
      t.string('contact_info', 255);
      t.string('equipment_name', 255);
      t.timestamps(true, true);
      t.index(['type', 'status_id']);
      t.index(['requester_id']);
      t.index(['assigned_to']);
      t.index(['department_id']);
    })
    .createTable('suggestions', (t) => {
      t.increments('id').primary();
      t.string('suggestion_number', 20).notNullable().unique();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
      t.string('title', 255).notNullable();
      t.text('problem');
      t.text('proposed_solution');
      t.text('expected_benefit');
      t.integer('status_id').unsigned().references('id').inTable('statuses').onDelete('SET NULL');
      t.integer('assigned_department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
      t.timestamps(true, true);
    })
    .createTable('ticket_comments', (t) => {
      t.increments('id').primary();
      t.integer('ticket_id').unsigned().references('id').inTable('tickets').onDelete('CASCADE');
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.text('comment').notNullable();
      t.timestamps(true, true);
    })
    .createTable('ticket_attachments', (t) => {
      t.increments('id').primary();
      t.integer('ticket_id').unsigned().references('id').inTable('tickets').onDelete('CASCADE');
      t.string('file_name', 255).notNullable();
      t.string('file_path', 500).notNullable();
      t.timestamps(true, true);
    })
    .createTable('ticket_history', (t) => {
      t.increments('id').primary();
      t.integer('ticket_id').unsigned().references('id').inTable('tickets').onDelete('CASCADE');
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.string('action', 100).notNullable();
      t.string('old_value', 255);
      t.string('new_value', 255);
      t.timestamps(true, true);
    })
    .createTable('ticket_work_notes', (t) => {
      t.increments('id').primary();
      t.integer('ticket_id').unsigned().references('id').inTable('tickets').onDelete('CASCADE');
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.text('notes');
      t.string('parts_used', 500);
      t.timestamps(true, true);
    })
    .createTable('suggestion_comments', (t) => {
      t.increments('id').primary();
      t.integer('suggestion_id').unsigned().references('id').inTable('suggestions').onDelete('CASCADE');
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.text('comment').notNullable();
      t.timestamps(true, true);
    })
    .createTable('notifications', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      t.string('title', 255).notNullable();
      t.text('message');
      t.boolean('is_read').defaultTo(false);
      t.timestamps(true, true);
    })
    .createTable('activity_logs', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.string('action', 100).notNullable();
      t.string('entity_type', 50);
      t.integer('entity_id');
      t.text('details');
      t.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('activity_logs')
    .dropTableIfExists('notifications')
    .dropTableIfExists('suggestion_comments')
    .dropTableIfExists('ticket_work_notes')
    .dropTableIfExists('ticket_history')
    .dropTableIfExists('ticket_attachments')
    .dropTableIfExists('ticket_comments')
    .dropTableIfExists('suggestions')
    .dropTableIfExists('tickets')
    .dropTableIfExists('users')
    .dropTableIfExists('priorities')
    .dropTableIfExists('statuses')
    .dropTableIfExists('categories')
    .dropTableIfExists('departments')
    .dropTableIfExists('roles');
};
