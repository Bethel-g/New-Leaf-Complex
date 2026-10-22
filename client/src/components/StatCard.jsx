export default function StatCard({ title, value, icon: Icon, color = 'primary', sub }) {
  const colors = {
    primary: 'bg-primary-soft text-brand-text',
    success: 'bg-success-soft text-success-soft-text',
    blue: 'bg-blue-soft text-blue-soft-text',
    red: 'bg-red-soft text-red-soft-text',
    yellow: 'bg-yellow-soft text-yellow-soft-text',
    purple: 'bg-purple-soft text-purple-soft-text',
    indigo: 'bg-indigo-soft text-indigo-soft-text',
    orange: 'bg-orange-soft text-orange-soft-text',
  };
  return (
    <div className="group bg-surface rounded-2xl border border-gray-200/80 p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-500 truncate">{title}</div>
          <div className="text-3xl font-bold text-gray-800 mt-1 tracking-tight">{value}</div>
          {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 shrink-0 rounded-xl ${colors[color]} flex items-center justify-center ring-1 ring-inset ring-black/5 transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
