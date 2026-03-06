/**
 * Dashboard Page
 *
 * Briefing-first layout: Status → Intelligence Briefing → Phase Readiness → Monitoring
 * The intelligence briefing is the primary element - synthesizing indicators into actionable narrative.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Eye, Sparkles, ChevronDown } from 'lucide-react';
import { useStore, selectSynthesisCards, selectAIInsights, selectLeadAIInsight, selectSecondaryAIInsights } from '../store';
import { IndicatorData } from '../types';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { DashboardLoader } from '../components/dashboard/DashboardLoader';
import { ThreatBanner } from '../components/dashboard/ThreatBanner';
import { StatusHeading } from '../components/dashboard/StatusHeading';
import { OutcomeSentence } from '../components/dashboard/OutcomeSentence';
import { ActionPlanPreview } from '../components/dashboard/ActionPlanPreview';
import { PhaseReadinessCard } from '../components/dashboard/PhaseReadinessCard';
import { ActionList } from '../components/dashboard/ActionList';
import { LeadCard, LeadCardData } from '../components/dashboard/LeadCard';
import { SecondaryCardsGrid, CompactRow, CompactRowData } from '../components/dashboard/SecondaryCard';
import { AIInsightCard, AIAnalysisSummary } from '../components/dashboard/AIInsightCard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getDisplayName, getImpact, getAction } from '../data/indicatorTranslations';
import { generateActionList, generateOutcomeSentence, getStatusHeading } from '../data/actionGenerator';
import { useActionCompletion, usePhaseTaskCompletion } from '../hooks/useTaskCompletion';
import { BriefingCard } from '../components/briefing';
import { useBriefing } from '../hooks/useBriefing';

export const Dashboard: React.FC = () => {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);
  const [showLegacyInsights, setShowLegacyInsights] = useState(false);

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
    systemPhase,
  } = useStore();

  const synthesisCards = useStore(selectSynthesisCards);
  const aiAnalysis = useStore(selectAIInsights);
  const leadAIInsight = useStore(selectLeadAIInsight);
  const secondaryAIInsights = useStore(selectSecondaryAIInsights);

  // Intelligence briefing hook
  const phaseNum = typeof systemPhase === 'number' ? systemPhase : (systemPhase === 'tighten-up' ? 7 : 2);
  const { briefing, isLoading: briefingLoading, refresh: refreshBriefing } = useBriefing(indicators, {
    userPhase: phaseNum,
    autoRefresh: true,
  });

  // Action completion persistence
  const { completedIds: actionCompletedIds, toggle: toggleAction } = useActionCompletion();
  const { completedIds: phaseCompletedIds } = usePhaseTaskCompletion();

  // Merge completed IDs for action generation
  const allCompletedIds = useMemo(() => {
    const merged = new Set<string>();
    actionCompletedIds.forEach(id => merged.add(id));
    phaseCompletedIds.forEach(id => merged.add(id));
    return merged;
  }, [actionCompletedIds, phaseCompletedIds]);

  // Generate action list from indicators and phase tasks
  const actionList = useMemo(() => {
    return generateActionList(indicators, allCompletedIds, phaseNum);
  }, [indicators, allCompletedIds, phaseNum]);

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
            {/* ──── 1. THREAT BANNER (when action protocol active) ──── */}
            <ErrorBoundary isolate>
              <ThreatBanner />
            </ErrorBoundary>

            {/* ──── 2. ACTION PLAN PREVIEW ──── */}
            <ErrorBoundary isolate>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <ActionPlanPreview />
              </motion.div>
            </ErrorBoundary>

            {/* ──── 3. INTELLIGENCE BRIEFING (Why these actions) ──── */}
            <ErrorBoundary isolate>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="pt-2"
              >
                <BriefingCard
                  briefing={briefing}
                  isLoading={briefingLoading}
                  onRefresh={refreshBriefing}
                />
              </motion.div>
            </ErrorBoundary>

            {/* ──── 4. ALSO MONITORING (Compact Rows) ──── */}
            {cards.compactRows && cards.compactRows.length > 0 && (
              <ErrorBoundary isolate>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xs font-medium text-olive-tertiary uppercase tracking-wider mb-2">
                    Also monitoring
                  </h3>
                  <div className="glass-card divide-y divide-white/5">
                    {cards.compactRows.map((row, index) => (
                      <CompactRow key={row.id} data={row} index={index} />
                    ))}
                  </div>
                </motion.div>
              </ErrorBoundary>
            )}

            {/* ──── 6. LEGACY AI INSIGHTS (Collapsible) ──── */}
            {aiAnalysis && aiAnalysis.insights.length > 0 && (
              <ErrorBoundary isolate>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
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
