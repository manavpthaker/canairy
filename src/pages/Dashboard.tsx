import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Eye, Sparkles } from 'lucide-react';
import { useStore, selectSynthesisCards, selectAIInsights, selectLeadAIInsight, selectSecondaryAIInsights } from '../store';
import { IndicatorData } from '../types';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { DashboardLoader } from '../components/dashboard/DashboardLoader';
import { ThreatBanner } from '../components/dashboard/ThreatBanner';
import { StatusHeading } from '../components/dashboard/StatusHeading';
import { OutcomeSentence } from '../components/dashboard/OutcomeSentence';
import { PhaseReadinessCard } from '../components/dashboard/PhaseReadinessCard';
import { LeadCard, LeadCardData } from '../components/dashboard/LeadCard';
import { SecondaryCardsGrid, CompactRow, CompactRowData } from '../components/dashboard/SecondaryCard';
import { AIInsightCard, AIAnalysisSummary } from '../components/dashboard/AIInsightCard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getDisplayName, getImpact, getAction } from '../data/indicatorTranslations';

export const Dashboard: React.FC = () => {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);

  const {
    indicators,
    loading,
    refreshAll,
    synthesisLoading,
    synthesisOutput,
    runSynthesis,
    detailPanelCardId,
    setDetailPanelCardId,
    aiAnalysisLoading,
  } = useStore();

  const synthesisCards = useStore(selectSynthesisCards);
  const aiAnalysis = useStore(selectAIInsights);
  const leadAIInsight = useStore(selectLeadAIInsight);
  const secondaryAIInsights = useStore(selectSecondaryAIInsights);

  // Open detail panel when lead card is clicked
  const handleLeadCardClick = () => {
    if (synthesisOutput?.leadCard) {
      setDetailPanelCardId(synthesisOutput.leadCard.pattern.id);
    }
  };

  // Run synthesis when indicators change
  useEffect(() => {
    if (indicators.length > 0 && !synthesisCards) {
      runSynthesis();
    }
  }, [indicators.length]);

  // Fallback card data when synthesis hasn't run yet
  // Uses translation map for human-readable language
  const getFallbackCards = () => {
    const redIndicators = indicators.filter(i => i.status.level === 'red');
    const amberIndicators = indicators.filter(i => i.status.level === 'amber');

    let leadCard: LeadCardData | null = null;

    if (redIndicators.length >= 2) {
      // TIGHTEN-UP scenario - action-first language
      const impacts = redIndicators.slice(0, 2).map(i => getImpact(i.id, 'red'));
      leadCard = {
        id: 'fallback-action-protocol',
        headline: 'Start your emergency checklist now',
        body: `${impacts.join('. ')} Having cash, fuel, and supplies ready protects your family.`,
        urgency: 'today',
        indicatorIds: redIndicators.map(i => i.id),
        severity: 9,
        action: { label: 'Open 48-hour checklist', href: '/checklist' },
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
        action: { label: 'Add to checklist', href: '/checklist' },
      };
    } else if (amberIndicators.length >= 3) {
      // Multiple amber - encourage preparation without alarm
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
        action: { label: 'Review checklist', href: '/checklist' },
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

  // Use synthesis cards if available, otherwise fallback
  const cards = synthesisCards || getFallbackCards();

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
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
            {/* ──── 1. THREAT BANNER (when action protocol active) ──── */}
            <ErrorBoundary isolate>
              <ThreatBanner />
            </ErrorBoundary>

            {/* ──── 2. STATUS HEADING ──── */}
            <ErrorBoundary isolate>
              <div className="pt-2">
                <StatusHeading />
                <OutcomeSentence />
              </div>
            </ErrorBoundary>

            {/* ──── 3. PHASE READINESS CARD ──── */}
            <ErrorBoundary isolate>
              <PhaseReadinessCard />
            </ErrorBoundary>

            {/* ──── 4. LEAD CARD ──── */}
            <ErrorBoundary isolate>
              {synthesisLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="lead-card p-5"
                >
                  <div className="animate-pulse space-y-3">
                    <div className="w-24 h-5 bg-white/5 rounded" />
                    <div className="w-3/4 h-6 bg-white/5 rounded" />
                    <div className="w-full h-4 bg-white/5 rounded" />
                    <div className="w-2/3 h-4 bg-white/5 rounded" />
                  </div>
                </motion.div>
              ) : cards.leadCard ? (
                <LeadCard
                  data={{
                    ...cards.leadCard,
                    confidence: synthesisOutput?.leadCard ? 'moderate' : undefined,
                    signalCount: synthesisOutput?.leadCard?.matchedIndicators.length,
                  }}
                  onClick={handleLeadCardClick}
                  isSelected={detailPanelCardId === synthesisOutput?.leadCard?.pattern.id}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lead-card p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="urgency-pill urgency-knowing">No urgent items</span>
                  </div>
                  <h3 className="font-display text-display-lead text-olive-primary mb-2">
                    All systems nominal
                  </h3>
                  <p className="text-body-card text-olive-secondary leading-relaxed">
                    No indicators require immediate attention. Continue routine monitoring
                    and maintain your preparedness checklist.
                  </p>
                </motion.div>
              )}
            </ErrorBoundary>

            {/* ──── 5. AI INSIGHTS (True AI-Generated Analysis) ──── */}
            <ErrorBoundary isolate>
              {aiAnalysisLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-xs text-olive-muted">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>AI is analyzing indicators...</span>
                  </div>
                  <div className="secondary-card p-5 animate-pulse">
                    <div className="w-32 h-4 bg-white/5 rounded mb-3" />
                    <div className="w-3/4 h-5 bg-white/5 rounded mb-2" />
                    <div className="w-full h-4 bg-white/5 rounded" />
                  </div>
                </motion.div>
              ) : aiAnalysis && aiAnalysis.insights.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  {/* AI Overall Assessment */}
                  {aiAnalysis.outcomeSentence && (
                    <AIAnalysisSummary
                      overallAssessment={aiAnalysis.outcomeSentence}
                      hiddenConnections={aiAnalysis.hiddenConnections}
                      familyFocusedSummary={aiAnalysis.familyFocusedSummary}
                      phaseRelevance={aiAnalysis.phaseRelevance}
                    />
                  )}

                  {/* Lead AI Insight */}
                  {leadAIInsight && (
                    <AIInsightCard
                      insight={leadAIInsight}
                      variant="lead"
                    />
                  )}

                  {/* Secondary AI Insights */}
                  {secondaryAIInsights.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {secondaryAIInsights.map((insight) => (
                        <AIInsightCard
                          key={insight.id}
                          insight={insight}
                          variant="secondary"
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : null}
            </ErrorBoundary>

            {/* ──── 6. SECONDARY CARDS (Pattern-Based Fallback) ──── */}
            {(!aiAnalysis || aiAnalysis.insights.length === 0) && cards.secondaryCards && cards.secondaryCards.length > 0 && (
              <ErrorBoundary isolate>
                <SecondaryCardsGrid cards={cards.secondaryCards as any} />
              </ErrorBoundary>
            )}

            {/* ──── 7. COMPACT ROWS ──── */}
            {cards.compactRows && cards.compactRows.length > 0 && (
              <ErrorBoundary isolate>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-xs font-medium text-olive-tertiary uppercase tracking-wider mb-2">
                    Also monitoring
                  </h3>
                  <div className="secondary-card divide-y divide-olive">
                    {cards.compactRows.map((row, index) => (
                      <CompactRow key={row.id} data={row} index={index} />
                    ))}
                  </div>
                </motion.div>
              </ErrorBoundary>
            )}

            {/* ──── BOTTOM MICROCOPY ──── */}
            <div className="text-center py-8">
              <p className="text-xs text-olive-muted">
                Preparedness is confidence. Monitor, plan, act.
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
