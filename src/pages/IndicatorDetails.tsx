import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CanairyMascot } from '../components/canairy/CanairyMascot';
import { useStore } from '../store';
import { IndicatorChart } from '../components/charts/IndicatorChart';
import { StatusBadge } from '../components/core/Badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/cn';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  Info,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export const IndicatorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { indicators, fetchIndicators } = useStore();
  const indicator = indicators.find(ind => ind.id === id);

  useEffect(() => {
    if (!indicator) {
      fetchIndicators(); // Fetch all indicators if this one isn't in store
    }
  }, [id, indicator, fetchIndicators]);

  if (!indicator) {
    return (
      <div className="min-h-screen bg-canairy-neutral p-6 flex items-center justify-center">
        <div className="text-center">
          <CanairyMascot size="md" mood="confused" />
          <h1 className="text-2xl font-bold text-canairy-charcoal mt-4">Indicator Not Found</h1>
          <p className="text-canairy-charcoal-light">Loading or invalid indicator ID: {id}</p>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (!indicator.status.trend) return <Minus className="w-4 h-4" />;
    return indicator.status.trend === 'up' ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getTrendColor = () => {
    if (!indicator.status.trend) return 'text-canairy-charcoal-light';
    if (indicator.greenFlag) {
      return indicator.status.trend === 'up' ? 'text-canairy-success' : 'text-canairy-danger';
    }
    return indicator.status.trend === 'up' ? 'text-canairy-danger' : 'text-canairy-success';
  };

  const generateInsights = () => {
    const insights = [];
    if (indicator.status.level === 'red') {
      insights.push({ type: 'warning', message: 'Critical threshold exceeded - immediate attention required.' });
    }
    if (indicator.status.level === 'amber') {
      insights.push({ type: 'info', message: 'Approaching threshold - enhanced monitoring recommended.' });
    }
    if (indicator.status.trend === 'up' && !indicator.greenFlag) {
      insights.push({ type: 'warning', message: 'Deteriorating trend detected.' });
    }
    if (indicator.status.trend === 'down' && indicator.greenFlag) {
      insights.push({ type: 'warning', message: 'Negative trend in positive indicator.' });
    }
    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="min-h-screen bg-canairy-neutral p-6">
      <div className="max-w-4xl mx-auto">
        <div className="card-canairy mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CanairyMascot size="md" mood="thinking" />
              <div>
                <h1 className="text-2xl font-bold text-canairy-charcoal">{indicator.name}</h1>
                <p className="text-canairy-charcoal-light">{indicator.description}</p>
              </div>
            </div>
            <StatusBadge level={indicator.status.level} size="lg" pulse={indicator.status.level === 'red' && indicator.critical} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card-canairy">
            <h2 className="text-xl font-semibold text-canairy-charcoal mb-4">Current Status</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-canairy-charcoal">
                {typeof indicator.status.value === 'number' ? indicator.status.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : indicator.status.value}
              </span>
              <span className="text-lg text-canairy-charcoal-light">{indicator.unit}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-canairy-charcoal-light mb-4">
              <Clock className="w-4 h-4" />
              <span>Last updated {formatDistanceToNow(new Date(indicator.status.lastUpdate), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={cn('font-medium', getTrendColor())}>
                {getTrendIcon()} {indicator.status.trend ? indicator.status.trend.toUpperCase() : 'NO TREND'}
              </span>
              <span className="text-canairy-charcoal-light">from {indicator.dataSource}</span>
            </div>
          </div>

          <div className="card-canairy">
            <h2 className="text-xl font-semibold text-canairy-charcoal mb-4">Thresholds</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-canairy-success">
                <span>Green:</span>
                <span>{indicator.thresholds?.threshold_amber !== undefined ? `< ${indicator.thresholds.threshold_amber} ${indicator.unit}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-canairy-warning">
                <span>Amber:</span>
                <span>{indicator.thresholds?.threshold_red !== undefined ? `${indicator.thresholds.threshold_amber} - < ${indicator.thresholds.threshold_red} ${indicator.unit}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-canairy-danger">
                <span>Red:</span>
                <span>{indicator.thresholds?.threshold_red !== undefined ? `> ${indicator.thresholds.threshold_red} ${indicator.unit}` : 'N/A'}</span>
              </div>
            </div>
            {indicator.critical && (
              <p className="text-sm text-canairy-danger mt-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> This is a critical indicator.
              </p>
            )}
          </div>
        </div>

        <div className="card-canairy mb-6">
          <h2 className="text-xl font-semibold text-canairy-charcoal mb-4">Historical Data</h2>
          <IndicatorChart indicator={indicator} height={200} />
        </div>

        {insights.length > 0 && (
          <div className="card-canairy">
            <h2 className="text-xl font-semibold text-canairy-charcoal mb-4">Insights</h2>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  {insight.type === 'warning' && <AlertTriangle className="w-5 h-5 text-canairy-warning flex-shrink-0" />}
                  {insight.type === 'info' && <Info className="w-5 h-5 text-canairy-accent flex-shrink-0" />}
                  {insight.type === 'action' && <Lightbulb className="w-5 h-5 text-canairy-success flex-shrink-0" />}
                  <p className="text-canairy-charcoal-light text-base">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};