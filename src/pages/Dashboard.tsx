import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { IndicatorData } from '../types';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { EnhancedExecutiveSummary } from '../components/dashboard/EnhancedExecutiveSummary';
import { ActionablePriorityActions } from '../components/dashboard/ActionablePriorityActions';
import { CriticalIndicators } from '../components/dashboard/CriticalIndicators';
import { RiskNarrativePanel } from '../components/dashboard/RiskNarrativePanel';
import { TightenUpBanner } from '../components/dashboard/TightenUpBanner';
import { PhaseDetailPanel } from '../components/dashboard/PhaseDetailPanel';
import { DomainBreakdown } from '../components/dashboard/DomainBreakdown';
import { NewsTicker } from '../components/news/NewsTicker';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);

  const {
    indicators,
    loading,
    refreshAll
  } = useStore();

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Loading state */}
        {loading && indicators.length === 0 && (
          <div className="space-y-6 animate-pulse">
            <div className="h-16 bg-[#111111] rounded-2xl border border-[#1A1A1A]" />
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
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No indicators loaded</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Unable to fetch indicator data. Check that the backend is running on port 5555.
            </p>
            <button
              onClick={refreshAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* News Ticker */}
        <ErrorBoundary isolate>
          <div className="mb-6">
            <NewsTicker maxItems={5} />
          </div>
        </ErrorBoundary>

        {/* Tighten-Up Banner */}
        <ErrorBoundary isolate>
          <TightenUpBanner />
        </ErrorBoundary>

        {/* Enhanced Executive Summary */}
        <ErrorBoundary isolate>
          <EnhancedExecutiveSummary />
        </ErrorBoundary>

        {/* Domain Threat Breakdown */}
        <ErrorBoundary isolate>
          <DomainBreakdown />
        </ErrorBoundary>

        {/* Phase Detail */}
        <ErrorBoundary isolate>
          <PhaseDetailPanel />
        </ErrorBoundary>

        {/* Critical Indicators */}
        <ErrorBoundary isolate>
          <CriticalIndicators
            indicators={indicators}
            onIndicatorClick={(indicator) => setSelectedIndicator(indicator)}
          />
        </ErrorBoundary>

        {/* Risk Narrative Panel */}
        <ErrorBoundary isolate>
          <RiskNarrativePanel />
        </ErrorBoundary>

        {/* Actionable Priority Actions */}
        <ErrorBoundary isolate>
          <div className="mb-12">
            <ActionablePriorityActions />
          </div>
        </ErrorBoundary>

        {/* Quick Link to Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-16 border-t border-[#1A1A1A]"
        >
          <h3 className="text-2xl font-semibold text-white mb-3">
            Need more details?
          </h3>
          <p className="text-gray-400 mb-8 text-lg">
            View all {indicators.length} indicators with advanced filtering and search
          </p>
          <button
            onClick={() => navigate('/indicators')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] rounded-xl hover:bg-gray-100 transition-colors font-medium"
          >
            <Activity className="w-5 h-5" />
            View All Indicators
          </button>
        </motion.div>
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
