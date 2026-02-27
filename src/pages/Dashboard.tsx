import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Activity,
  Bell,
  CheckSquare,
  Shield,
  ChevronRight,
  Heart,
  AlertTriangle,
  TrendingUp,
  Eye,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { IndicatorData, DOMAIN_META, Domain } from '../types';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { ActionablePriorityActions } from '../components/dashboard/ActionablePriorityActions';
import { TightenUpBanner } from '../components/dashboard/TightenUpBanner';
import { NewsTicker } from '../components/news/NewsTicker';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { canairyMessages } from '../content/canairy-messages';
import { cn } from '../utils/cn';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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

  // Checklist progress from localStorage
  const checklistProgress = useMemo(() => {
    try {
      const stored = localStorage.getItem('canairy_checklist');
      const items = stored ? JSON.parse(stored) : [];
      return items.length;
    } catch { return 0; }
  }, []);

  // Domain summary — which domains need attention
  const domainsAtRisk = useMemo(() => {
    return Object.entries(DOMAIN_META)
      .map(([key, meta]) => {
        const domainIndicators = indicators.filter(i => i.domain === key);
        const red = domainIndicators.filter(i => i.status.level === 'red').length;
        const amber = domainIndicators.filter(i => i.status.level === 'amber').length;
        return { key: key as Domain, label: meta.label, red, amber, total: domainIndicators.length };
      })
      .filter(d => d.red > 0 || d.amber > 0)
      .sort((a, b) => b.red - a.red || b.amber - a.amber);
  }, [indicators]);

  // Items that need attention (red first, then amber)
  const attentionItems = useMemo(() => {
    return [...indicators]
      .filter(i => i.status.level === 'red' || i.status.level === 'amber')
      .sort((a, b) => {
        if (a.status.level === 'red' && b.status.level !== 'red') return -1;
        if (a.status.level !== 'red' && b.status.level === 'red') return 1;
        if (a.critical && !b.critical) return -1;
        if (!a.critical && b.critical) return 1;
        return 0;
      })
      .slice(0, 5);
  }, [indicators]);

  const statusGradient = overallStatus === 'action'
    ? 'from-red-500/10 via-red-500/5 to-transparent border-red-500/20'
    : overallStatus === 'attention'
      ? 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20'
      : 'from-green-500/10 via-green-500/5 to-transparent border-green-500/20';

  const statusDot = overallStatus === 'action' ? 'bg-red-500' : overallStatus === 'attention' ? 'bg-amber-500' : 'bg-green-500';

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Loading state */}
        {loading && indicators.length === 0 && (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-[#111111] rounded-2xl border border-[#1A1A1A]" />
            <div className="h-48 bg-[#111111] rounded-2xl border border-[#1A1A1A]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-[#111111] rounded-2xl border border-[#1A1A1A]" />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && indicators.length === 0 && (
          <div className="text-center py-24">
            <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Setting things up...</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Canairy is trying to connect. This usually takes just a moment.
            </p>
            <button
              onClick={refreshAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {indicators.length > 0 && (
          <>
            {/* ──────── HERO: Family Status ──────── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-2xl border bg-gradient-to-br p-6 sm:p-8',
                statusGradient
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn('w-3 h-3 rounded-full', statusDot, overallStatus === 'action' && 'animate-pulse')} />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      {statusMsg.title}
                    </h1>
                  </div>
                  <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                    {statusMsg.message}
                  </p>

                  {/* Quick stats row */}
                  <div className="flex flex-wrap items-center gap-4 mt-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-400">{greenCount} looking good</span>
                    </div>
                    {amberCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-sm text-gray-400">{amberCount} to watch</span>
                      </div>
                    )}
                    {redCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-sm text-gray-400">{redCount} need{redCount === 1 ? 's' : ''} action</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button — contextual */}
                <div className="flex-shrink-0">
                  {overallStatus === 'action' ? (
                    <Link
                      to="/checklist"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-lg shadow-red-500/20"
                    >
                      <Zap className="w-5 h-5" />
                      See What To Do
                    </Link>
                  ) : overallStatus === 'attention' ? (
                    <Link
                      to="/checklist"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-colors font-medium"
                    >
                      <CheckSquare className="w-5 h-5" />
                      Review Actions
                    </Link>
                  ) : (
                    <Link
                      to="/checklist"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl hover:bg-[#2A2A2A] transition-colors font-medium border border-[#2A2A2A]"
                    >
                      <CheckSquare className="w-5 h-5" />
                      Family Checklist
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>

            {/* News Ticker */}
            <ErrorBoundary isolate>
              <NewsTicker maxItems={5} />
            </ErrorBoundary>

            {/* Tighten-Up Banner — emergency mode */}
            <ErrorBoundary isolate>
              <TightenUpBanner />
            </ErrorBoundary>

            {/* ──────── QUICK ACTIONS ROW ──────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <QuickActionCard
                icon={<CheckSquare className="w-5 h-5" />}
                label="Family Actions"
                sublabel={checklistProgress > 0 ? `${checklistProgress} done` : 'Get started'}
                to="/checklist"
                accent="indigo"
              />
              <QuickActionCard
                icon={<Shield className="w-5 h-5" />}
                label="Family Plan"
                sublabel={`Phase ${currentPhase?.number ?? 0}`}
                to="/playbook"
                accent="blue"
              />
              <QuickActionCard
                icon={<Eye className="w-5 h-5" />}
                label="What We Watch"
                sublabel={`${indicators.length} things`}
                to="/indicators"
                accent="purple"
              />
              <QuickActionCard
                icon={<Bell className="w-5 h-5" />}
                label="Heads Up"
                sublabel={redCount > 0 ? `${redCount} alert${redCount !== 1 ? 's' : ''}` : 'All clear'}
                to="/alerts"
                accent={redCount > 0 ? 'red' : 'green'}
              />
            </div>

            {/* ──────── THINGS THAT NEED ATTENTION ──────── */}
            {attentionItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-[#111111] rounded-2xl border border-[#1A1A1A] overflow-hidden"
              >
                <div className="px-5 sm:px-6 py-4 border-b border-[#1A1A1A] flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Things that need your attention
                  </h2>
                  <Link to="/indicators" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    See all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                  {attentionItems.map(ind => (
                    <button
                      key={ind.id}
                      onClick={() => setSelectedIndicator(ind)}
                      className="w-full px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-[#0A0A0A] transition-colors text-left"
                    >
                      <span className={cn(
                        'w-2.5 h-2.5 rounded-full flex-shrink-0',
                        ind.status.level === 'red' ? 'bg-red-500' : 'bg-amber-500',
                        ind.status.level === 'red' && ind.critical && 'animate-pulse'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">{ind.name}</div>
                        <div className="text-xs text-gray-500 truncate">{ind.description}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-mono text-gray-300">
                          {typeof ind.status.value === 'number' ? ind.status.value.toFixed(1) : ind.status.value}
                        </span>
                        <span className="text-xs text-gray-500">{ind.unit}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ──────── AREAS WE'RE WATCHING ──────── */}
            {domainsAtRisk.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-[#111111] rounded-2xl border border-[#1A1A1A] p-5 sm:p-6"
              >
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  Areas we're watching closely
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {domainsAtRisk.map(domain => (
                    <div
                      key={domain.key}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A]"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-gray-200 font-medium">{domain.label}</div>
                        <div className="text-xs text-gray-500">
                          {domain.red > 0 && <span className="text-red-400">{domain.red} critical</span>}
                          {domain.red > 0 && domain.amber > 0 && <span> &middot; </span>}
                          {domain.amber > 0 && <span className="text-amber-400">{domain.amber} elevated</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: domain.total }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'w-1.5 h-4 rounded-full',
                              i < domain.red ? 'bg-red-500' : i < domain.red + domain.amber ? 'bg-amber-500' : 'bg-green-500/30'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ──────── WHAT TO DO (Priority Actions) ──────── */}
            <ErrorBoundary isolate>
              <ActionablePriorityActions />
            </ErrorBoundary>

            {/* ──────── BOTTOM CTA ──────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-12 border-t border-[#1A1A1A]"
            >
              <p className="text-gray-400 mb-2 text-sm">
                Being prepared isn't about fear — it's about confidence.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Small steps today mean your family stays calm tomorrow.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/checklist"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  <CheckSquare className="w-4 h-4" />
                  Family Checklist
                </Link>
                <Link
                  to="/indicators"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-gray-300 rounded-xl hover:bg-[#2A2A2A] transition-colors font-medium text-sm border border-[#2A2A2A]"
                >
                  <Eye className="w-4 h-4" />
                  See Everything We Watch
                </Link>
              </div>
            </motion.div>
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

/* ── Quick Action Card ── */
function QuickActionCard({ icon, label, sublabel, to, accent }: {
  icon: React.ReactNode; label: string; sublabel: string; to: string;
  accent: 'indigo' | 'blue' | 'purple' | 'red' | 'green';
}) {
  const accentMap = {
    indigo: 'border-indigo-500/20 hover:border-indigo-500/40',
    blue: 'border-blue-500/20 hover:border-blue-500/40',
    purple: 'border-purple-500/20 hover:border-purple-500/40',
    red: 'border-red-500/20 hover:border-red-500/40',
    green: 'border-green-500/20 hover:border-green-500/40',
  };
  const iconColor = {
    indigo: 'text-indigo-400', blue: 'text-blue-400', purple: 'text-purple-400',
    red: 'text-red-400', green: 'text-green-400',
  };

  return (
    <Link
      to={to}
      className={cn(
        'bg-[#111111] rounded-xl border p-4 hover:bg-[#0A0A0A] transition-all group',
        accentMap[accent]
      )}
    >
      <div className={cn('mb-2', iconColor[accent])}>{icon}</div>
      <div className="text-sm font-medium text-white group-hover:text-white">{label}</div>
      <div className="text-xs text-gray-500">{sublabel}</div>
    </Link>
  );
}
