import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function CategoryChart({ title, data, color }) {
  const height = data && data.length > 0 ? Math.max(data.length * 38, 180) : 120;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      {!data || data.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}