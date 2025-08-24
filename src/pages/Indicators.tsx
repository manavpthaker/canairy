import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  X
} from 'lucide-react';
import { useStore } from '../store';
import { IndicatorData } from '../types';
import { EnhancedIndicatorCard } from '../components/indicators/EnhancedIndicatorCard';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { Button } from '../components/core/Button';
import { Badge } from '../components/core/Badge';
import { cn } from '../utils/cn';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'green' | 'amber' | 'red';
type FilterDomain = 'all' | 'economy' | 'global_conflict' | 'energy' | 'ai_tech' | 'domestic_control';

export const Indicators: React.FC = () => {
  const { indicators } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [domainFilter, setDomainFilter] = useState<FilterDomain>('all');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);

  // Filter indicators based on search and filters
  const filteredIndicators = useMemo(() => {
    return indicators.filter(indicator => {
      // Search filter
      if (searchQuery && !indicator.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && indicator.status.level !== statusFilter) {
        return false;
      }
      
      // Domain filter
      if (domainFilter !== 'all' && indicator.domain !== domainFilter) {
        return false;
      }
      
      // Critical filter
      if (showCriticalOnly && !indicator.critical) {
        return false;
      }
      
      return true;
    });
  }, [indicators, searchQuery, statusFilter, domainFilter, showCriticalOnly]);

  // Count indicators by status
  const statusCounts = useMemo(() => {
    return {
      all: indicators.length,
      green: indicators.filter(i => i.status.level === 'green').length,
      amber: indicators.filter(i => i.status.level === 'amber').length,
      red: indicators.filter(i => i.status.level === 'red').length,
    };
  }, [indicators]);

  const domainLabels = {
    economy: 'Economic',
    global_conflict: 'Global Conflict',
    energy: 'Energy',
    ai_tech: 'AI/Tech',
    domestic_control: 'Social',
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#1A1A1A] sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-white">Indicators</h1>
              <p className="text-gray-400 mt-1">Monitor all resilience indicators in one place</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'grid' 
                    ? 'bg-white text-[#0A0A0A]' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'list' 
                    ? 'bg-white text-[#0A0A0A]' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search indicators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/50 placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg p-1">
              {(['all', 'green', 'amber', 'red'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    statusFilter === status
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-1.5 text-xs text-gray-500">
                    ({statusCounts[status]})
                  </span>
                </button>
              ))}
            </div>

            {/* Domain Filter */}
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value as FilterDomain)}
              className="px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/50 text-sm"
            >
              <option value="all">All Domains</option>
              {Object.entries(domainLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Critical Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCriticalOnly}
                onChange={(e) => setShowCriticalOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-[#1A1A1A] border-[#2A2A2A] text-white focus:ring-white/20"
              />
              <span className="text-sm text-gray-400">Critical only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">
            Showing {filteredIndicators.length} of {indicators.length} indicators
          </p>
          {filteredIndicators.filter(i => i.status.level === 'red').length > 0 && (
            <Badge variant="red">
              {filteredIndicators.filter(i => i.status.level === 'red').length} Critical
            </Badge>
          )}
        </div>

        {/* Indicators Grid/List */}
        {filteredIndicators.length > 0 ? (
          <motion.div
            layout
            className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
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
            <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No indicators found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
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
    </div>
  );
};