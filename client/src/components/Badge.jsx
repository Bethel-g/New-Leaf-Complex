export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-success-100 text-success-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    indigo: 'bg-indigo-100 text-indigo-700',
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