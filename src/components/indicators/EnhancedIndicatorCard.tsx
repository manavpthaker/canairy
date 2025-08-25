import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  Activity, 
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
      
      // Domain-specific insights
      switch (domain) {
        case 'economy':
          insights.push({
            type: 'action',
            message: 'Consider reviewing financial positions and increasing cash reserves'
          });
          break;
        case 'energy':
          insights.push({
            type: 'action',
            message: 'Verify backup power systems and fuel reserves'
          });
          break;
        case 'global_conflict':
          insights.push({
            type: 'info',
            message: 'Monitor geopolitical developments closely'
          });
          break;
        case 'ai_tech':
          insights.push({
            type: 'info',
            message: 'Technology disruption risk elevated'
          });
          break;
      }
    } else if (status.level === 'amber') {
      insights.push({
        type: 'info',
        message: 'Approaching threshold - enhanced monitoring recommended'
      });
    }
    
    // Trend-based insights
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
    
    return insights.slice(0, 2); // Limit to 2 insights
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
    if (!status.trend) return 'text-bmb-secondary';
    if (greenFlag) {
      return status.trend === 'up' ? 'text-bmb-success' : 'text-bmb-danger';
    }
    return status.trend === 'up' ? 'text-bmb-danger' : 'text-bmb-success';
  };

  const getThresholdInfo = () => {
    // Mock threshold data - in real app would come from indicator
    const thresholds = {
      green: { min: 0, max: 40 },
      amber: { min: 40, max: 60 },
      red: { min: 60, max: 100 }
    };
    
    const currentValue = typeof status.value === 'number' ? status.value : 50;
    const threshold = thresholds[status.level as keyof typeof thresholds];
    
    return {
      percentage: ((currentValue - threshold.min) / (threshold.max - threshold.min)) * 100,
      nextThreshold: status.level === 'green' ? 40 : status.level === 'amber' ? 60 : null
    };
  };

  const thresholdInfo = getThresholdInfo();

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
          status.level === 'red' && critical && 'border-bmb-danger/50'
        )}
      >
        {/* Status bar */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-0.5',
            status.level === 'green' && 'bg-bmb-success',
            status.level === 'amber' && 'bg-bmb-warning',
            status.level === 'red' && 'bg-bmb-danger',
            status.level === 'unknown' && 'bg-bmb-secondary'
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
                <span className="text-2xs text-bmb-secondary">
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
                <span className="data-value">
                  {typeof status.value === 'number' 
                    ? status.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : status.value}
                </span>
                <span className="data-label">{unit}</span>
              </div>
              {/* Threshold proximity indicator */}
              {thresholdInfo.nextThreshold && (
                <div className="mt-1 text-xs text-bmb-secondary">
                  {Math.abs(thresholdInfo.nextThreshold - (typeof status.value === 'number' ? status.value : 0)).toFixed(1)} from {status.level === 'green' ? 'amber' : 'red'} threshold
                </div>
              )}
            </div>
            {status.trend && (
              <div className={cn('flex items-center gap-1', getTrendColor())}>
                {getTrendIcon()}
                <span className="text-xs font-medium">
                  {status.trend === 'up' ? '+' : '-'}
                  {Math.abs(Math.random() * 10).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Threshold bar */}
          <div className="relative h-1.5 bg-bmb-dark rounded-full overflow-hidden mb-3">
            <motion.div
              className={cn(
                'absolute left-0 top-0 h-full rounded-full',
                status.level === 'green' && 'bg-bmb-success',
                status.level === 'amber' && 'bg-bmb-warning',
                status.level === 'red' && 'bg-bmb-danger'
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
                <BarChart3 className="w-3 h-3 text-bmb-secondary" />
                <span className="text-xs text-bmb-secondary">Trend</span>
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
                      'px-2 py-0.5 text-xs rounded transition-colors',
                      timeRange === range 
                        ? 'bg-bmb-accent text-white' 
                        : 'text-bmb-secondary hover:text-white hover:bg-bmb-dark'
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
            <div className="space-y-2 mb-3 p-3 bg-bmb-black/30 rounded-md">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {insight.type === 'warning' && <AlertTriangle className="w-3 h-3 text-bmb-warning flex-shrink-0 mt-0.5" />}
                  {insight.type === 'info' && <Info className="w-3 h-3 text-bmb-accent flex-shrink-0 mt-0.5" />}
                  {insight.type === 'action' && <Lightbulb className="w-3 h-3 text-bmb-success flex-shrink-0 mt-0.5" />}
                  <span className="text-bmb-secondary">{insight.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-2xs text-bmb-secondary">
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
            <div className="absolute inset-0 bg-bmb-danger/5 animate-pulse" />
          </div>
        )}
      </Card>
    </motion.div>
  );
};