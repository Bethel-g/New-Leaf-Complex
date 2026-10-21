/**
 * Links a notification to the ticket or suggestion it was raised about, so the
 * recipient can open the notification and land on the full task (details,
 * attachments, comments, history) instead of a bare message.
 *
 * Deliberately NOT a foreign key: the referenced row may be deleted later (or,
 * for the multimedia module, never existed), and a notification must survive
 * that as an ordinary message. Consumers must tolerate a missing target.
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('notifications', (t) => {
      t.string('entity_type', 50); // 'ticket' | 'suggestion'
      t.integer('entity_id');
    })
    .then(() =>
      knex.schema.alterTable('notifications', (t) => {
        t.index(['entity_type', 'entity_id'], 'notifications_entity_idx');
      })
    );
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('notifications', (t) => {
      t.dropIndex(['entity_type', 'entity_id'], 'notifications_entity_idx');
      t.dropColumn('entity_type');
      t.dropColumn('entity_id');
    });
};
