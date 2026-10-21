/**
 * Align ticketing/suggestion workflow statuses with the operations spec.
 *
 * - Maintenance: first status renamed `Submitted` -> `New` so the workflow is
 *   New -> Assigned -> Inspection -> In Progress -> Waiting for Parts -> Completed -> Closed.
 * - IT: sort order enforced for New -> Assigned -> In Progress -> Waiting for Information -> Resolved -> Closed.
 * - Suggestions: sort order enforced for the primary flow
 *   Submitted -> Under Review -> Accepted -> Assigned -> Implementation -> Implemented -> Closed
 *   (supplementary statuses such as Rejected are retained after the primary chain).
 *
 * Idempotent: renames/orders are applied keyed on current status names, so this
 * can run against both fresh and already-seeded databases without data loss.
 *
 * @param { import("knex").Knex } knex
 */
exports.up = async function (knex) {
  return knex.transaction(async (trx) => {
    // Maintenance: Submitted -> New (keeps the same row id, FKs intact)
    await trx('statuses')
      .where({ name: 'Submitted', type: 'maintenance' })
      .update({ name: 'New' });

    const orderByType = {
      maintenance: {
        'New': 0,
        'Assigned': 1,
        'Inspection': 2,
        'In Progress': 3,
        'Waiting for Parts': 4,
        'Completed': 5,
        'Closed': 6,
      },
      it: {
        'New': 0,
        'Assigned': 1,
        'In Progress': 2,
        'Waiting for Information': 3,
        'Resolved': 4,
        'Closed': 5,
      },
      suggestion: {
        'Submitted': 0,
        'Under Review': 1,
        'Accepted': 2,
        'Assigned': 3,
        'Implementation': 4,
        'Implemented': 5,
        'Closed': 6,
        'Rejected': 7,
        'Need More Information': 8,
        'Already Planned': 9,
        'Forwarded to Department': 10,
      },
    };

    for (const [type, names] of Object.entries(orderByType)) {
      for (const [name, sortOrder] of Object.entries(names)) {
        await trx('statuses').where({ name, type }).update({ sort_order: sortOrder });
      }
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function (knex) {
  // Data migration; a no-op down keeps rollback safe (status rows are not destroyed).
};