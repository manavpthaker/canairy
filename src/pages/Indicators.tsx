import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  Search,
  LayoutGrid,
  List,
  X
} from 'lucide-react';
import { useStore } from '../store';
import { IndicatorData } from '../types';
import { EnhancedIndicatorCard } from '../components/indicators/EnhancedIndicatorCard';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { Badge } from '../components/core/Badge';
import { cn } from '../utils/cn';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'green' | 'amber' | 'red';
type FilterDomain = 'all' | 'economy' | 'jobs_labor' | 'rights_governance' | 'security_infrastructure' | 'oil_axis' | 'ai_window' | 'global_conflict' | 'domestic_control' | 'cult';

export const Indicators: React.FC = () => {
  const { indicators } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [domainFilter, setDomainFilter] = useState<FilterDomain>('all');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);

  const filteredIndicators = useMemo(() => {
    return indicators.filter(indicator => {
      if (searchQuery && !indicator.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== 'all' && indicator.status.level !== statusFilter) return false;
      if (domainFilter !== 'all' && indicator.domain !== domainFilter) return false;
      if (showCriticalOnly && !indicator.critical) return false;
      return true;
    });
  }, [indicators, searchQuery, statusFilter, domainFilter, showCriticalOnly]);

  const statusCounts = useMemo(() => ({
    all: indicators.length,
    green: indicators.filter(i => i.status.level === 'green').length,
    amber: indicators.filter(i => i.status.level === 'amber').length,
    red: indicators.filter(i => i.status.level === 'red').length,
  }), [indicators]);

  const domainLabels: Record<string, string> = {
    economy: 'Economy',
    jobs_labor: 'Jobs & Labor',
    rights_governance: 'Rights & Gov',
    security_infrastructure: 'Security & Infra',
    oil_axis: 'Oil Axis',
    ai_window: 'AI Window',
    global_conflict: 'Global Conflict',
    domestic_control: 'Domestic Control',
    cult: 'Cult Signals',
  };

  return (
    <>
      <div className="border-b border-white/[0.04]">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white">What We Watch</h1>
              <p className="text-white/30 mt-1 text-sm">Everything Canairy monitors for your family</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'grid'
                    ? 'bg-white/10 text-white'
                    : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'list'
                    ? 'bg-white/10 text-white'
                    : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="text"
                placeholder="Search indicators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-10 pr-4"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 overflow-x-auto">
              {(['all', 'green', 'amber', 'red'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                    statusFilter === status
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/25 hover:text-white/40'
                  )}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-1 text-xs text-white/15">({statusCounts[status]})</span>
                </button>
              ))}
            </div>

            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value as FilterDomain)}
              className="input px-4 py-2 text-sm"
            >
              <option value="all">All Domains</option>
              {Object.entries(domainLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCriticalOnly}
                onChange={(e) => setShowCriticalOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-white focus:ring-white/20"
              />
              <span className="text-sm text-white/30">Critical only</span>
            </label>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-white/20">
            Showing {filteredIndicators.length} of {indicators.length}
          </p>
          {filteredIndicators.filter(i => i.status.level === 'red').length > 0 && (
            <Badge variant="red">
              {filteredIndicators.filter(i => i.status.level === 'red').length} Critical
            </Badge>
          )}
        </div>

        {filteredIndicators.length > 0 ? (
          <motion.div
            layout
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-3'
            )}
          >
            {filteredIndicators.map((indicator, index) => (
              <motion.div
                key={indicator.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <EnhancedIndicatorCard
                  indicator={indicator}
                  onClick={() => setSelectedIndicator(indicator)}
                  showInsights={true}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 glass-card flex items-center justify-center mx-auto mb-4 rounded-full">
              <Filter className="w-8 h-8 text-white/15" />
            </div>
            <h3 className="text-lg font-display font-medium text-white mb-2">No indicators found</h3>
            <p className="text-white/30">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

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
