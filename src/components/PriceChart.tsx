import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PriceHistory, Outcome } from '../lib/api';

interface PriceChartProps {
  priceHistory: PriceHistory[];
  outcomes: Outcome[];
}

export function PriceChart({ priceHistory, outcomes }: PriceChartProps) {
  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No price history available</p>
      </div>
    );
  }

  // Group price history by timestamp
  const dataByTimestamp = priceHistory.reduce((acc, item) => {
    const timestamp = new Date(item.timestamp).getTime();
    if (!acc[timestamp]) {
      acc[timestamp] = { timestamp, time: item.timestamp };
    }
    const outcome = outcomes.find(o => o.id === item.outcome_id);
    if (outcome) {
      acc[timestamp][outcome.name] = item.price;
    }
    return acc;
  }, {} as Record<number, any>);

  const chartData = Object.values(dataByTimestamp).sort((a, b) =>
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  // Generate colors for each outcome
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickFormatter={(time) => {
              const date = new Date(time);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <Tooltip
            labelFormatter={(time) => new Date(time).toLocaleString()}
            formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
          />
          <Legend />
          {outcomes.map((outcome, index) => (
            <Line
              key={outcome.id}
              type="monotone"
              dataKey={outcome.name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
