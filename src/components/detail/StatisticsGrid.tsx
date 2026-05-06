import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import StatCard from './StatCard';

interface StatisticsGridProps {
  marketId: string;
  outcomeId: string;
}

export default function StatisticsGrid({ marketId, outcomeId }: StatisticsGridProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics', marketId, outcomeId],
    queryFn: () => api.getStatistics(marketId, outcomeId),
    enabled: !!marketId && !!outcomeId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        No statistics available
      </div>
    );
  }

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toFixed(0);
  };

  const getRSITrend = (): 'up' | 'down' | 'neutral' => {
    if (!stats.technicalSummary.rsi) return 'neutral';
    if (stats.technicalSummary.rsi.status === 'overbought') return 'up';
    if (stats.technicalSummary.rsi.status === 'oversold') return 'down';
    return 'neutral';
  };

  const getMATrend = (): 'up' | 'down' | 'neutral' => {
    if (!stats.technicalSummary.maTrend) return 'neutral';
    if (stats.technicalSummary.maTrend.trend === 'bullish') return 'up';
    if (stats.technicalSummary.maTrend.trend === 'bearish') return 'down';
    return 'neutral';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Current Price */}
      <StatCard
        title="Current Price"
        value={(stats.currentPrice * 100).toFixed(1)}
        unit="¢"
        change={stats.change24h?.changePercent}
        trend={stats.change24h && stats.change24h.changePercent > 0 ? 'up' : stats.change24h && stats.change24h.changePercent < 0 ? 'down' : 'neutral'}
      />

      {/* 24h Change */}
      <StatCard
        title="24h Price Change"
        value={stats.change24h ? `${(stats.change24h.change * 100).toFixed(2)}¢` : 'N/A'}
        subtitle={stats.change24h ? `${stats.change24h.changePercent.toFixed(2)}%` : undefined}
        trend={stats.change24h && stats.change24h.change > 0 ? 'up' : stats.change24h && stats.change24h.change < 0 ? 'down' : 'neutral'}
      />

      {/* Total Volume */}
      <StatCard
        title="Total Volume"
        value={`$${formatVolume(stats.totalVolume)}`}
      />

      {/* 24h Volume */}
      <StatCard
        title="24h Volume"
        value={`$${formatVolume(stats.volume24h)}`}
        subtitle="Estimated"
      />

      {/* Volatility */}
      <StatCard
        title="Volatility (7d)"
        value={stats.volatility ? (stats.volatility.volatility * 100).toFixed(2) : 'N/A'}
        unit="%"
        subtitle={stats.volatility ? 'Standard deviation' : undefined}
      />

      {/* Spread (Liquidity) */}
      <StatCard
        title="Spread"
        value={stats.spread ? (stats.spread.spread * 100).toFixed(2) : 'N/A'}
        unit="¢"
        subtitle={stats.spread ? `${stats.spread.spreadPercent.toFixed(2)}% spread` : 'N/A'}
      />

      {/* RSI Status */}
      <StatCard
        title="RSI Status"
        value={stats.technicalSummary.rsi ? stats.technicalSummary.rsi.value.toFixed(1) : 'N/A'}
        subtitle={stats.technicalSummary.rsi ? stats.technicalSummary.rsi.status : undefined}
        trend={getRSITrend()}
      />

      {/* MA Trend */}
      <StatCard
        title="MA Trend"
        value={stats.technicalSummary.maTrend ? stats.technicalSummary.maTrend.trend : 'N/A'}
        subtitle={stats.technicalSummary.maTrend ? stats.technicalSummary.maTrend.description : undefined}
        trend={getMATrend()}
      />
    </div>
  );
}
