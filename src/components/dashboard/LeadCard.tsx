import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Clock, ChevronDown, ChevronUp, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';
import { getDisplayName, getImpact, getAction, INDICATOR_TRANSLATIONS } from '../../data/indicatorTranslations';
import { SOURCE_URLS } from '../sidebar/SignalsList';

export interface ActionItem {
  id: string;
  text: string;
  estimateMinutes?: number;
  completed?: boolean;
}

export interface LeadCardData {
  id: string;
  category: string; // e.g., "OIL SECURITY SLIPPING", "INFRASTRUCTURE UNDER SUSTAINED ATTACK"
  headline: string;
  body: string;
  urgency: 'today' | 'week' | 'knowing';
  indicatorIds: string[];
  severity: number;
  confidence?: 'high' | 'moderate' | 'low';
  signalCount?: number;
  actions?: ActionItem[]; // Specific actions with time estimates
  whyItMatters?: string; // Household-specific explanation
  timestamp?: string; // ISO timestamp
  action?: {
    label: string;
    href: string;
  };
}

interface LeadCardProps {
  data: LeadCardData;
  onClick?: () => void;
  isSelected?: boolean;
}

const URGENCY_CONFIG = {
  today: {
    label: 'Immediate',
    badgeLabel: 'Action needed',
    className: 'urgency-today',
    borderColor: 'border-red-500/40',
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
  },
  week: {
    label: 'This week',
    badgeLabel: 'Action needed',
    className: 'urgency-week',
    borderColor: 'border-amber-500/40',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-400',
  },
  knowing: {
    label: 'Worth knowing',
    badgeLabel: 'Monitor',
    className: 'urgency-knowing',
    borderColor: 'border-olive-hover',
    dotColor: 'bg-green-500',
    textColor: 'text-green-400',
  },
};

const CONFIDENCE_COLORS = {
  high: 'text-green-400',
  moderate: 'text-amber-400',
  low: 'text-red-400',
};

// Get URL for a signal based on indicator ID or source name
const getSignalUrl = (indicatorId: string, source: string): string => {
  if (SOURCE_URLS[indicatorId]) return SOURCE_URLS[indicatorId];
  if (SOURCE_URLS[source]) return SOURCE_URLS[source];
  return 'https://www.reuters.com/';
};

