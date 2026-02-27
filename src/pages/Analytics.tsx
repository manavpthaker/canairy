import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../store';
import { DOMAIN_META, Domain } from '../types';
import { cn } from '../utils/cn';

export const Analytics: React.FC = () => {
  const { indicators, hopiScore } = useStore();

  // Domain analysis
  const domainStats = useMemo(() => {
    return Object.entries(DOMAIN_META).map(([key, meta]) => {
      const domainIndicators = indicators.filter(i => i.domain === key);
      const total = domainIndicators.length;
      const red = domainIndicators.filter(i => i.status.level === 'red').length;
      const amber = domainIndicators.filter(i => i.status.level === 'amber').length;
      const green = domainIndicators.filter(i => i.status.level === 'green').length;
      const domainScore = hopiScore?.domains[key as Domain]?.score ?? 0;

      return { key: key as Domain, ...meta, total, red, amber, green, domainScore };
    }).sort((a, b) => b.red - a.red || b.amber - a.amber);
  }, [indicators, hopiScore]);

  // Trend analysis
  const trendStats = useMemo(() => {
    const up = indicators.filter(i => i.status.trend === 'up').length;
    const down = indicators.filter(i => i.status.trend === 'down').length;
    const stable = indicators.filter(i => !i.status.trend || i.status.trend === 'stable').length;
    return { up, down, stable };
  }, [indicators]);

  // Data source breakdown
  const sourceStats = useMemo(() => {
    const live = indicators.filter(i => i.status.dataSource === 'LIVE').length;
    const mock = indicators.filter(i => i.status.dataSource === 'MOCK').length;
    const manual = indicators.filter(i => i.status.dataSource === 'MANUAL').length;
    return { live, mock, manual };
  }, [indicators]);

  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const amberCount = indicators.filter(i => i.status.level === 'amber').length;
  const greenCount = indicators.filter(i => i.status.level === 'green').length;

  return (
    <>
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#1A1A1A]">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">Trends</h1>
          <p className="text-gray-400 mt-1">The big picture — how things are changing across all the areas we watch</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8">
        {/* Top-level stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Things Monitored" value={indicators.length} icon={<Activity className="w-5 h-5 text-indigo-400" />} />
          <StatCard label="Need Action" value={redCount} icon={<AlertTriangle className="w-5 h-5 text-red-400" />} accent="red" />
          <StatCard label="Worth Watching" value={amberCount} icon={<Shield className="w-5 h-5 text-amber-400" />} accent="amber" />
          <StatCard label="Looking Good" value={greenCount} icon={<Shield className="w-5 h-5 text-green-400" />} accent="green" />
        </div>

        {/* HOPI Score overview */}
        {hopiScore && (
          <div className="bg-[#111111] rounded-2xl border border-[#1A1A1A] p-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Overall Preparedness Score</h2>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-5xl font-bold text-white">{Math.round(hopiScore.score)}</span>
              <span className="text-gray-500 text-lg">/100</span>
              <span className="text-sm text-gray-400 ml-2">Phase {hopiScore.phase}</span>
            </div>
            <div className="w-full h-3 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  hopiScore.score > 66 ? 'bg-red-500' : hopiScore.score > 33 ? 'bg-amber-500' : 'bg-green-500'
                )}
                style={{ width: `${hopiScore.score}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Confidence: {Math.round(hopiScore.confidence * 100)}%
            </p>
          </div>
        )}

        {/* Domain Breakdown */}
        <div className="bg-[#111111] rounded-2xl border border-[#1A1A1A] p-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Areas We Monitor</h2>
          <div className="space-y-4">
            {domainStats.map((domain, idx) => (
              <motion.div
                key={domain.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-4"
              >
                <div className="w-36 sm:w-44 flex-shrink-0">
                  <div className="text-sm text-gray-300 font-medium">{domain.label}</div>
                  <div className="text-xs text-gray-500">{domain.total} indicators &middot; {domain.weight}x weight</div>
                </div>

                {/* Stacked bar */}
                <div className="flex-1 flex items-center gap-1">
                  <div className="flex-1 h-6 bg-[#0A0A0A] rounded-lg overflow-hidden flex">
                    {domain.red > 0 && (
                      <div className="bg-red-500/80 h-full" style={{ width: `${(domain.red / domain.total) * 100}%` }} />
                    )}
                    {domain.amber > 0 && (
                      <div className="bg-amber-500/80 h-full" style={{ width: `${(domain.amber / domain.total) * 100}%` }} />
                    )}
                    {domain.green > 0 && (
                      <div className="bg-green-500/60 h-full" style={{ width: `${(domain.green / domain.total) * 100}%` }} />
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="w-14 text-right">
                  <span className={cn(
                    'text-sm font-mono font-medium',
                    domain.domainScore > 66 ? 'text-red-400' : domain.domainScore > 33 ? 'text-amber-400' : 'text-green-400'
                  )}>
                    {Math.round(domain.domainScore)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom row: trends + data sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trend distribution */}
          <div className="bg-[#111111] rounded-2xl border border-[#1A1A1A] p-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Which Way Things Are Moving</h2>
            <div className="space-y-4">
              <TrendRow icon={<TrendingUp className="w-4 h-4 text-red-400" />} label="Getting worse" count={trendStats.up} total={indicators.length} color="bg-red-500" />
              <TrendRow icon={<Minus className="w-4 h-4 text-gray-400" />} label="Holding steady" count={trendStats.stable} total={indicators.length} color="bg-gray-500" />
              <TrendRow icon={<TrendingDown className="w-4 h-4 text-green-400" />} label="Getting better" count={trendStats.down} total={indicators.length} color="bg-green-500" />
            </div>
          </div>

          {/* Data source health */}
          <div className="bg-[#111111] rounded-2xl border border-[#1A1A1A] p-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Where Our Data Comes From</h2>
            <div className="space-y-4">
              <TrendRow icon={<BarChart3 className="w-4 h-4 text-green-400" />} label="Live sources" count={sourceStats.live} total={indicators.length} color="bg-green-500" />
              <TrendRow icon={<BarChart3 className="w-4 h-4 text-amber-400" />} label="Estimated" count={sourceStats.mock} total={indicators.length} color="bg-amber-500" />
              <TrendRow icon={<BarChart3 className="w-4 h-4 text-blue-400" />} label="Manually checked" count={sourceStats.manual} total={indicators.length} color="bg-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: string }) {
  const borderClass = accent === 'red' ? 'border-red-500/10' : accent === 'amber' ? 'border-amber-500/10' : accent === 'green' ? 'border-green-500/10' : 'border-[#1A1A1A]';
  return (
    <div className={cn('bg-[#111111] rounded-xl border p-4', borderClass)}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function TrendRow({ icon, label, count, total, color }: { icon: React.ReactNode; label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm text-gray-300 w-24">{label}</span>
      <div className="flex-1 h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
    </div>
  );
}
