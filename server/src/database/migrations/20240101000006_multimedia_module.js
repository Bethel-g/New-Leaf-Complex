/**
 * Multimedia Control & Digital Signage module.
 *
 * Adds the following entities:
 *  - multimedia_locations        configurable hospital location tree (building/floor/ward/room)
 *  - media_assets                uploaded images/videos with metadata and lifecycle status
 *  - multimedia_devices          registered TVs / media players with status and heartbeat
 *  - multimedia_groups           reusable targets for broadcasts
 *  - multimedia_group_devices    many-to-many group membership
 *  - playback_assignments        currently-active broadcast targets
 *  - playback_schedules          scheduled one-off / recurring broadcasts
 *  - playback_history            per-device playback audit trail
 *  - device_commands             per-device command log (play/stop/...)
 *
 * Defaults for the module live in system_settings (key prefix 'multimedia_').
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('multimedia_locations', (t) => {
      t.increments('id').primary();
      t.string('name', 150).notNullable();
      t.string('level', 30).notNullable().defaultTo('location'); // campus | building | floor | ward | location | room
      t.integer('parent_id').unsigned().references('id').inTable('multimedia_locations').onDelete('CASCADE');
      t.text('description');
      t.timestamps(true, true);
    })
    .createTable('media_assets', (t) => {
      t.increments('id').primary();
      t.string('title', 200).notNullable();
      t.text('description');
      t.string('category', 100).notNullable().defaultTo('General Information');
      t.string('file_name', 255);
      t.string('file_path', 255);
      t.string('file_type', 20); // extension (jpg, png, mp4, ...)
      t.string('mime_type', 100);
      t.integer('file_size');
      t.integer('duration_seconds');
      t.string('tags', 255);
      t.string('status', 20).notNullable().defaultTo('active'); // draft | active | archived
      t.integer('uploaded_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamps(true, true);
    })
    .createTable('multimedia_devices', (t) => {
      t.increments('id').primary();
      t.string('name', 150).notNullable();
      t.string('device_identifier', 150).notNullable().unique();
      t.string('device_type', 50).notNullable().defaultTo('tv'); // tv | display | media_player
      t.string('manufacturer', 100);
      t.string('model', 100);
      t.integer('location_id').unsigned().references('id').inTable('multimedia_locations').onDelete('SET NULL');
      t.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
      t.string('floor', 100);
      t.string('ward', 100);
      t.string('room', 100);
      t.string('ip_address', 45);
      t.string('connection_type', 50).defaultTo('wifi');
      t.string('player_identifier', 150);
      t.string('device_secret_hash', 255).notNullable().defaultTo('');
      t.string('status', 20).notNullable().defaultTo('offline'); // online | offline | playing | idle | error | disabled
      t.text('status_message');
      t.string('supported_commands', 500).notNullable().defaultTo(''); // comma-separated capability manifest
      t.integer('current_media_id').unsigned().references('id').inTable('media_assets').onDelete('SET NULL');
      t.timestamp('current_media_started_at').nullable();
      t.timestamp('last_heartbeat_at').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['status'], 'idx_mm_devices_status');
      t.index(['is_active'], 'idx_mm_devices_active');
    })
    .createTable('multimedia_groups', (t) => {
      t.increments('id').primary();
      t.string('name', 150).notNullable().unique();
      t.text('description');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamps(true, true);
    })
    .createTable('multimedia_group_devices', (t) => {
      t.increments('id').primary();
      t.integer('group_id').unsigned().notNullable().references('id').inTable('multimedia_groups').onDelete('CASCADE');
      t.integer('device_id').unsigned().notNullable().references('id').inTable('multimedia_devices').onDelete('CASCADE');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['group_id', 'device_id'], 'uq_mm_group_device');
    })
    .createTable('playback_assignments', (t) => {
      t.increments('id').primary();
      t.integer('media_id').unsigned().notNullable().references('id').inTable('media_assets').onDelete('CASCADE');
      t.string('target_type', 20).notNullable(); // device | group | all
      t.integer('target_id').unsigned().nullable();
      t.integer('priority').notNullable().defaultTo(0); // 0 normal, 1 high, 2 emergency
      t.string('status', 20).notNullable().defaultTo('active'); // active | ended | failed
      t.integer('devices_total').notNullable().defaultTo(0);
      t.integer('devices_success').notNullable().defaultTo(0);
      t.integer('devices_offline').notNullable().defaultTo(0);
      t.timestamp('started_at').nullable();
      t.timestamp('ended_at').nullable();
      t.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamps(true, true);
    })
    .createTable('scheduled_playbacks', (t) => {
      t.increments('id').primary();
      t.string('title', 200).nullable();
      t.integer('media_id').unsigned().notNullable().references('id').inTable('media_assets').onDelete('CASCADE');
      t.string('target_type', 20).notNullable(); // device | group | all
      t.integer('target_id').unsigned().nullable();
      t.timestamp('start_at').notNullable();
      t.timestamp('end_at').nullable();
      t.string('repeat_type', 20).notNullable().defaultTo('none'); // none | daily | weekly | specific_days
      t.string('repeat_days', 50); // comma-separated 0(Sun)..6(Sat) when repeat_type = specific_days
      t.integer('priority').notNullable().defaultTo(0);
      t.timestamp('last_run_at').nullable();
      t.string('status', 20).notNullable().defaultTo('active'); // active | paused | ended
      t.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['start_at'], 'idx_mm_schedules_start');
    })
    .createTable('playback_history', (t) => {
      t.increments('id').primary();
      t.integer('device_id').unsigned().notNullable().references('id').inTable('multimedia_devices').onDelete('CASCADE');
      t.integer('media_id').unsigned().references('id').inTable('media_assets').onDelete('SET NULL');
      t.string('action', 50).notNullable(); // broadcast | stop | schedule_start | command | heartbeat_offline | heartbeat_online
      t.string('status', 20).notNullable().defaultTo('success'); // success | failed | pending | offline
      t.timestamp('started_at').nullable();
      t.timestamp('ended_at').nullable();
      t.integer('triggered_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.text('error_message');
      t.timestamps(true, true);
      t.index(['device_id'], 'idx_mm_history_device');
      t.index(['created_at'], 'idx_mm_history_created');
    })
    .createTable('device_commands', (t) => {
      t.increments('id').primary();
      t.integer('device_id').unsigned().notNullable().references('id').inTable('multimedia_devices').onDelete('CASCADE');
      t.string('command', 50).notNullable();
      t.text('parameters');
      t.string('status', 20).notNullable().defaultTo('pending'); // pending | sent | succeeded | failed | not_supported
      t.integer('requested_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.timestamp('requested_at').nullable();
      t.timestamp('executed_at').nullable();
      t.text('error_message');
      t.timestamps(true, true);
    })
    .createTable('multimedia_audit', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      t.string('action', 100).notNullable();
      t.string('entity_type', 50); // device | media | group | schedule | broadcast | command | location | setting
      t.integer('entity_id');
      t.text('details');
      t.timestamps(true, true);
      t.index(['created_at'], 'idx_mm_audit_created');
    })
    .then(() => knex('system_settings').insert([
      { key: 'multimedia_heartbeat_timeout_minutes', value: '3', category: 'multimedia', description: 'Minutes without a device heartbeat before it is marked offline', is_protected: false },
      { key: 'multimedia_device_limit', value: '100', category: 'multimedia', description: 'Maximum number of devices supported by the initial deployment', is_protected: false },
      { key: 'multimedia_allow_it_staff_commands', value: 'false', category: 'multimedia', description: 'Allow it_staff to send device commands (default off, configurable)', is_protected: false },
    ]));
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('multimedia_audit')
    .dropTableIfExists('device_commands')
    .dropTableIfExists('playback_history')
    .dropTableIfExists('scheduled_playbacks')
    .dropTableIfExists('playback_assignments')
    .dropTableIfExists('multimedia_group_devices')
    .dropTableIfExists('multimedia_groups')
    .dropTableIfExists('multimedia_devices')
    .dropTableIfExists('media_assets')
    .dropTableIfExists('multimedia_locations')
    .then(() => knex('system_settings').where('key', 'like', 'multimedia_%').del());
};