/**
 * Dashboard Page
 *
 * Streamlined layout:
 * 1. Welcome banner (first visit)
 * 2. Threat/Phase banner with actions (main CTA)
 * 3. What's happening (signals driving the plan)
 * 4. Also monitoring (low priority tracking with detail)
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore, selectSynthesisCards, selectAIInsights, selectLeadAIInsight, selectSecondaryAIInsights } from '../store';
import { IndicatorData, DOMAIN_META } from '../types';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { DashboardLoader } from '../components/dashboard/DashboardLoader';
import { ThreatBanner } from '../components/dashboard/ThreatBanner';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { LeadCard, LeadCardData } from '../components/dashboard/LeadCard';
import { SecondaryCardsGrid, CompactRow, CompactRowData } from '../components/dashboard/SecondaryCard';
import { AIInsightCard, AIAnalysisSummary } from '../components/dashboard/AIInsightCard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getDisplayName, getImpact, getAction } from '../data/indicatorTranslations';
import { cn } from '../utils/cn';

export const Dashboard: React.FC = () => {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);
  const [showLegacyInsights, setShowLegacyInsights] = useState(false);

  const {
    indicators,
    loading,
    refreshAll,
    runSynthesis,
    systemPhase,
  } = useStore();

  const synthesisCards = useStore(selectSynthesisCards);
  const aiAnalysis = useStore(selectAIInsights);
  const leadAIInsight = useStore(selectLeadAIInsight);
  const secondaryAIInsights = useStore(selectSecondaryAIInsights);

  // Count indicators by level
  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const amberCount = indicators.filter(i => i.status.level === 'amber').length;
  const elevatedCount = redCount + amberCount;

  // Run synthesis when indicators change
  useEffect(() => {
    if (indicators.length > 0 && !synthesisCards) {
      runSynthesis();
    }
  }, [indicators.length]);

  // Fallback card data when synthesis hasn't run yet
  const getFallbackCards = () => {
    const redIndicators = indicators.filter(i => i.status.level === 'red');
    const amberIndicators = indicators.filter(i => i.status.level === 'amber');

    let leadCard: LeadCardData | null = null;

    if (redIndicators.length >= 2) {
      const impacts = redIndicators.slice(0, 2).map(i => getImpact(i.id, 'red'));
      leadCard = {
        id: 'fallback-action-protocol',
        headline: 'Check your action plan now',
        body: `${impacts.join('. ')} Having cash, fuel, and supplies ready protects your family.`,
        urgency: 'today',
        indicatorIds: redIndicators.map(i => i.id),
        severity: 9,
        action: { label: 'Open action plan', href: '/action-plan' },
      };
    } else if (redIndicators.length === 1) {
      const ind = redIndicators[0];
      const impact = getImpact(ind.id, 'red');
      const action = getAction(ind.id, 'red');
      leadCard = {
        id: `fallback-${ind.id}`,
        headline: action,
        body: impact,
        urgency: 'today',
        indicatorIds: [ind.id],
        severity: 7,
        action: { label: 'View action plan', href: '/action-plan' },
      };
    } else if (amberIndicators.length >= 3) {
      const topIndicator = amberIndicators[0];
      const action = getAction(topIndicator.id, 'amber');
      const impact = getImpact(topIndicator.id, 'amber');
      leadCard = {
        id: 'fallback-elevated',
        headline: action,
        body: `${impact}. Now is a good time to review your supplies and ensure everything is current.`,
        urgency: 'week',
        indicatorIds: amberIndicators.map(i => i.id),
        severity: 5,
        action: { label: 'Review action plan', href: '/action-plan' },
      };
    }

    const compactRows: CompactRowData[] = amberIndicators.slice(0, 5).map(ind => ({
      id: `fallback-compact-${ind.id}`,
      text: getDisplayName(ind.id),
      domain: ind.domain,
      href: `/indicators?highlight=${ind.id}`,
    }));

    return { leadCard, secondaryCards: [], compactRows };
  };

  const cards = synthesisCards || getFallbackCards();

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 w-full">
        {/* Loading state */}
        {loading && indicators.length === 0 && (
          <DashboardLoader message="Loading indicator data..." />
        )}

        {/* Empty state */}
        {!loading && indicators.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-olive-tertiary" />
            </div>
            <h3 className="text-xl font-display font-semibold text-olive-primary mb-2">
              Setting things up...
            </h3>
            <p className="text-olive-secondary mb-6 max-w-md mx-auto">
              Canairy is connecting to data sources. This usually takes just a moment.
            </p>
            <button onClick={refreshAll} className="btn btn-primary">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {indicators.length > 0 && (
          <>
            {/* ──── 1. WELCOME BANNER (First visit only) ──── */}
            <ErrorBoundary isolate>
              <WelcomeBanner />
            </ErrorBoundary>

            {/* ──── 2. THREAT/PHASE BANNER (main CTA with actions) ──── */}
            <ErrorBoundary isolate>
              <ThreatBanner />
            </ErrorBoundary>

            {/* ──── 3. WHAT'S HAPPENING (Signals) ──── */}
            {(cards.leadCard || (cards.secondaryCards && cards.secondaryCards.length > 0)) && (
              <ErrorBoundary isolate>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="pt-2"
                >
                  <h3 className="text-xs font-medium text-olive-tertiary uppercase tracking-wider mb-3">
                    What's happening — {elevatedCount} signal{elevatedCount !== 1 ? 's' : ''} elevated
                  </h3>

                  <div className="space-y-4">
                    {cards.leadCard && (
                      <LeadCard data={cards.leadCard} />
                    )}
                    {cards.secondaryCards && cards.secondaryCards.length > 0 && (
                      <SecondaryCardsGrid cards={cards.secondaryCards.filter(Boolean) as any} />
                    )}
                  </div>
                </motion.div>
              </ErrorBoundary>
            )}

            {/* ──── 4. ALSO MONITORING (Enhanced with domain grouping) ──── */}
            <ErrorBoundary isolate>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-olive-tertiary uppercase tracking-wider">
                    Also monitoring
                  </h3>
                  <Link
                    to="/indicators"
                    className="text-xs text-olive-400 hover:text-olive-300 transition-colors flex items-center gap-1"
                  >
                    View all
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="glass-card p-4">
                  {/* Group by domain with counts */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(
                      indicators.reduce((acc, ind) => {
                        const domain = ind.domain;
                        if (!acc[domain]) {
                          acc[domain] = { green: 0, amber: 0, red: 0 };
                        }
                        acc[domain][ind.status.level === 'unknown' ? 'green' : ind.status.level]++;
                        return acc;
                      }, {} as Record<string, { green: number; amber: number; red: number }>)
                    )
                      .filter(([domain]) => DOMAIN_META[domain as keyof typeof DOMAIN_META])
                      .sort((a, b) => {
                        // Sort by severity (red first, then amber)
                        const aScore = a[1].red * 10 + a[1].amber;
                        const bScore = b[1].red * 10 + b[1].amber;
                        return bScore - aScore;
                      })
                      .slice(0, 9)
                      .map(([domain, counts]) => {
                        const meta = DOMAIN_META[domain as keyof typeof DOMAIN_META];
                        const hasRed = counts.red > 0;
                        const hasAmber = counts.amber > 0;
                        return (
                          <Link
                            key={domain}
                            to={`/indicators?domain=${encodeURIComponent(domain)}`}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                              'hover:bg-white/5',
                              hasRed ? 'bg-red-500/5' : hasAmber ? 'bg-amber-500/5' : 'bg-white/[0.02]'
                            )}
                          >
                            <span className={cn(
                              'text-sm truncate',
                              hasRed ? 'text-red-300' : hasAmber ? 'text-amber-300' : 'text-olive-300'
                            )}>
                              {meta?.label || domain}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {counts.red > 0 && (
                                <span className="text-[10px] font-mono text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded">
                                  {counts.red}
                                </span>
                              )}
                              {counts.amber > 0 && (
                                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                                  {counts.amber}
                                </span>
                              )}
                              {counts.red === 0 && counts.amber === 0 && (
                                <span className="w-2 h-2 rounded-full bg-green-500/60" />
                              )}
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
            </ErrorBoundary>

            {/* ──── 5. LEGACY AI INSIGHTS (Collapsible) ──── */}
            {aiAnalysis && aiAnalysis.insights.length > 0 && (
              <ErrorBoundary isolate>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={() => setShowLegacyInsights(!showLegacyInsights)}
                    className="w-full flex items-center justify-between py-2 text-left text-xs font-medium text-olive-tertiary uppercase tracking-wider hover:text-olive-secondary transition-colors"
                  >
                    <span>Additional Analysis</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showLegacyInsights ? 'rotate-180' : ''}`} />
                  </button>
                  {showLegacyInsights && (
                    <div className="space-y-4 mt-2">
                      {aiAnalysis.outcomeSentence && (
                        <AIAnalysisSummary
                          overallAssessment={aiAnalysis.outcomeSentence}
                          hiddenConnections={aiAnalysis.hiddenConnections}
                          familyFocusedSummary={aiAnalysis.familyFocusedSummary}
                          phaseRelevance={aiAnalysis.phaseRelevance}
                        />
                      )}
                      {leadAIInsight && (
                        <AIInsightCard insight={leadAIInsight} variant="lead" />
                      )}
                      {secondaryAIInsights.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {secondaryAIInsights.map((insight) => (
                            <AIInsightCard key={insight.id} insight={insight} variant="secondary" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </ErrorBoundary>
            )}

            {/* ──── BOTTOM MICROCOPY ──── */}
            <div className="text-center py-8">
              <p className="text-xs text-olive-muted">
                Intelligence briefing powered by Canairy
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
