import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Info,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../core/Card';
import { Badge, StatusBadge } from '../core/Badge';
import { cn } from '../../utils/cn';
import { IndicatorData } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { IndicatorChart } from '../charts/IndicatorChart';
import { generateHistoricalData } from '../../utils/historicalDataGenerator';

interface IndicatorCardProps {
  indicator: IndicatorData;
  onClick?: () => void;
  showInsights?: boolean;
}

interface IndicatorInsight {
  type: 'warning' | 'info' | 'action';
  message: string;
}

export const EnhancedIndicatorCard: React.FC<IndicatorCardProps> = ({
  indicator,
  onClick,
  showInsights = true,
}) => {
  const { status, name, domain, unit, dataSource, critical, greenFlag } = indicator;
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');

  // Generate historical data if not provided
  useEffect(() => {
    if (!indicator.history) {
      indicator.history = generateHistoricalData(indicator, timeRange);
    }
  }, [indicator, timeRange]);

  // Generate contextual insights based on indicator state
  const generateInsights = (): IndicatorInsight[] => {
    const insights: IndicatorInsight[] = [];

    if (status.level === 'red') {
      if (critical) {
        insights.push({
          type: 'warning',
          message: 'Critical threshold exceeded - immediate attention required'
        });
      }

      switch (domain) {
        case 'economy':
          insights.push({ type: 'action', message: 'Review financial positions and increase cash reserves' });
          break;
        case 'jobs_labor':
          insights.push({ type: 'action', message: 'Supply chain disruptions possible from labor unrest' });
          break;
        case 'rights_governance':
          insights.push({ type: 'info', message: 'Review digital privacy and civil liberties posture' });
          break;
        case 'security_infrastructure':
          insights.push({ type: 'action', message: 'Verify backup power and cyber hygiene' });
          break;
        case 'oil_axis':
          insights.push({ type: 'action', message: 'Top off fuel, review currency exposure' });
          break;
        case 'ai_window':
          insights.push({ type: 'info', message: 'AI-driven disruption risk elevated' });
          break;
        case 'global_conflict':
          insights.push({ type: 'info', message: 'Monitor geopolitical developments closely' });
          break;
        case 'domestic_control':
          insights.push({ type: 'action', message: 'Update family emergency plan and go-folder' });
          break;
        case 'cult':
          insights.push({ type: 'info', message: 'Monitor cultural signals for AI-worship trends' });
          break;
      }
    } else if (status.level === 'amber') {
      insights.push({
        type: 'info',
        message: 'Approaching threshold - enhanced monitoring recommended'
      });
    }

    if (status.trend === 'up' && !greenFlag) {
      insights.push({
        type: 'warning',
        message: 'Deteriorating trend detected over past 24h'
      });
    } else if (status.trend === 'down' && greenFlag) {
      insights.push({
        type: 'warning',
        message: 'Negative trend in positive indicator'
      });
    }

    return insights.slice(0, 2);
  };

  const insights = showInsights ? generateInsights() : [];

  const getTrendIcon = () => {
    if (!status.trend) return <Minus className="w-3 h-3" />;
    return status.trend === 'up' ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  };

  const getTrendColor = () => {
    if (!status.trend) return 'text-white/30';
    if (greenFlag) {
      return status.trend === 'up' ? 'text-green-400' : 'text-red-400';
    }
    return status.trend === 'up' ? 'text-red-400' : 'text-green-400';
  };

  // Compute a real trend percentage from history if available
  const getTrendPercent = (): string | null => {
    if (indicator.history && indicator.history.length >= 2) {
      const recent = indicator.history[indicator.history.length - 1].value;
      const prior = indicator.history[0].value;
      if (prior !== 0) {
        const pct = ((recent - prior) / Math.abs(prior)) * 100;
        return Math.abs(pct).toFixed(1);
      }
    }
    // Fallback: compute from threshold proximity
    if (typeof status.value === 'number' && indicator.thresholds?.threshold_amber) {
      const pct = (status.value / indicator.thresholds.threshold_amber) * 10;
      return Math.min(Math.abs(pct), 99).toFixed(1);
    }
    return null;
  };

  const getThresholdInfo = () => {
    const currentValue = typeof status.value === 'number' ? status.value : 0;
    const amberThreshold = indicator.thresholds?.threshold_amber;
    const redThreshold = indicator.thresholds?.threshold_red;

    let currentMin = 0;
    let currentMax = 100;
    let nextThresholdValue: number | null = null;

    if (status.level === 'green') {
      currentMin = 0;
      currentMax = amberThreshold !== undefined ? amberThreshold : 100;
      nextThresholdValue = amberThreshold !== undefined ? amberThreshold : null;
    } else if (status.level === 'amber') {
      currentMin = amberThreshold !== undefined ? amberThreshold : 0;
      currentMax = redThreshold !== undefined ? redThreshold : 100;
      nextThresholdValue = redThreshold !== undefined ? redThreshold : null;
    } else if (status.level === 'red') {
      currentMin = redThreshold !== undefined ? redThreshold : 0;
      currentMax = redThreshold !== undefined ? redThreshold * 1.5 : 100;
      nextThresholdValue = null;
    } else {
      currentMin = 0;
      currentMax = 100;
      nextThresholdValue = null;
    }

    if (currentMax <= currentMin) {
      currentMax = currentMin + 1;
    }

    const percentage = ((currentValue - currentMin) / (currentMax - currentMin)) * 100;

    return {
      percentage: Math.max(0, Math.min(100, percentage)),
      nextThreshold: nextThresholdValue
    };
  };

  const thresholdInfo = getThresholdInfo();
  const trendPercent = getTrendPercent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        hover
        onClick={onClick}
        className={cn(
          'relative overflow-hidden group',
          status.level === 'red' && critical && 'border-red-500/20 glow-border-red'
        )}
      >
        {/* Status bar */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-0.5',
            status.level === 'green' && 'bg-green-500',
            status.level === 'amber' && 'bg-amber-500',
            status.level === 'red' && 'bg-red-500',
            status.level === 'unknown' && 'bg-white/20'
          )}
        />

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {name}
                {critical && (
                  <Badge variant="red" size="sm">
                    CRITICAL
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" size="sm">
                  {domain.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-2xs text-white/20">
                  {dataSource}
                </span>
              </div>
            </div>
            <StatusBadge
              level={status.level}
              size="sm"
              pulse={status.level === 'red' && critical}
            />
          </div>
        </CardHeader>

        <CardContent>
          {/* Value and trend */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-semibold text-white">
                  {typeof status.value === 'number'
                    ? status.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : status.value}
                </span>
                <span className="text-xs text-white/30">{unit}</span>
              </div>
              {thresholdInfo.nextThreshold && (
                <div className="mt-1 text-xs text-white/20">
                  {Math.abs(thresholdInfo.nextThreshold - (typeof status.value === 'number' ? status.value : 0)).toFixed(1)} from {status.level === 'green' ? 'amber' : 'red'} threshold
                </div>
              )}
            </div>
            {status.trend && trendPercent && (
              <div className={cn('flex items-center gap-1', getTrendColor())}>
                {getTrendIcon()}
                <span className="text-xs font-medium">
                  {status.trend === 'up' ? '+' : '-'}
                  {trendPercent}%
                </span>
              </div>
            )}
          </div>

          {/* Threshold bar */}
          <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-3">
            <motion.div
              className={cn(
                'absolute left-0 top-0 h-full rounded-full',
                status.level === 'green' && 'bg-green-500',
                status.level === 'amber' && 'bg-amber-500',
                status.level === 'red' && 'bg-red-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(thresholdInfo.percentage, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          {/* Chart with time range selector */}
          <div className="mb-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-white/20" />
                <span className="text-xs text-white/20">Trend</span>
              </div>
              <div className="flex gap-1">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeRange(range);
                    }}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-lg transition-colors',
                      timeRange === range
                        ? 'bg-white/10 text-white'
                        : 'text-white/30 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <IndicatorChart
              indicator={indicator}
              timeRange={timeRange}
              height={80}
              className="w-full"
            />
          </div>

          {/* Insights section */}
          {insights.length > 0 && (
            <div className="space-y-2 mb-3 p-3 bg-white/[0.03] rounded-xl">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {insight.type === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />}
                  {insight.type === 'info' && <Info className="w-3 h-3 text-white/40 flex-shrink-0 mt-0.5" />}
                  {insight.type === 'action' && <Lightbulb className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />}
                  <span className="text-white/30">{insight.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-2xs text-white/20">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(status.lastUpdate), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View details</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </CardContent>

        {/* Glow effect for critical red indicators */}
        {status.level === 'red' && critical && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-red-500/5 animate-pulse rounded-2xl" />
          </div>
        )}
      </Card>
    </motion.div>
  );
};
