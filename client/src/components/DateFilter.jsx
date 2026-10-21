const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'custom', label: 'Custom range' },
];

export default function DateFilter({ period, from, to, onChange }) {
  const setPeriod = (key) => onChange({ period: key, from: '', to: '' });

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Date range filter">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          aria-pressed={period === p.key}
          onClick={() => setPeriod(p.key)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            period === p.key
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {p.label}
        </button>
      ))}
      {period === 'custom' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <input
            type="date"
            value={from}
            onChange={(e) => onChange({ period: 'custom', from: e.target.value, to })}
            aria-label="From date"
            className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700"
          />
          <span>to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onChange({ period: 'custom', from, to: e.target.value })}
            aria-label="To date"
            className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700"
          />
        </div>
      )}
    </div>
  );
}