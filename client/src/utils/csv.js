/**
 * Client-side CSV export. Rows are plain objects; keys become the header row.
 * Shared by the ticket lists, reports and the audit log so every "Export"
 * button produces the same quoting and download behaviour.
 */
export function downloadCSV(rows, filename) {
  if (!rows || rows.length === 0) return false;
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${(value === null || value === undefined ? '' : value).toString().replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
