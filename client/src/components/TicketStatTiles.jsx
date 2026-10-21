import { Inbox, UserX, Hourglass, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';

/**
 * Summary tiles shown above a ticket list. The counts are derived from the
 * caller's filtered set so they always describe what is on screen.
 */
export default function TicketStatTiles({ stats, accent = 'blue' }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="Total" value={stats?.total ?? 0} icon={Inbox} color={accent} />
      <StatCard title="Unassigned" value={stats?.unassigned ?? 0} icon={UserX} color="yellow" />
      <StatCard title="Waiting" value={stats?.waiting ?? 0} icon={Hourglass} color="purple" />
      <StatCard title="Critical" value={stats?.critical ?? 0} icon={AlertTriangle} color="red" />
    </div>
  );
}
