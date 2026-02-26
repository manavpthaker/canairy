import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Info,
  AlertTriangle,
  Lightbulb,
  ExternalLink
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
  const navigate = useNavigate();
  const { status, name, domain, unit, dataSource, critical, greenFlag, description } = indicator;
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/indicator/${indicator.id}`);
  };
  
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
    const currentValue = typeof status.value === 'number' ? status.value : 0; // Default to 0 if not a number

    // Use actual thresholds from the indicator data
    const amberThreshold = indicator.thresholds?.threshold_amber;
    const redThreshold = indicator.thresholds?.threshold_red;

    let currentMin = 0;
    let currentMax = 100; // Default max, might need to be dynamic based on indicator
    let nextThresholdValue: number | null = null;

    if (status.level === 'green') {
      currentMin = 0; // Assuming green starts from 0
      currentMax = amberThreshold !== undefined ? amberThreshold : 100; // Max of green is amber threshold
      nextThresholdValue = amberThreshold !== undefined ? amberThreshold : null;
    } else if (status.level === 'amber') {
      currentMin = amberThreshold !== undefined ? amberThreshold : 0;
      currentMax = redThreshold !== undefined ? redThreshold : 100; // Max of amber is red threshold
      nextThresholdValue = redThreshold !== undefined ? redThreshold : null;
    } else if (status.level === 'red') {
      currentMin = redThreshold !== undefined ? redThreshold : 0;
      currentMax = redThreshold !== undefined ? redThreshold * 1.5 : 100; // Arbitrary max for red, or actual max value
      nextThresholdValue = null; // No next threshold if already red
    } else { // unknown status
      currentMin = 0;
      currentMax = 100;
      nextThresholdValue = null;
    }

    // Ensure currentMax is greater than currentMin to avoid division by zero or negative range
    if (currentMax <= currentMin) {
      currentMax = currentMin + 1; // Prevent division by zero
    }

    const percentage = ((currentValue - currentMin) / (currentMax - currentMin)) * 100;

    return {
      percentage: Math.max(0, Math.min(100, percentage)), // Clamp between 0 and 100
      nextThreshold: nextThresholdValue
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
              {description && (
                <p className="text-xs text-bmb-secondary mt-2 line-clamp-1">
                  {description}
                </p>
              )}
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
                  {status.trend === 'up' ? '↑' : '↓'}
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
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs text-bmb-secondary font-medium">History</span>
              <div className="flex bg-bmb-dark/50 rounded-lg p-0.5">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeRange(range);
                    }}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-all',
                      timeRange === range
                        ? 'bg-white text-bmb-dark shadow-sm'
                        : 'text-bmb-secondary hover:text-white'
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
            <button
              onClick={handleViewDetails}
              className="flex items-center gap-1 text-bmb-accent hover:text-white transition-colors"
            >
              <span>View details</span>
              <ExternalLink className="w-3 h-3" />
            </button>
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