import { useTranslation } from '../i18n';

export default function StatusSteps({ steps, color = 'blue', title }) {
  const { t } = useTranslation();
  const heading = title || t('common.statusPipeline');
  const tones = {
    blue: 'border-blue-soft-border bg-blue-soft text-blue-soft-text',
    orange: 'border-orange-soft-border bg-orange-soft text-orange-soft-text',
  };
  const countTone = {
    blue: 'text-blue-soft-text',
    orange: 'text-orange-soft-text',
  };
  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">{heading}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((s) => (
          <div key={s.label} className={`rounded-lg border px-3 py-2.5 ${tones[color] || tones.blue}`}>
            <div className={`text-2xl font-bold ${countTone[color] || countTone.blue}`}>{s.count}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}