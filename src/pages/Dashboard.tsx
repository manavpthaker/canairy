import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { IndicatorData, DOMAIN_META, Domain } from '../types';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { ThreatBanner } from '../components/dashboard/ThreatBanner';
import { NextActionCard } from '../components/dashboard/NextActionCard';
import { WeeklyPriorities } from '../components/dashboard/WeeklyPriorities';
import { CompactIndicatorRow } from '../components/dashboard/CompactIndicatorRow';
import { ScoreRing } from '../components/ui/ScoreRing';
import { GlassCard } from '../components/ui/GlassCard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { canairyMessages } from '../content/canairy-messages';
import { cn } from '../utils/cn';
import { generateSituationNarrative, generateDomainNarrative, generateAllClearNarrative } from '../utils/narrative';

export const Dashboard: React.FC = () => {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);

  const {
    indicators,
    hopiScore,
    currentPhase,
    loading,
    refreshAll
  } = useStore();

  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const amberCount = indicators.filter(i => i.status.level === 'amber').length;
  const greenCount = indicators.filter(i => i.status.level === 'green').length;

  const overallStatus = useMemo(() => {
    if (redCount >= 2) return 'action' as const;
    if (redCount > 0 || amberCount >= 3) return 'attention' as const;
    return 'allGood' as const;
  }, [redCount, amberCount]);

  const statusMsg = canairyMessages.status[overallStatus];

  // Generate narrative context
  const narrative = useMemo(
    () => generateSituationNarrative(indicators),
    [indicators]
  );

  const narrativeContext = useMemo(() => {
    if (overallStatus === 'allGood') return generateAllClearNarrative(indicators);
    if (narrative) return narrative.explanation;
    return statusMsg.message;
  }, [overallStatus, narrative, indicators, statusMsg.message]);

  // Domain summary
  const domainsAtRisk = useMemo(() => {
    return Object.entries(DOMAIN_META)
      .map(([key, meta]) => {
        const domainIndicators = indicators.filter(i => i.domain === key);
        const red = domainIndicators.filter(i => i.status.level === 'red').length;
        const amber = domainIndicators.filter(i => i.status.level === 'amber').length;
        const green = domainIndicators.filter(i => i.status.level === 'green').length;
        const score = hopiScore?.domains[key as Domain]?.score ?? 0;
        return { key: key as Domain, label: meta.label, red, amber, green, total: domainIndicators.length, score };
      })
      .filter(d => d.total > 0)
      .sort((a, b) => b.red - a.red || b.amber - a.amber);
  }, [indicators, hopiScore]);

  const phaseColor = overallStatus === 'action' ? '#EF4444' : overallStatus === 'attention' ? '#F59E0B' : '#10B981';

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Loading state */}
        {loading && indicators.length === 0 && (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 glass-card" />
            <div className="h-48 glass-card" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 glass-card" />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && indicators.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">Setting things up...</h3>
            <p className="text-white/30 mb-6 max-w-md mx-auto">
              Canairy is connecting to data sources. This usually takes just a moment.
            </p>
            <button
              onClick={refreshAll}
              className="btn btn-primary"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {indicators.length > 0 && (
          <>
            {/* ──── 1. THREAT BANNER ──── */}
            <ErrorBoundary isolate>
              <ThreatBanner />
            </ErrorBoundary>

            {/* ──── 2. SCORE HERO ──── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard
                padding="lg"
                glow={overallStatus === 'action' ? 'red' : overallStatus === 'attention' ? 'amber' : 'green'}
              >
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  {/* Score Ring */}
                  <div className="flex-shrink-0">
                    <ScoreRing
                      value={hopiScore?.score ?? 0}
                      max={100}
                      size="lg"
                      color={phaseColor}
                      label="HOPI"
                    />
                  </div>

                  {/* Status text */}
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-white mb-1">
                      {statusMsg.title}
                    </h1>
                    <p className="text-sm text-white/40 leading-relaxed max-w-lg">
                      {narrativeContext}
                    </p>

                    {/* Phase + Stats row */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border"
                        style={{
                          backgroundColor: `${phaseColor}10`,
                          borderColor: `${phaseColor}25`,
                          color: phaseColor,
                        }}
                      >
                        Phase {currentPhase?.number ?? 0}
                        <span className="opacity-60">&mdash; {currentPhase?.name ?? 'Foundations'}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-white/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {greenCount}
                        </span>
                        {amberCount > 0 && (
                          <span className="flex items-center gap-1.5 text-xs text-white/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {amberCount}
                          </span>
                        )}
                        {redCount > 0 && (
                          <span className="flex items-center gap-1.5 text-xs text-white/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {redCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* ──── 3. NEXT ACTION ──── */}
            <ErrorBoundary isolate>
              <NextActionCard />
            </ErrorBoundary>

            {/* ──── 4. THIS WEEK'S PRIORITIES ──── */}
            <ErrorBoundary isolate>
              <WeeklyPriorities />
            </ErrorBoundary>

            {/* ──── 5. COMPACT INDICATORS ──── */}
            <ErrorBoundary isolate>
              <CompactIndicatorRow onIndicatorClick={setSelectedIndicator} />
            </ErrorBoundary>

            {/* ──── 6. DOMAIN OVERVIEW ──── */}
            {domainsAtRisk.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Domains</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {domainsAtRisk.map((domain, idx) => (
                    <motion.div
                      key={domain.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + idx * 0.03 }}
                    >
                      <Link to={`/indicators?domain=${domain.key}`}>
                        <GlassCard
                          padding="sm"
                          interactive
                          glow={domain.red > 0 ? 'red' : domain.amber > 0 ? 'amber' : 'none'}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-white">{domain.label}</h3>
                            <span className={cn(
                              'text-xs font-mono',
                              domain.score > 66 ? 'text-red-400' : domain.score > 33 ? 'text-amber-400' : 'text-green-400'
                            )}>
                              {Math.round(domain.score)}
                            </span>
                          </div>
                          {/* Mini stacked bar */}
                          <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                            {domain.red > 0 && (
                              <div className="bg-red-500/70 rounded-full" style={{ width: `${(domain.red / domain.total) * 100}%` }} />
                            )}
                            {domain.amber > 0 && (
                              <div className="bg-amber-500/60 rounded-full" style={{ width: `${(domain.amber / domain.total) * 100}%` }} />
                            )}
                            {domain.green > 0 && (
                              <div className="bg-green-500/40 rounded-full" style={{ width: `${(domain.green / domain.total) * 100}%` }} />
                            )}
                          </div>
                          {/* Domain narrative */}
                          {(domain.red > 0 || domain.amber > 0) && (
                            <p className="text-xs text-white/25 mt-2 leading-relaxed line-clamp-2">
                              {generateDomainNarrative(domain.key, indicators)}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-white/20">{domain.total} indicators</span>
                            <ChevronRight className="w-3 h-3 text-white/15" />
                          </div>
                        </GlassCard>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ──── BOTTOM MICROCOPY ──── */}
            <div className="text-center py-8">
              <p className="text-xs text-white/15">
                Being prepared isn't about fear — it's about confidence.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Indicator Modal */}
      {selectedIndicator && (
        <IndicatorModal
          isOpen={!!selectedIndicator}
          onClose={() => setSelectedIndicator(null)}
          indicator={selectedIndicator}
        />
      )}
    </>
  );
};