export const LeadCard: React.FC<LeadCardProps> = ({ data, onClick, isSelected }) => {
  const [expanded, setExpanded] = useState(false);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const urgencyConfig = URGENCY_CONFIG[data.urgency];
  const indicators = useStore((s) => s.indicators);

  const toggleAction = (actionId: string) => {
    setCompletedActions(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  // Resolve full indicator data from IDs
  const sourceIndicators = data.indicatorIds
    .map((id) => {
      const indicator = indicators.find((i) => i.id === id);
      if (!indicator) return null;
      const translation = INDICATOR_TRANSLATIONS[id];
      return {
        id,
        name: getDisplayName(id) || indicator.name,
        indicator,
        translation,
        impact: getImpact(id, indicator.status.level),
        action: getAction(id, indicator.status.level),
        source: translation?.sourceAbbrev || indicator.domain.replace('_', ' '),
        url: getSignalUrl(id, translation?.sourceAbbrev || ''),
      };
    })
    .filter(Boolean) as {
      id: string;
      name: string;
      indicator: any;
      translation: any;
      impact: string;
      action: string;
      source: string;
      url: string;
    }[];

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-red-400" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-green-400" />;
      default: return <Minus className="w-3 h-3 text-olive-tertiary" />;
    }
  };

  const actionCount = data.actions?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onClick={onClick}
      className={cn(
        'lead-card p-5 flex gap-4',
        data.urgency === 'today' && 'lead-card-red',
        data.urgency === 'week' && 'lead-card-amber',
        onClick && 'cursor-pointer hover:bg-white/[0.02] transition-colors',
        isSelected && 'border-l-3 border-l-amber-500 bg-white/[0.04]'
      )}
    >
      {/* Left: Status dot */}
      <div className="flex-shrink-0 pt-1">
        <div className={cn('w-3 h-3 rounded-full', urgencyConfig.dotColor)} />
      </div>

      {/* Right: Content */}
      <div className="flex-1 min-w-0">
        {/* Category + Urgency badge */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-semibold text-olive-tertiary uppercase tracking-wider">
            {data.category}
          </span>
          <span className={cn('text-xs font-medium', urgencyConfig.textColor)}>
            {urgencyConfig.badgeLabel}
          </span>
          {data.urgency !== 'knowing' && actionCount > 0 && (
            <>
              <span className="text-olive-muted text-xs">·</span>
              <span className="text-xs text-olive-muted">
                {actionCount} action{actionCount !== 1 ? 's' : ''} recommended
              </span>
              <span className="text-olive-muted text-xs">·</span>
              <span className="text-xs text-olive-muted">
                {urgencyConfig.label}
              </span>
            </>
          )}
        </div>

        {/* Headline */}
        <h3 className="font-display text-display-lead text-olive-primary mb-2">
          {data.headline}
        </h3>

        {/* Body - truncated in collapsed state */}
        <p className={cn(
          'text-body-card text-olive-secondary leading-relaxed mb-4',
          !expanded && 'line-clamp-2'
        )}>
          {data.body}
        </p>

        {/* Footer: Action + Expand toggle */}
        <div className="flex items-center justify-between">
          {data.action && (
            <Link
              to={data.action.href}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'inline-flex items-center gap-2 text-sm font-medium',
                data.urgency === 'today' && 'text-red-400 hover:text-red-300',
                data.urgency === 'week' && 'text-amber-400 hover:text-amber-300',
                data.urgency === 'knowing' && 'text-olive-secondary hover:text-olive-primary',
                'transition-colors'
              )}
            >
              {data.action.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {sourceIndicators.length > 0 && (
            <button
              onClick={handleExpand}
              className="inline-flex items-center gap-1 text-xs text-olive-tertiary hover:text-olive-secondary transition-colors ml-auto"
            >
              {expanded ? 'Hide details' : 'Show details'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

      {/* Expandable Details Section */}
      <AnimatePresence>
        {expanded && sourceIndicators.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-5">

              {/* ═══ WHAT'S DRIVING THIS ═══ */}
              <div>
                <h4 className="text-xs font-semibold text-olive-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  What's Driving This
                </h4>
                <div className="space-y-3">
                  {sourceIndicators.map((ind) => (
                    <div
                      key={ind.id}
                      className="rounded-xl bg-white/[0.03] border border-white/[0.04] overflow-hidden"
                    >
                      {/* Indicator header */}
                      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.04]">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getTrendIcon(ind.indicator.status.trend)}
                            <span className={cn(
                              'text-sm font-semibold',
                              ind.indicator.status.level === 'red' && 'text-red-300',
                              ind.indicator.status.level === 'amber' && 'text-amber-300',
                              ind.indicator.status.level === 'green' && 'text-green-300'
                            )}>
                              {ind.name}
                            </span>
                          </div>
                          <span className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide',
                            ind.indicator.status.level === 'red' && 'bg-red-500/20 text-red-400',
                            ind.indicator.status.level === 'amber' && 'bg-amber-500/20 text-amber-400',
                            ind.indicator.status.level === 'green' && 'bg-green-500/20 text-green-400'
                          )}>
                            {ind.indicator.status.level}
                          </span>
                        </div>
                        <a
                          href={ind.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-olive-tertiary hover:text-amber-400 transition-colors flex items-center gap-1"
                        >
                          {ind.source}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      {/* News headline - what's happening */}
                      {ind.translation && (
                        <div className="px-4 py-3 bg-white/[0.01]">
                          <p className="text-sm text-olive-primary font-medium leading-snug">
                            {ind.indicator.status.level === 'red'
                              ? ind.translation.redHeadline
                              : ind.translation.amberHeadline}
                          </p>
                        </div>
                      )}

                      {/* Data point */}
                      <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
                        <span className="text-xs text-olive-muted">Current reading:</span>
                        <span className="text-sm font-mono text-olive-data">
                          {ind.translation?.dataPointTemplate
                            ? ind.translation.dataPointTemplate.replace('{value}', String(ind.indicator.status.value))
                            : ind.indicator.status.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ WHY IT MATTERS ═══ */}
              <div>
                <h4 className="text-xs font-semibold text-olive-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Why It Matters
                </h4>
                {data.whyItMatters ? (
                  <div className="p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-sm text-olive-secondary leading-relaxed">
                      {data.whyItMatters}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sourceIndicators.map((ind) => (
                      <div key={ind.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                          ind.indicator.status.level === 'red' && 'bg-red-500/15',
                          ind.indicator.status.level === 'amber' && 'bg-amber-500/15'
                        )}>
                          <span className={cn(
                            'text-xs font-bold',
                            ind.indicator.status.level === 'red' && 'text-red-400',
                            ind.indicator.status.level === 'amber' && 'text-amber-400'
                          )}>
                            !
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-olive-secondary leading-relaxed">
                            <span className="font-medium text-olive-primary">{ind.name}:</span>{' '}
                            {ind.impact}
                          </p>
                          {ind.translation && (
                            <p className="text-xs text-olive-muted mt-1.5 italic">
                              This means {ind.indicator.status.level === 'red'
                                ? ind.translation.redOutcomePhrase
                                : ind.translation.amberOutcomePhrase} for your household.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ═══ WHAT TO DO ═══ */}
              {(data.actions && data.actions.length > 0) ? (
                <div>
                  <h4 className="text-xs font-semibold text-olive-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    What To Do
                  </h4>
                  <div className="space-y-2">
                    {data.actions.map((action) => {
                      const isCompleted = completedActions.has(action.id);
                      return (
                        <div
                          key={action.id}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border transition-all',
                            isCompleted
                              ? 'bg-green-500/[0.08] border-green-500/20 opacity-70'
                              : 'bg-green-500/[0.03] border-green-500/10 hover:bg-green-500/[0.05]'
                          )}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAction(action.id);
                            }}
                            className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                              isCompleted
                                ? 'bg-green-500 border-green-500'
                                : 'border-green-500/30 hover:border-green-500/50'
                            )}
                          >
                            {isCompleted && (
                              <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1">
                            <p className={cn(
                              'text-sm leading-relaxed',
                              isCompleted ? 'text-olive-tertiary line-through' : 'text-olive-primary'
                            )}>
                              {action.text}
                            </p>
                            {action.estimateMinutes && (
                              <p className="text-[10px] text-olive-muted mt-1">
                                ~{action.estimateMinutes} min
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : sourceIndicators.some(ind => ind.action) && (
                <div>
                  <h4 className="text-xs font-semibold text-olive-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    What To Do
                  </h4>
                  <div className="space-y-2">
                    {sourceIndicators
                      .filter(ind => ind.action)
                      .map((ind, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-green-500/[0.03] border border-green-500/10"
                        >
                          <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-green-400">{idx + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm text-olive-primary leading-relaxed">
                              {ind.action}
                            </p>
                            <p className="text-[10px] text-olive-muted mt-1">
                              Based on {ind.name}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ═══ SOURCE + TIMESTAMP ═══ */}
              <div className="pt-3 border-t border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-olive-muted uppercase tracking-wider">
                    Verify with sources
                  </span>
                  {data.timestamp && (
                    <span className="text-[10px] text-olive-muted">
                      Updated {new Date(data.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sourceIndicators.map((ind) => (
                    <a
                      key={ind.id}
                      href={ind.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-olive-secondary hover:bg-white/[0.08] hover:text-amber-400 transition-colors border border-white/[0.04]"
                    >
                      {ind.translation?.source || ind.source}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Default/placeholder lead card when no synthesis data
export const LeadCardPlaceholder: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="lead-card p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-20 h-5 skeleton" />
      </div>
      <div className="w-3/4 h-6 skeleton mb-2" />
      <div className="w-full h-4 skeleton mb-1" />
      <div className="w-2/3 h-4 skeleton" />
    </motion.div>
  );
};
