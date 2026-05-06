import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import type { PriceHistory, Outcome } from '../lib/api';
import { api } from '../lib/api';

interface PriceChartProps {
  priceHistory: PriceHistory[];
  outcomes: Outcome[];
  selectedIndicators: {
    ma7: boolean;
    ma20: boolean;
    ma50: boolean;
    rsi: boolean;
    bollingerBands: boolean;
  };
  marketId: string;
}

export function PriceChart({ priceHistory, outcomes, selectedIndicators, marketId }: PriceChartProps) {
  const firstOutcome = outcomes[0];

  const { data: indicators } = useQuery({
    queryKey: ['indicators', marketId, firstOutcome?.id],
    queryFn: () => api.getIndicators(marketId, firstOutcome?.id || ''),
    enabled: !!firstOutcome && Object.values(selectedIndicators).some(v => v),
  });

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

  // Merge indicators into chart data
  const mergedData = chartData.map(point => {
    const timestamp = point.timestamp;
    const merged: any = { ...point };

    if (indicators) {
      if (selectedIndicators.ma7) {
        const ma7Point = indicators.ma7.find(m => m.timestamp === timestamp);
        if (ma7Point) merged.MA7 = ma7Point.ma;
      }
      if (selectedIndicators.ma20) {
        const ma20Point = indicators.ma20.find(m => m.timestamp === timestamp);
        if (ma20Point) merged.MA20 = ma20Point.ma;
      }
      if (selectedIndicators.ma50) {
        const ma50Point = indicators.ma50.find(m => m.timestamp === timestamp);
        if (ma50Point) merged.MA50 = ma50Point.ma;
      }
      if (selectedIndicators.bollingerBands) {
        const bbPoint = indicators.bollingerBands.find(b => b.timestamp === timestamp);
        if (bbPoint) {
          merged.BB_Upper = bbPoint.upper;
          merged.BB_Middle = bbPoint.middle;
          merged.BB_Lower = bbPoint.lower;
        }
      }
    }

    return merged;
  });

  // Prepare RSI data if selected
  const rsiData = selectedIndicators.rsi && indicators
    ? indicators.rsi.map(r => ({
        timestamp: r.timestamp,
        time: new Date(r.timestamp).toISOString(),
        RSI: r.rsi,
      }))
    : [];

  // Generate colors for each outcome
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="w-full space-y-4">
      {/* Main Price Chart */}
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mergedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              formatter={(value: any) => typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : 'N/A'}
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
            {selectedIndicators.ma7 && (
              <Line
                type="monotone"
                dataKey="MA7"
                stroke="#9333ea"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
            {selectedIndicators.ma20 && (
              <Line
                type="monotone"
                dataKey="MA20"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
            {selectedIndicators.ma50 && (
              <Line
                type="monotone"
                dataKey="MA50"
                stroke="#06b6d4"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
            {selectedIndicators.bollingerBands && (
              <>
                <Line
                  type="monotone"
                  dataKey="BB_Upper"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line
                  type="monotone"
                  dataKey="BB_Middle"
                  stroke="#64748b"
                  strokeWidth={1}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="BB_Lower"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* RSI Chart */}
      {selectedIndicators.rsi && rsiData.length > 0 && (
        <div className="w-full h-48">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">RSI (Relative Strength Index)</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rsiData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={(time) => {
                  const date = new Date(time);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                labelFormatter={(time) => new Date(time).toLocaleString()}
                formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : 'N/A'}
              />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label="Overbought" />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label="Oversold" />
              <Line
                type="monotone"
                dataKey="RSI"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
