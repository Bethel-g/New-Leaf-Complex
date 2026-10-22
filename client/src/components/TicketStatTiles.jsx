import { Inbox, UserX, Hourglass, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';
import { useTranslation } from '../i18n';

/**
 * Summary tiles shown above a ticket list. The counts are derived from the
 * caller's filtered set so they always describe what is on screen.
 */
export default function TicketStatTiles({ stats, accent = 'blue' }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title={t('common.labels.total')} value={stats?.total ?? 0} icon={Inbox} color={accent} />
      <StatCard title={t('common.labels.unassigned')} value={stats?.unassigned ?? 0} icon={UserX} color="yellow" />
      <StatCard title={t('common.labels.waiting')} value={stats?.waiting ?? 0} icon={Hourglass} color="purple" />
      <StatCard title={t('common.labels.critical')} value={stats?.critical ?? 0} icon={AlertTriangle} color="red" />
    </div>
  );
}
