import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Info,
  Database,
} from 'lucide-react';
import { useStore } from '../store';
import { DOMAIN_META, Domain } from '../types';
import { ScoreRing } from '../components/ui/ScoreRing';
import { GlassCard } from '../components/ui/GlassCard';
import { generateSituationNarrative, generateDomainInsight, generateAllClearNarrative } from '../utils/narrative';
import { getIndicatorDescription } from '../data/indicatorDescriptions';
import { cn } from '../utils/cn';

export const Analytics: React.FC = () => {
  const { indicators, hopiScore } = useStore();

  const narrative = useMemo(() => generateSituationNarrative(indicators), [indicators]);

  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const amberCount = indicators.filter(i => i.status.level === 'amber').length;
  const greenCount = indicators.filter(i => i.status.level === 'green').length;

  const overallStatus = useMemo(() => {
    if (redCount >= 2) return 'action' as const;
    if (redCount > 0 || amberCount >= 3) return 'attention' as const;
    return 'allGood' as const;
  }, [redCount, amberCount]);

  // Domain deep-dives: only domains with amber/red
  const domainInsights = useMemo(() => {
    return Object.keys(DOMAIN_META)
      .map(key => generateDomainInsight(key as Domain, indicators))
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => {
        const aRed = a.indicators.filter(i => i.level === 'red').length;
        const bRed = b.indicators.filter(i => i.level === 'red').length;
        if (aRed !== bRed) return bRed - aRed;
        return b.indicators.length - a.indicators.length;
      });
  }, [indicators]);

  // Amber indicators trending worse
  const watchList = useMemo(() => {
    return indicators
      .filter(i => i.status.level === 'amber' && i.status.trend === 'up' && i.enabled !== false)
      .map(ind => {
        const desc = getIndicatorDescription(ind.id);
        return {
          id: ind.id,
          name: ind.name,
          value: ind.status.value,
          unit: ind.unit,
          whyItMatters: desc?.whyItMatters || ind.description,
        };
      });
  }, [indicators]);

  // Trend summary
  const trendStats = useMemo(() => {
    const enabled = indicators.filter(i => i.enabled !== false);
    const up = enabled.filter(i => i.status.trend === 'up').length;
    const down = enabled.filter(i => i.status.trend === 'down').length;
    const stable = enabled.filter(i => !i.status.trend || i.status.trend === 'stable').length;
    return { up, down, stable };
  }, [indicators]);

  // Data sources
  const sourceStats = useMemo(() => {
    const live = indicators.filter(i => i.status.dataSource === 'LIVE').length;
    const demo = indicators.filter(i => i.status.dataSource === 'DEMO').length;
    const mock = indicators.filter(i => i.status.dataSource === 'MOCK').length;
    const manual = indicators.filter(i => i.status.dataSource === 'MANUAL').length;
    return { live, demo, mock, manual };
  }, [indicators]);

  return (
    <>
      <div className="border-b border-white/[0.04]">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white">Insights</h1>
          <p className="text-white/30 mt-1 text-sm">What the data means for your family right now</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8 max-w-6xl mx-auto">

        {/* ── Section 1: What's happening right now ── */}
        <GlassCard
          glow={overallStatus === 'action' ? 'red' : overallStatus === 'attention' ? 'amber' : 'green'}
        >
          <h2 className="text-xs font-medium text-white/20 uppercase tracking-wider mb-3">
            What's happening right now
          </h2>
          {overallStatus === 'allGood' ? (
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-400/60 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white/60 leading-relaxed">
                  {generateAllClearNarrative(indicators)}
                </p>
                <p className="text-white/30 text-sm mt-2">
                  All {greenCount} green indicators are within normal ranges. No preparedness actions needed.
                </p>
              </div>
            </div>
          ) : narrative ? (
            <div className="space-y-4">
              <p className="text-lg font-medium text-white/80">{narrative.headline}</p>
              <p className="text-white/50 leading-relaxed">{narrative.explanation}</p>
              <p className="text-white/40 leading-relaxed">{narrative.whatToDoAboutIt}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {narrative.keyIndicators.slice(0, 5).map(ind => (
                  <span
                    key={ind.id}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-lg',
                      ind.currentLevel === 'red'
                        ? 'bg-red-500/15 text-red-300 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/15'
                    )}
                  >
                    {ind.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-white/40">Analyzing indicators...</p>
          )}
        </GlassCard>

        {/* ── Section 2: Domain deep-dives ── */}
        {domainInsights.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-white/20 uppercase tracking-wider">Domain breakdown</h2>
            {domainInsights.map((insight, idx) => {
              const domainScore = hopiScore?.domains[insight.domain]?.score ?? 0;
              const scoreColor = domainScore > 66 ? '#EF4444' : domainScore > 33 ? '#F59E0B' : '#10B981';
              return (
                <motion.div
                  key={insight.domain}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard
                    glow={insight.indicators.some(i => i.level === 'red') ? 'red' : 'amber'}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <ScoreRing
                          value={domainScore}
                          max={100}
                          size="sm"
                          color={scoreColor}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white mb-1">{insight.label}</h3>
                        <p className="text-sm text-white/40 leading-relaxed mb-3">
                          {insight.narrative}
                        </p>
                        <div className="space-y-2">
                          {insight.indicators.map(ind => (
                            <div key={ind.id} className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                  ind.level === 'red' ? 'bg-red-500' : 'bg-amber-500'
                                )} />
                                <span className="text-xs text-white/60 font-medium">{ind.name}</span>
                                <span className="text-xs text-white/20 font-mono ml-auto">{ind.value}</span>
                              </div>
                              {ind.actionGuidance && (
                                <p className="text-xs text-white/25 pl-4 leading-relaxed">
                                  {ind.actionGuidance}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Section 3: What to watch ── */}
        {watchList.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-white/20 uppercase tracking-wider mb-3">What to watch</h2>
            <GlassCard glow="amber">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-amber-400/60" />
                <span className="text-sm text-amber-300/80">
                  {watchList.length} indicator{watchList.length !== 1 ? 's' : ''} at amber and trending worse
                </span>
              </div>
              <div className="space-y-3">
                {watchList.map(item => (
                  <div key={item.id} className="border-l-2 border-amber-500/20 pl-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm text-white/60 font-medium">{item.name}</span>
                      <TrendingUp className="w-3 h-3 text-amber-400/60" />
                      <span className="text-xs text-white/20 font-mono ml-auto">{item.value} {item.unit}</span>
                    </div>
                    <p className="text-xs text-white/30 leading-relaxed">{item.whyItMatters}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── Section 4: Trend summary ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard>
            <h2 className="text-xs font-medium text-white/20 uppercase tracking-wider mb-4">Direction of change</h2>
            <p className="text-sm text-white/40 mb-4">
              {trendStats.up} indicator{trendStats.up !== 1 ? 's' : ''} getting worse,{' '}
              {trendStats.down} improving,{' '}
              {trendStats.stable} stable.
            </p>
            <div className="space-y-3">
              <TrendRow icon={<TrendingUp className="w-4 h-4 text-red-400/60" />} label="Getting worse" count={trendStats.up} total={indicators.length} color="bg-red-500/60" />
              <TrendRow icon={<Minus className="w-4 h-4 text-white/20" />} label="Holding steady" count={trendStats.stable} total={indicators.length} color="bg-white/20" />
              <TrendRow icon={<TrendingDown className="w-4 h-4 text-green-400/60" />} label="Getting better" count={trendStats.down} total={indicators.length} color="bg-green-500/50" />
            </div>
          </GlassCard>

          {/* ── Section 5: Data sources ── */}
          <GlassCard>
            <h2 className="text-xs font-medium text-white/20 uppercase tracking-wider mb-4">Data sources</h2>
            <div className="space-y-3">
              <TrendRow icon={<Activity className="w-4 h-4 text-green-400/60" />} label="Live" count={sourceStats.live} total={indicators.length} color="bg-green-500/50" />
              <TrendRow icon={<Database className="w-4 h-4 text-amber-400/60" />} label="Demo" count={sourceStats.demo} total={indicators.length} color="bg-amber-500/50" />
              <TrendRow icon={<Activity className="w-4 h-4 text-blue-400/60" />} label="Estimated" count={sourceStats.mock} total={indicators.length} color="bg-blue-500/50" />
              <TrendRow icon={<Info className="w-4 h-4 text-white/20" />} label="Manual" count={sourceStats.manual} total={indicators.length} color="bg-white/20" />
            </div>
            {(sourceStats.demo + sourceStats.mock) > 0 && (
              <p className="text-xs text-white/20 mt-4 pt-3 border-t border-white/[0.04]">
                {sourceStats.demo + sourceStats.mock} indicator{(sourceStats.demo + sourceStats.mock) !== 1 ? 's' : ''} using demo data.
                Results may not reflect real-world conditions.
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </>
  );
};

function TrendRow({ icon, label, count, total, color }: { icon: React.ReactNode; label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm text-white/40 w-24">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-white/25 w-8 text-right">{count}</span>
    </div>
  );
}
