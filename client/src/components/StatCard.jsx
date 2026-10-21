export default function StatCard({ title, value, icon: Icon, color = 'primary', sub }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="group bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 animate-fade-in-up">
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
