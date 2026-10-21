export default function StatusSteps({ steps, color = 'blue', title = 'Status pipeline' }) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
  };
  const countTone = {
    blue: 'text-blue-800',
    orange: 'text-orange-800',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
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