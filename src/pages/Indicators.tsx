import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Search,
  LayoutGrid,
  List,
  X,
  ChevronDown,
  DollarSign,
  Briefcase,
  Scale,
  ShieldAlert,
  Fuel,
  Brain,
  Globe,
  Landmark,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../store';
import { IndicatorData, Domain, DOMAIN_META } from '../types';
import { EnhancedIndicatorCard } from '../components/indicators/EnhancedIndicatorCard';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { Badge } from '../components/core/Badge';
import { cn } from '../utils/cn';

type ViewMode = 'grid' | 'list' | 'grouped';
type FilterStatus = 'all' | 'green' | 'amber' | 'red';
type FilterDomain = 'all' | 'economy' | 'jobs_labor' | 'rights_governance' | 'security_infrastructure' | 'oil_axis' | 'ai_window' | 'global_conflict' | 'domestic_control' | 'cult';

const DOMAIN_ICONS: Record<Domain, React.ElementType> = {
  economy: DollarSign,
  jobs_labor: Briefcase,
  rights_governance: Scale,
  security_infrastructure: ShieldAlert,
  oil_axis: Fuel,
  ai_window: Brain,
  global_conflict: Globe,
  domestic_control: Landmark,
  cult: Eye,
};

export const Indicators: React.FC = () => {
  const { indicators } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [domainFilter, setDomainFilter] = useState<FilterDomain>('all');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);
  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(new Set());

  // Toggle domain collapse
  const toggleDomain = (domain: string) => {
    setCollapsedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  // Filter indicators based on search and filters
  const filteredIndicators = useMemo(() => {
    const filtered = indicators.filter(indicator => {
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
    
    return filtered;
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

  // Group filtered indicators by domain
  const groupedByDomain = useMemo(() => {
    const groups: Record<Domain, IndicatorData[]> = {
      economy: [],
      jobs_labor: [],
      rights_governance: [],
      security_infrastructure: [],
      oil_axis: [],
      ai_window: [],
      global_conflict: [],
      domestic_control: [],
      cult: [],
    };

    filteredIndicators.forEach(indicator => {
      groups[indicator.domain].push(indicator);
    });

    // Sort domains by severity (most red first)
    const sortedDomains = (Object.keys(groups) as Domain[])
      .filter(domain => groups[domain].length > 0)
      .sort((a, b) => {
        const aRed = groups[a].filter(i => i.status.level === 'red').length;
        const bRed = groups[b].filter(i => i.status.level === 'red').length;
        if (aRed !== bRed) return bRed - aRed;
        const aAmber = groups[a].filter(i => i.status.level === 'amber').length;
        const bAmber = groups[b].filter(i => i.status.level === 'amber').length;
        return bAmber - aAmber;
      });

    return { groups, sortedDomains };
  }, [filteredIndicators]);

  // Get domain status summary
  const getDomainSummary = (indicators: IndicatorData[]) => {
    const red = indicators.filter(i => i.status.level === 'red').length;
    const amber = indicators.filter(i => i.status.level === 'amber').length;
    const green = indicators.filter(i => i.status.level === 'green').length;
    return { red, amber, green, total: indicators.length };
  };

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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#1A1A1A] sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-white">Indicators</h1>
              <p className="text-gray-400 mt-1">Monitor all resilience indicators in one place</p>
            </div>
            <div className="flex items-center gap-1 bg-[#1A1A1A] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grouped')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  viewMode === 'grouped'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                Grouped
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === 'grid'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-gray-400 hover:text-white'
                )}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === 'list'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-gray-400 hover:text-white'
                )}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative w-full sm:flex-1 sm:max-w-md">
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
            <div className="flex items-center gap-1 sm:gap-2 bg-[#1A1A1A] rounded-lg p-1 overflow-x-auto">
              {(['all', 'green', 'amber', 'red'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
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
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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

        {/* Indicators View */}
        {filteredIndicators.length > 0 ? (
          viewMode === 'grouped' ? (
            /* Grouped by Domain View */
            <div className="space-y-6">
              {groupedByDomain.sortedDomains.map((domain) => {
                const domainIndicators = groupedByDomain.groups[domain];
                const summary = getDomainSummary(domainIndicators);
                const isCollapsed = collapsedDomains.has(domain);
                const DomainIcon = DOMAIN_ICONS[domain];
                const domainMeta = DOMAIN_META[domain];

                return (
                  <motion.div
                    key={domain}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111111] border border-[#1A1A1A] rounded-xl overflow-hidden"
                  >
                    {/* Domain Header */}
                    <button
                      onClick={() => toggleDomain(domain)}
                      className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-[#1A1A1A]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          summary.red > 0 ? "bg-red-500/10 text-red-400" :
                          summary.amber > 0 ? "bg-amber-500/10 text-amber-400" :
                          "bg-green-500/10 text-green-400"
                        )}>
                          <DomainIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-white">{domainMeta.label}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            {summary.red > 0 && (
                              <span className="text-red-400">{summary.red} red</span>
                            )}
                            {summary.amber > 0 && (
                              <span className="text-amber-400">{summary.amber} amber</span>
                            )}
                            {summary.green > 0 && (
                              <span className="text-green-400">{summary.green} green</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{summary.total} indicators</span>
                        <ChevronDown className={cn(
                          "w-5 h-5 text-gray-400 transition-transform",
                          isCollapsed && "-rotate-90"
                        )} />
                      </div>
                    </button>

                    {/* Domain Indicators */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-6 pb-4 space-y-2">
                            {domainIndicators.map((indicator) => (
                              <div
                                key={indicator.id}
                                onClick={() => setSelectedIndicator(indicator)}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                                  "hover:bg-[#1A1A1A] border border-transparent",
                                  indicator.status.level === 'red' && indicator.critical && "border-red-500/30 bg-red-500/5"
                                )}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full flex-shrink-0",
                                    indicator.status.level === 'red' && "bg-red-500",
                                    indicator.status.level === 'amber' && "bg-amber-500",
                                    indicator.status.level === 'green' && "bg-green-500"
                                  )} />
                                  <span className="text-white truncate">{indicator.name}</span>
                                  {indicator.critical && (
                                    <Badge variant="red" size="sm">CRITICAL</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                  <span className="text-gray-400 font-mono text-sm">
                                    {typeof indicator.status.value === 'number'
                                      ? indicator.status.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                                      : indicator.status.value}
                                    <span className="text-gray-500 ml-1 text-xs">{indicator.unit}</span>
                                  </span>
                                  {indicator.sourceUrl && (
                                    <a
                                      href={indicator.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-gray-500 hover:text-white transition-colors"
                                      title="View source"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Grid/List View */
            <motion.div
              layout
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
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
          )
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