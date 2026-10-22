export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-success-soft-strong text-success-soft-text',
    red: 'bg-red-soft-strong text-red-soft-text',
    yellow: 'bg-yellow-soft-strong text-yellow-soft-text',
    blue: 'bg-blue-soft-strong text-blue-soft-text',
    purple: 'bg-purple-soft-strong text-purple-soft-text',
    orange: 'bg-orange-soft-strong text-orange-soft-text',
    cyan: 'bg-cyan-soft-strong text-cyan-soft-text',
    indigo: 'bg-indigo-soft-strong text-indigo-soft-text',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

// oxlint-disable-next-line react/only-export-components
export function statusColor(status) {
  const map = {
    'New': 'blue',
    'Submitted': 'blue',
    'Assigned': 'indigo',
    'In Progress': 'yellow',
    'Inspection': 'yellow',
    'Waiting for Information': 'orange',
    'Waiting for Parts': 'orange',
    'Resolved': 'green',
    'Completed': 'green',
    'Closed': 'gray',
    'Under Review': 'cyan',
    'Accepted': 'green',
    'Rejected': 'red',
    'Need More Information': 'orange',
    'Needs More Information': 'orange',
    'Already Planned': 'indigo',
    'Forwarded to Department': 'purple',
    'Implementation': 'yellow',
    'Implemented': 'green',
  };
  return map[status] || 'gray';
}

// oxlint-disable-next-line react/only-export-components
export function priorityColor(priority) {
  const map = {
    Low: 'blue',
    Medium: 'yellow',
    High: 'orange',
    Critical: 'red',
  };
  return map[priority] || 'gray';
}