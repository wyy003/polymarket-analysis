interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export default function StatCard({ title, value, unit, change, trend, subtitle }: StatCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-lg font-semibold text-gray-900">
          {value}
          {unit && <span className="text-sm font-normal text-gray-600 ml-1">{unit}</span>}
        </div>
        {change !== undefined && (
          <div className={`text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()} {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </div>
        )}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </div>
  );
}
