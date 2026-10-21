export function EmptyState({ title, subtitle, icon: Icon }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
      <div className="text-gray-500 font-medium">{title}</div>
      {subtitle && <div className="text-gray-400 text-sm mt-1">{subtitle}</div>}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  );
}