import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight,
  Info,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../core/Card';
import { Badge, StatusBadge } from '../core/Badge';
import { cn } from '../../utils/cn';
import { IndicatorData } from '../../types';
import { IndicatorChart } from '../charts/IndicatorChart';
import { formatDistanceToNow } from 'date-fns';
import { getIndicatorDescription } from '../../data/indicatorDescriptions';

interface CriticalIndicatorsProps {
  indicators: IndicatorData[];
  onIndicatorClick?: (indicator: IndicatorData) => void;
}

export const CriticalIndicators: React.FC<CriticalIndicatorsProps> = ({
  indicators,
  onIndicatorClick
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Get critical indicators sorted by priority
  const getCriticalIndicators = () => {
    // First get all red indicators
    const redIndicators = indicators.filter(i => i.status.level === 'red');
    const criticalReds = redIndicators.filter(i => i.critical);
    const normalReds = redIndicators.filter(i => !i.critical);
    
    // Then get amber indicators
    const amberIndicators = indicators.filter(i => i.status.level === 'amber');
    
    // Combine in priority order
    return [
      ...criticalReds,
      ...normalReds,
      ...amberIndicators.slice(0, 5 - redIndicators.length)
    ].slice(0, 5);
  };

  const criticalIndicators = getCriticalIndicators();

  if (criticalIndicators.length === 0) {
    return null;
  }

  const getImpactSummary = (indicator: IndicatorData): string => {
    const descriptions: Record<string, string> = {
      treasury_tail: 'Bank lending may tighten, mortgage rates rise',
      ice_detention: 'Community enforcement activity increasing',
      taiwan_zone: 'Electronics shortage likely within weeks',
      hormuz_war_risk: 'Gas prices could double within 72 hours',
      vix_volatility: 'Stock market crash risk elevated',
      unemployment_rate: 'Job losses accelerating in your area',
      global_conflict_index: 'Multiple conflicts could affect supply chains',
      mbridge_settlement: 'Dollar losing reserve status faster'
    };
    
    return descriptions[indicator.id] || 'Monitoring for changes';
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable', greenFlag?: boolean) => {
    if (!trend || trend === 'stable') return null;
    
    const Icon = trend === 'up' ? TrendingUp : TrendingDown;
    const isGood = greenFlag ? trend === 'up' : trend === 'down';
    
    return (
      <Icon className={cn(
        "w-4 h-4",
        isGood ? "text-green-400" : "text-red-400"
      )} />
    );
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>Critical Indicators</span>
            <Badge variant="red" size="sm">
              {criticalIndicators.filter(i => i.status.level === 'red').length} RED
            </Badge>
          </div>
          <button
            onClick={() => onIndicatorClick?.(criticalIndicators[0])}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence>
            {criticalIndicators.map((indicator, index) => {
              const isExpanded = expandedId === indicator.id;
              const description = getIndicatorDescription(indicator.id);
              
              return (
                <motion.div
                  key={indicator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "border rounded-lg transition-all cursor-pointer",
                    indicator.status.level === 'red' && indicator.critical 
                      ? "border-red-500/50 bg-red-500/5" 
                      : "border-[#1A1A1A] hover:border-[#2A2A2A]"
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : indicator.id)}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-display font-medium text-white">{indicator.name}</h4>
                          <StatusBadge 
                            level={indicator.status.level} 
                            size="sm"
                            pulse={indicator.status.level === 'red' && indicator.critical}
                          />
                          {indicator.critical && (
                            <Badge variant="red" size="sm">CRITICAL</Badge>
                          )}
                        </div>
                        <p className="text-sm font-body text-gray-400">
                          {getImpactSummary(indicator)}
                        </p>
                      </div>
                      
                      {/* Value and Trend */}
                      <div className="text-left sm:text-right sm:ml-4">
                        <div className="flex items-center gap-2 sm:justify-end">
                          <span className="text-xl font-bold text-white">
                            {typeof indicator.status.value === 'number' 
                              ? indicator.status.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                              : indicator.status.value}
                          </span>
                          <span className="text-sm text-gray-400">{indicator.unit}</span>
                          {getTrendIcon(indicator.status.trend, indicator.greenFlag)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Updated {formatDistanceToNow(new Date(indicator.status.lastUpdate), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="h-12 -mx-4 px-4">
                      <IndicatorChart 
                        indicator={indicator}
                        timeRange="24h"
                        height={48}
                      />
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && description && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-[#1A1A1A] space-y-3">
                            {/* Why It Matters */}
                            <div>
                              <h5 className="text-sm font-medium text-white mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                Why This Matters Now
                              </h5>
                              <p className="text-sm text-gray-300">
                                {description.whyItMatters}
                              </p>
                            </div>

                            {/* Current Threshold */}
                            <div className="bg-[#0A0A0A] rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Current Status</div>
                              <p className="text-sm text-gray-300">
                                {indicator.status.level === 'red' && description.thresholds.red}
                                {indicator.status.level === 'amber' && description.thresholds.amber}
                                {indicator.status.level === 'green' && description.thresholds.green}
                              </p>
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onIndicatorClick?.(indicator);
                              }}
                              className="w-full py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-lg text-sm text-white transition-colors flex items-center justify-center gap-2"
                            >
                              <Info className="w-4 h-4" />
                              View Details & Actions
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-gray-400">
                {indicators.filter(i => i.status.level === 'red').length} Critical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-gray-400">
                {indicators.filter(i => i.status.level === 'amber').length} Elevated
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-400">
                {indicators.filter(i => i.status.level === 'green').length} Normal
              </span>
            </div>
          </div>
          <Activity className="w-4 h-4 text-gray-500" />
        </div>
      </CardContent>
    </Card>
  );
};