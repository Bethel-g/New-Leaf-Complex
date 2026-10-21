exports.up = function (knex) {
  return knex.schema.alterTable('tickets', (table) => {
    table.text('resolution_notes').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('tickets', (table) => {
    table.dropColumn('resolution_notes');
  });
};