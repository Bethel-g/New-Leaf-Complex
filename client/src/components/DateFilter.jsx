import { useTranslation } from '../i18n';

const PRESETS = [
  { key: 'today', labelKey: 'common.dateFilter.today' },
  { key: 'week', labelKey: 'common.dateFilter.week' },
  { key: 'month', labelKey: 'common.dateFilter.month' },
  { key: 'custom', labelKey: 'common.dateFilter.custom' },
];

export default function DateFilter({ period, from, to, onChange }) {
  const { t } = useTranslation();
  const setPeriod = (key) => onChange({ period: key, from: '', to: '' });

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('common.dateFilter.label')}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          aria-pressed={period === p.key}
          onClick={() => setPeriod(p.key)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            period === p.key
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-surface text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {t(p.labelKey)}
        </button>
      ))}
      {period === 'custom' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <input
            type="date"
            value={from}
            onChange={(e) => onChange({ period: 'custom', from: e.target.value, to })}
            aria-label={t('common.dateFilter.from')}
            className="border border-gray-300 rounded-lg px-2 py-1.5 bg-surface text-gray-700"
          />
          <span>{t('common.dateFilter.toLabel')}</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onChange({ period: 'custom', from, to: e.target.value })}
            aria-label={t('common.dateFilter.to')}
            className="border border-gray-300 rounded-lg px-2 py-1.5 bg-surface text-gray-700"
          />
        </div>
      )}
    </div>
  );
}