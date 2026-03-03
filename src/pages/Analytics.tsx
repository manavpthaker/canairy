import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  Eye,
  Info,
} from 'lucide-react';
import { useStore } from '../store';
import { DOMAIN_META, Domain } from '../types';
import { ScoreRing } from '../components/ui/ScoreRing';
import { GlassCard } from '../components/ui/GlassCard';
import { cn } from '../utils/cn';
import {
  generateSituationNarrative,
  generateDomainInsight,
  generateAllClearNarrative,
} from '../utils/narrative';
import { getIndicatorDescription } from '../data/indicatorDescriptions';

export const Analytics: React.FC = () => {
  const { indicators, hopiScore } = useStore();

  const narrative = useMemo(
    () => generateSituationNarrative(indicators),
    [indicators]
  );

  const domainInsights = useMemo(() => {
    return Object.keys(DOMAIN_META)
      .map(key => generateDomainInsight(key as Domain, indicators))
      .filter(Boolean) as NonNullable<ReturnType<typeof generateDomainInsight>>[];
  }, [indicators]);

  const watchList = useMemo(() => {
    return indicators
      .filter(i => i.status.level === 'amber' && i.status.trend === 'up' && i.enabled !== false)
      .slice(0, 5)
      .map(i => {
        const desc = getIndicatorDescription(i.id);
        return {
          id: i.id,
          name: i.name,
          value: i.status.value,
          unit: i.unit,
          redThreshold: i.thresholds?.threshold_red,
          whyItMatters: desc?.whyItMatters || i.description,
        };
      });
  }, [indicators]);

  const trendStats = useMemo(() => {
    const enabled = indicators.filter(i => i.enabled !== false);
    const up = enabled.filter(i => i.status.trend === 'up').length;
    const down = enabled.filter(i => i.status.trend === 'down').length;
    const stable = enabled.filter(i => !i.status.trend || i.status.trend === 'stable').length;
    return { up, down, stable };
  }, [indicators]);

  const sourceStats = useMemo(() => {
    const live = indicators.filter(i => i.status.dataSource === 'LIVE').length;
    const demo = indicators.filter(i => i.status.dataSource === 'MOCK' || i.status.dataSource === 'DEMO').length;
    const manual = indicators.filter(i => i.status.dataSource === 'MANUAL').length;
    return { live, demo, manual };
  }, [indicators]);

  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const amberCount = indicators.filter(i => i.status.level === 'amber').length;

  // Worseningdomains for trend summary sentence
  const trendSentence = useMemo(() => {
    if (trendStats.up === 0 && trendStats.down === 0) return 'All indicators are holding steady.';
    const parts: string[] = [];
    if (trendStats.up > 0) parts.push(`${trendStats.up} indicator${trendStats.up !== 1 ? 's' : ''} getting worse`);
    if (trendStats.down > 0) parts.push(`${trendStats.down} improving`);
    if (trendStats.stable > 0) parts.push(`${trendStats.stable} stable`);
    return parts.join(', ') + '.';
  }, [trendStats]);

  return (
    <>
      <div className="border-b border-white/[0.04]">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white">Insights</h1>
          <p className="text-white/30 mt-1 text-sm">What's happening, why it matters, and what to do about it</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8 max-w-6xl mx-auto">

        {/* ── Section 1: Situation Summary ── */}
        <GlassCard
          glow={narrative?.riskLevel === 'critical' ? 'red' : narrative?.riskLevel === 'serious' ? 'amber' : 'green'}
        >
          <div className="flex items-start gap-3 mb-3">
            <Info className={cn(
              'w-5 h-5 mt-0.5 flex-shrink-0',
              narrative ? (narrative.riskLevel === 'critical' ? 'text-red-400' : 'text-amber-400') : 'text-green-400'
            )} />
            <h2 className="text-lg font-semibold text-white">
              {narrative ? 'What\'s happening right now' : 'All clear'}
            </h2>
          </div>

          {narrative ? (
            <div className="ml-8 space-y-3">
              <p className="text-sm text-white/60 leading-relaxed">
                {narrative.explanation}
              </p>
              <p className="text-sm text-white/40 leading-relaxed">
                {narrative.whatToDoAboutIt}
              </p>

              {/* Key indicators driving this */}
              <div className="flex flex-wrap gap-2 mt-2">
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
                    {ind.name}: {ind.currentValue}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/40 ml-8 leading-relaxed">
              {generateAllClearNarrative(indicators)}
            </p>
          )}
        </GlassCard>

        {/* ── Section 2: Domain Deep-Dives ── */}
        {domainInsights.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-white/20 uppercase tracking-wider mb-3">Domain breakdown</h2>
            <div className="space-y-3">
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
                    <GlassCard>
                      <div className="flex items-start gap-4">
                        {/* Score ring */}
                        <div className="flex-shrink-0 hidden sm:block">
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

                          {/* Indicator details */}
                          <div className="space-y-2">
                            {insight.indicators.map(ind => (
                              <div
                                key={ind.id}
                                className="flex items-start gap-3 px-3 py-2 rounded-lg bg-white/[0.02]"
                              >
                                <span className={cn(
                                  'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                                  ind.level === 'red' ? 'bg-red-500' : 'bg-amber-500'
                                )} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm text-white/70 font-medium">{ind.name}</span>
                                    <span className={cn(
                                      'text-xs font-mono',
                                      ind.level === 'red' ? 'text-red-400' : 'text-amber-400'
                                    )}>
                                      {ind.value}
                                    </span>
                                  </div>
                                  {ind.actionGuidance && (
                                    <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{ind.actionGuidance}</p>
                                  )}
                                </div>
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
          </div>
        )}

        {/* ── Section 3: What to Watch ── */}
        {watchList.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-amber-400/50" />
              <h2 className="text-xs font-medium text-white/20 uppercase tracking-wider">What to watch</h2>
            </div>
            <p className="text-sm text-white/30 mb-3">
              These amber indicators are trending worse and could need action soon.
            </p>
            <div className="space-y-2">
              {watchList.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard padding="sm">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-4 h-4 text-amber-400/60 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-white/70">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-amber-400">
                              {item.value} {item.unit}
                            </span>
                            {item.redThreshold && (
                              <span className="text-xs text-white/20">
                                / {item.redThreshold} red
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-white/30 leading-relaxed">{item.whyItMatters}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 4: Trend Summary ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard>
            <h2 className="text-xs font-medium text-white/20 uppercase tracking-wider mb-2">Direction of change</h2>
            <p className="text-sm text-white/40 mb-4">{trendSentence}</p>
            <div className="space-y-3">
              <TrendRow icon={<TrendingUp className="w-4 h-4 text-red-400/60" />} label="Getting worse" count={trendStats.up} total={indicators.length} color="bg-red-500/60" />
              <TrendRow icon={<Minus className="w-4 h-4 text-white/20" />} label="Holding steady" count={trendStats.stable} total={indicators.length} color="bg-white/20" />
              <TrendRow icon={<TrendingDown className="w-4 h-4 text-green-400/60" />} label="Getting better" count={trendStats.down} total={indicators.length} color="bg-green-500/50" />
            </div>
          </GlassCard>

          {/* Data sources */}
          <GlassCard>
            <h2 className="text-xs font-medium text-white/20 uppercase tracking-wider mb-4">Data sources</h2>
            <div className="space-y-3">
              <TrendRow icon={<Activity className="w-4 h-4 text-green-400/60" />} label="Live data" count={sourceStats.live} total={indicators.length} color="bg-green-500/50" />
              <TrendRow icon={<Activity className="w-4 h-4 text-amber-400/60" />} label="Demo data" count={sourceStats.demo} total={indicators.length} color="bg-amber-500/50" />
              <TrendRow icon={<Activity className="w-4 h-4 text-blue-400/60" />} label="Manual" count={sourceStats.manual} total={indicators.length} color="bg-blue-500/50" />
            </div>
            {sourceStats.demo > 0 && (
              <p className="text-xs text-white/20 mt-3">
                {sourceStats.demo} indicator{sourceStats.demo !== 1 ? 's' : ''} using demo data.
                Connect to a backend for live values.
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
