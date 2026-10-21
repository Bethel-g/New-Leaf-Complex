/**
 * Add resolved/closed date tracking to tickets and add indexes for
 * commonly searched/filtered columns across the schema.
 *
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema
    // Tickets: lifecycle dates + index on sort/filter columns
    .alterTable('tickets', (t) => {
      t.timestamp('resolved_date');
      t.timestamp('closed_date');
      t.index(['created_at'], 'idx_tickets_created_at');
      t.index(['priority_id'], 'idx_tickets_priority_id');
    })
    // Users: joins/filters on role and department
    .alterTable('users', (t) => {
      t.index(['role_id'], 'idx_users_role_id');
      t.index(['department_id'], 'idx_users_department_id');
    })
    // Categories: filtered by type
    .alterTable('categories', (t) => {
      t.index(['type'], 'idx_categories_type');
      t.unique(['name', 'type'], 'idx_categories_name_type_unique');
    })
    // Statuses: filtered by type + looked up by (name, type)
    .alterTable('statuses', (t) => {
      t.index(['type'], 'idx_statuses_type');
      t.unique(['name', 'type'], 'idx_statuses_name_type_unique');
    })
    // Suggestions: common lookups
    .alterTable('suggestions', (t) => {
      t.index(['user_id'], 'idx_suggestions_user_id');
      t.index(['status_id'], 'idx_suggestions_status_id');
      t.index(['assigned_department_id'], 'idx_suggestions_assigned_department_id');
      t.index(['created_at'], 'idx_suggestions_created_at');
    })
    // Ticket sub-resources: FK lookup columns
    .alterTable('ticket_comments', (t) => {
      t.index(['ticket_id'], 'idx_ticket_comments_ticket_id');
    })
    .alterTable('ticket_attachments', (t) => {
      t.index(['ticket_id'], 'idx_ticket_attachments_ticket_id');
    })
    .alterTable('ticket_history', (t) => {
      t.index(['ticket_id'], 'idx_ticket_history_ticket_id');
    })
    .alterTable('ticket_work_notes', (t) => {
      t.index(['ticket_id'], 'idx_ticket_work_notes_ticket_id');
    })
    // Suggestion comments: FK lookup
    .alterTable('suggestion_comments', (t) => {
      t.index(['suggestion_id'], 'idx_suggestion_comments_suggestion_id');
    })
    // Notifications: per-user unread reads + ordering
    .alterTable('notifications', (t) => {
      t.index(['user_id', 'is_read'], 'idx_notifications_user_read');
      t.index(['created_at'], 'idx_notifications_created_at');
    })
    // Activity/audit log: ordering + entity lookups
    .alterTable('activity_logs', (t) => {
      t.index(['user_id'], 'idx_activity_logs_user_id');
      t.index(['created_at'], 'idx_activity_logs_created_at');
      t.index(['entity_type', 'entity_id'], 'idx_activity_logs_entity');
    });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('tickets', (t) => {
      t.dropColumn('resolved_date');
      t.dropColumn('closed_date');
    })
    .alterTable('tickets', (t) => {
      t.dropIndex(['created_at'], 'idx_tickets_created_at');
      t.dropIndex(['priority_id'], 'idx_tickets_priority_id');
    })
    .alterTable('users', (t) => {
      t.dropIndex(['role_id'], 'idx_users_role_id');
      t.dropIndex(['department_id'], 'idx_users_department_id');
    })
    .alterTable('categories', (t) => {
      t.dropIndex(['type'], 'idx_categories_type');
      t.dropUnique(['name', 'type'], 'idx_categories_name_type_unique');
    })
    .alterTable('statuses', (t) => {
      t.dropIndex(['type'], 'idx_statuses_type');
      t.dropUnique(['name', 'type'], 'idx_statuses_name_type_unique');
    })
    .alterTable('suggestions', (t) => {
      t.dropIndex(['user_id'], 'idx_suggestions_user_id');
      t.dropIndex(['status_id'], 'idx_suggestions_status_id');
      t.dropIndex(['assigned_department_id'], 'idx_suggestions_assigned_department_id');
      t.dropIndex(['created_at'], 'idx_suggestions_created_at');
    })
    .alterTable('ticket_comments', (t) => t.dropIndex(['ticket_id'], 'idx_ticket_comments_ticket_id'))
    .alterTable('ticket_attachments', (t) => t.dropIndex(['ticket_id'], 'idx_ticket_attachments_ticket_id'))
    .alterTable('ticket_history', (t) => t.dropIndex(['ticket_id'], 'idx_ticket_history_ticket_id'))
    .alterTable('ticket_work_notes', (t) => t.dropIndex(['ticket_id'], 'idx_ticket_work_notes_ticket_id'))
    .alterTable('suggestion_comments', (t) => t.dropIndex(['suggestion_id'], 'idx_suggestion_comments_suggestion_id'))
    .alterTable('notifications', (t) => {
      t.dropIndex(['user_id', 'is_read'], 'idx_notifications_user_read');
      t.dropIndex(['created_at'], 'idx_notifications_created_at');
    })
    .alterTable('activity_logs', (t) => {
      t.dropIndex(['user_id'], 'idx_activity_logs_user_id');
      t.dropIndex(['created_at'], 'idx_activity_logs_created_at');
      t.dropIndex(['entity_type', 'entity_id'], 'idx_activity_logs_entity');
    });
};