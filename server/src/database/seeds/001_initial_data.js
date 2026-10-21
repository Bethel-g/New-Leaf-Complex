const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 */
exports.seed = async function (knex) {
  // TRUNCATE ... RESTART IDENTITY makes the seed idempotent: re-running it
  // restarts primary-key sequences so the fixed FK references below (1..7, 1..10)
  // always resolve to the freshly inserted rows.
  await knex.raw(
    'TRUNCATE TABLE multimedia_audit, device_commands, playback_history, scheduled_playbacks, ' +
    'playback_assignments, multimedia_group_devices, multimedia_groups, multimedia_devices, ' +
    'media_assets, multimedia_locations, system_settings, activity_logs, notifications, ' +
    'suggestion_comments, ticket_work_notes, ticket_history, ticket_attachments, ticket_comments, ' +
    'suggestions, tickets, users, priorities, statuses, categories, departments, roles RESTART IDENTITY CASCADE'
  );

  // System defaults are seeded (migration-injected rows are reset by the
  // TRUNCATE above) so a fresh seed always matches migration defaults.
  await knex('system_settings').insert([
    { key: 'system_name', value: 'New Leaf Complex Operations System', category: 'general', description: 'Display name of the system', is_protected: true },
    { key: 'max_attachment_mb', value: '10', category: 'uploads', description: 'Maximum upload size per attachment (MB)', is_protected: false },
    { key: 'max_attachments', value: '5', category: 'uploads', description: 'Maximum number of attachments per request', is_protected: false },
    { key: 'session_timeout_minutes', value: '480', category: 'security', description: 'JWT/session lifetime in minutes (24h default)', is_protected: false },
    { key: 'multimedia_heartbeat_timeout_minutes', value: '3', category: 'multimedia', description: 'Minutes without a device heartbeat before it is marked offline', is_protected: false },
    { key: 'multimedia_device_limit', value: '100', category: 'multimedia', description: 'Maximum number of devices supported by the initial deployment', is_protected: false },
    { key: 'multimedia_allow_it_staff_commands', value: 'false', category: 'multimedia', description: 'Allow it_staff to send device commands (default off, configurable)', is_protected: false },
  ]);

  // Roles
  await knex('roles').insert([
    { name: 'staff', description: 'Hospital staff member' },
    { name: 'it_staff', description: 'IT support technician' },
    { name: 'it_supervisor', description: 'IT department supervisor' },
    { name: 'maintenance_staff', description: 'Maintenance technician' },
    { name: 'maintenance_supervisor', description: 'Maintenance department supervisor' },
    { name: 'admin', description: 'Hospital administrator' },
    { name: 'sys_admin', description: 'System administrator' },
  ]);

  // Departments
  await knex('departments').insert([
    { name: 'Administration' },
    { name: 'IT Department' },
    { name: 'Maintenance' },
    { name: 'Nursing' },
    { name: 'Laboratory' },
    { name: 'Pharmacy' },
    { name: 'Radiology' },
    { name: 'Emergency' },
    { name: 'Surgery' },
    { name: 'Outpatient' },
  ]);

  // IT Categories
  await knex('categories').insert([
    { name: 'Computer', type: 'it' },
    { name: 'Printer', type: 'it' },
    { name: 'Network', type: 'it' },
    { name: 'Internet', type: 'it' },
    { name: 'Email', type: 'it' },
    { name: 'Hospital Software', type: 'it' },
    { name: 'User Account', type: 'it' },
    { name: 'Password', type: 'it' },
    { name: 'Telephone', type: 'it' },
    { name: 'Hardware', type: 'it' },
    { name: 'Software', type: 'it' },
    { name: 'Other', type: 'it' },
    // Maintenance Categories
    { name: 'Plumbing', type: 'maintenance' },
    { name: 'Electrical', type: 'maintenance' },
    { name: 'Furniture', type: 'maintenance' },
    { name: 'Air Conditioning', type: 'maintenance' },
    { name: 'Building', type: 'maintenance' },
    { name: 'Medical Equipment', type: 'maintenance' },
    { name: 'Water', type: 'maintenance' },
    { name: 'Door/Window', type: 'maintenance' },
    { name: 'Lighting', type: 'maintenance' },
    { name: 'Generator', type: 'maintenance' },
    { name: 'Other', type: 'maintenance' },
  ]);

  // IT Statuses
  const itStatuses = ['New', 'Assigned', 'In Progress', 'Waiting for Information', 'Resolved', 'Closed'];
  for (let i = 0; i < itStatuses.length; i++) {
    await knex('statuses').insert({ name: itStatuses[i], type: 'it', sort_order: i });
  }

  // Maintenance Statuses
  const mStatuses = ['New', 'Assigned', 'Inspection', 'In Progress', 'Waiting for Parts', 'Completed', 'Closed'];
  for (let i = 0; i < mStatuses.length; i++) {
    await knex('statuses').insert({ name: mStatuses[i], type: 'maintenance', sort_order: i });
  }

  // Suggestion Statuses (primary flow first, supplementary statuses after)
  const sStatuses = ['Submitted', 'Under Review', 'Accepted', 'Assigned', 'Implementation', 'Implemented', 'Closed', 'Rejected', 'Needs More Information', 'Already Planned', 'Forwarded to Department'];
  for (let i = 0; i < sStatuses.length; i++) {
    await knex('statuses').insert({ name: sStatuses[i], type: 'suggestion', sort_order: i });
  }

  // Priorities
  await knex('priorities').insert([
    { name: 'Low', level: 1 },
    { name: 'Medium', level: 2 },
    { name: 'High', level: 3 },
    { name: 'Critical', level: 4 },
  ]);

  // Default users
  const hashedPassword = await bcrypt.hash('password123', 10);

  await knex('users').insert([
    { name: 'System Administrator', email: 'admin@newleaf.com', password: hashedPassword, employee_id: 'EMP-001', department_id: 1, role_id: 7, phone: '555-0100' },
    { name: 'Hospital Administrator', email: 'hospital.admin@newleaf.com', password: hashedPassword, employee_id: 'EMP-002', department_id: 1, role_id: 6, phone: '555-0101' },
    { name: 'John IT Supervisor', email: 'john.it@newleaf.com', password: hashedPassword, employee_id: 'EMP-003', department_id: 2, role_id: 3, phone: '555-0200' },
    { name: 'Mike Technician', email: 'mike.tech@newleaf.com', password: hashedPassword, employee_id: 'EMP-004', department_id: 2, role_id: 2, phone: '555-0201' },
    { name: 'Sarah IT Tech', email: 'sarah.tech@newleaf.com', password: hashedPassword, employee_id: 'EMP-005', department_id: 2, role_id: 2, phone: '555-0202' },
    { name: 'Ahmed Maint Supervisor', email: 'ahmed.maint@newleaf.com', password: hashedPassword, employee_id: 'EMP-006', department_id: 3, role_id: 5, phone: '555-0300' },
    { name: 'Ali Maint Tech', email: 'ali.maint@newleaf.com', password: hashedPassword, employee_id: 'EMP-007', department_id: 3, role_id: 4, phone: '555-0301' },
    { name: 'Fatima Nurse', email: 'fatima.nurse@newleaf.com', password: hashedPassword, employee_id: 'EMP-008', department_id: 4, role_id: 1, phone: '555-0400' },
    { name: 'Omar Doctor', email: 'omar.doctor@newleaf.com', password: hashedPassword, employee_id: 'EMP-009', department_id: 8, role_id: 1, phone: '555-0800' },
    { name: 'Layla Lab Tech', email: 'layla.lab@newleaf.com', password: hashedPassword, employee_id: 'EMP-010', department_id: 5, role_id: 1, phone: '555-0500' },
  ]);

  // ── Multimedia locations ────────────────────────────────────────────────────
  // Configurable hospital location tree. Inserted without explicit ids so the
  // sequences (RESTART IDENTITY) stay aligned with the fixed references below.
  const locRows = await knex('multimedia_locations').insert([
    { name: 'Hospital', level: 'campus', parent_id: null, description: 'New Leaf Complex' },
    { name: 'Building A', level: 'building', parent_id: null },
    { name: 'Floor 1', level: 'floor', parent_id: null },
    { name: 'Reception', level: 'location', parent_id: null },
    { name: 'Waiting Area', level: 'location', parent_id: null },
    { name: 'Room 101', level: 'room', parent_id: null },
    { name: 'Room 103', level: 'room', parent_id: null },
    { name: 'Floor 2', level: 'floor', parent_id: null },
    { name: 'Pediatric Ward', level: 'ward', parent_id: null },
    { name: 'Medical Ward', level: 'ward', parent_id: null },
    { name: 'Room 205', level: 'room', parent_id: null },
    { name: 'Building B', level: 'building', parent_id: null },
    { name: 'Floor 1', level: 'floor', parent_id: null },
    { name: 'Waiting Area', level: 'location', parent_id: null },
  ]).returning('id');
  const loc = locRows.map((r) => r.id);
  // Patch parents now that ids exist.
  await knex('multimedia_locations').where('id', loc[1]).update({ parent_id: loc[0] });
  await knex('multimedia_locations').where('id', loc[2]).update({ parent_id: loc[1] });
  await knex('multimedia_locations').whereIn('id', [loc[3], loc[4], loc[5], loc[6]]).update({ parent_id: loc[2] });
  await knex('multimedia_locations').where('id', loc[7]).update({ parent_id: loc[1] });
  await knex('multimedia_locations').whereIn('id', [loc[8], loc[9], loc[10]]).update({ parent_id: loc[7] });
  await knex('multimedia_locations').where('id', loc[11]).update({ parent_id: loc[0] });
  await knex('multimedia_locations').where('id', loc[12]).update({ parent_id: loc[11] });
  await knex('multimedia_locations').where('id', loc[13]).update({ parent_id: loc[12] });

  // ── Multimedia media library ────────────────────────────────────────────────
  // Placeholder 1x1 PNGs are written to the uploads dir so seeded media preview.
  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');
  const uploadsDir = path.resolve(__dirname, '..', '..', '..', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const pixPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  function writePlaceholderPng() {
    const name = `${crypto.randomUUID()}.png`;
    fs.writeFileSync(path.join(uploadsDir, name), pixPng);
    return name;
  }
  const welcomeFile = writePlaceholderPng();
  const childFile = writePlaceholderPng();
  const mediaRows = await knex('media_assets').insert([
    {
      title: 'Hospital Welcome Message', description: 'Branded hospital welcome content',
      category: 'Welcome Message', file_name: 'hospital-welcome.png', file_path: welcomeFile,
      file_type: 'png', mime_type: 'image/png', file_size: pixPng.length, status: 'active',
      uploaded_by: 5, tags: 'welcome,general',
    },
    {
      title: 'Child Health Info', description: 'Pediatric health education content',
      category: 'Health Education', file_name: 'child-health.png', file_path: childFile,
      file_type: 'png', mime_type: 'image/png', file_size: pixPng.length, status: 'active',
      uploaded_by: 5, tags: 'children,health',
    },
  ]).returning('id');
  const mediaWelcome = mediaRows[0].id;
  const mediaChild = mediaRows[1].id;

  // ── Multimedia devices ──────────────────────────────────────────────────────
  const now = new Date();
  const minsAgo = (m) => new Date(now.getTime() - m * 60000);
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
  const deviceRows = await knex('multimedia_devices').insert([
    {
      name: 'Reception TV', device_identifier: 'TV-001', device_type: 'tv', manufacturer: 'Samsung', model: 'Q60',
      location_id: loc[3], department_id: 10, room: 'Reception', ip_address: '10.20.1.11', connection_type: 'ethernet',
      player_identifier: 'player-reception', status: 'playing', supported_commands: 'play,stop',
      current_media_id: mediaWelcome, current_media_started_at: minsAgo(35), last_heartbeat_at: minsAgo(0), is_active: true, created_by: 3,
    },
    {
      name: 'Room 101 TV', device_identifier: 'TV-002', device_type: 'tv', manufacturer: 'Samsung', model: 'Q60',
      location_id: loc[5], department_id: 4, room: 'Room 101', ip_address: '10.20.1.12', connection_type: 'wifi',
      player_identifier: 'player-room101', status: 'idle', supported_commands: 'play,stop',
      last_heartbeat_at: minsAgo(2), is_active: true, created_by: 3,
    },
    {
      name: 'Pediatric Ward TV', device_identifier: 'TV-003', device_type: 'tv', manufacturer: 'LG', model: 'UR50',
      location_id: loc[8], department_id: 4, ward: 'Pediatric Ward', ip_address: '10.20.1.13', connection_type: 'ethernet',
      player_identifier: 'player-pediatrics', status: 'playing', supported_commands: 'play,stop',
      current_media_id: mediaChild, current_media_started_at: minsAgo(12), last_heartbeat_at: minsAgo(1), is_active: true, created_by: 3,
    },
    {
      name: 'Room 103 TV', device_identifier: 'TV-004', device_type: 'tv', manufacturer: 'Hisense', model: 'A6',
      location_id: loc[6], department_id: 5, room: 'Room 103', ip_address: '10.20.1.14', connection_type: 'wifi',
      player_identifier: 'player-room103', status: 'offline', supported_commands: 'play,stop',
      last_heartbeat_at: daysAgo(1), is_active: true, created_by: 3,
    },
    {
      name: 'Lobby Display', device_identifier: 'TV-005', device_type: 'display', manufacturer: 'Philips', model: 'BDL',
      location_id: loc[4], department_id: 10, floor: '1', room: 'Waiting Area', ip_address: '10.20.1.15', connection_type: 'ethernet',
      player_identifier: 'player-lobby', status: 'error', supported_commands: 'play,stop',
      status_message: 'Player application crashed', last_heartbeat_at: minsAgo(5), is_active: true, created_by: 3,
    },
    {
      name: 'Room 205 TV', device_identifier: 'TV-006', device_type: 'tv', manufacturer: 'LG', model: 'UR50',
      location_id: loc[10], department_id: 4, floor: '2', room: 'Room 205', ip_address: '10.20.1.16', connection_type: 'ethernet',
      player_identifier: 'player-room205', status: 'disabled', supported_commands: 'play,stop',
      last_heartbeat_at: minsAgo(70), is_active: false, created_by: 3,
    },
  ]).returning('id');
  const devIds = deviceRows.map((r) => r.id); // [Reception, Room101, Pediatric, Room103, Lobby, Room205]

  // ── Multimedia groups ───────────────────────────────────────────────────────
  const groupRows = await knex('multimedia_groups').insert([
    { name: 'All TVs', description: 'Every active display in the complex', is_active: true, created_by: 3 },
    { name: 'Pediatric Ward', description: 'Screens in the Pediatric Ward', is_active: true, created_by: 3 },
    { name: 'Waiting Areas', description: 'Public waiting-area screens', is_active: true, created_by: 3 },
    { name: 'Reception', description: 'Reception desk screens', is_active: true, created_by: 3 },
  ]).returning('id');
  const gIds = groupRows.map((r) => r.id); // [All TVs, Pediatric, Waiting, Reception]
  await knex('multimedia_group_devices').insert([
    { group_id: gIds[0], device_id: devIds[0] }, { group_id: gIds[0], device_id: devIds[1] }, { group_id: gIds[0], device_id: devIds[2] },
    { group_id: gIds[0], device_id: devIds[3] }, { group_id: gIds[0], device_id: devIds[4] },
    { group_id: gIds[1], device_id: devIds[2] },
    { group_id: gIds[2], device_id: devIds[4] },
    { group_id: gIds[3], device_id: devIds[0] },
  ]);

  // ── Sample playback history for the seeded devices ─────────────────────────
  await knex('playback_history').insert([
    { device_id: devIds[0], media_id: mediaWelcome, action: 'broadcast', status: 'success', started_at: minsAgo(35), triggered_by: 3, created_at: minsAgo(35) },
    { device_id: devIds[2], media_id: mediaChild, action: 'broadcast', status: 'success', started_at: minsAgo(12), triggered_by: 3, created_at: minsAgo(12) },
    { device_id: devIds[3], media_id: mediaWelcome, action: 'broadcast', status: 'offline', started_at: daysAgo(1), triggered_by: 3, error_message: 'Device offline at broadcast time', created_at: daysAgo(1) },
  ]);
};
