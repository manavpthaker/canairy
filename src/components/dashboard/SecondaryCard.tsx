import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ChevronDown, ChevronUp, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

export interface SecondaryCardData {
  id: string;
  category: string; // e.g., "LABOR DISRUPTIONS", "FINANCIAL DISTRESS"
  headline: string;
  body: string;
  urgency: 'today' | 'week' | 'knowing';
  indicatorIds: string[];
  actions?: ActionItem[];
  whyItMatters?: string;
  timestamp?: string;
  action?: {
    label: string;
    href: string;
  };
}

interface SecondaryCardProps {
  data: SecondaryCardData;
  index?: number;
}

const URGENCY_CONFIG = {
  today: {
    label: 'Immediate',
    badgeLabel: 'Action needed',
    className: 'urgency-today',
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
  },
  week: {
    label: 'This week',
    badgeLabel: 'Action needed',
    className: 'urgency-week',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-400',
  },
  knowing: {
    label: 'Worth knowing',
    badgeLabel: 'Monitor',
    className: 'urgency-knowing',
    dotColor: 'bg-green-500',
    textColor: 'text-green-400',
  },
};

// Get URL for indicator
const getSignalUrl = (indicatorId: string, source: string): string => {
  if (SOURCE_URLS[indicatorId]) return SOURCE_URLS[indicatorId];
  if (SOURCE_URLS[source]) return SOURCE_URLS[source];
  return 'https://www.reuters.com/';
};

export const SecondaryCard: React.FC<SecondaryCardProps> = ({ data, index = 0 }) => {
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.05 }}
      className="secondary-card p-4 flex gap-3"
    >
      {/* Left: Status dot */}
      <div className="flex-shrink-0 pt-1">
        <div className={cn('w-2.5 h-2.5 rounded-full', urgencyConfig.dotColor)} />
      </div>

      {/* Right: Content */}
      <div className="flex-1 min-w-0">
        {/* Category + Urgency badge */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-semibold text-olive-tertiary uppercase tracking-wider">
            {data.category}
          </span>
          <span className={cn('text-[10px] font-medium', urgencyConfig.textColor)}>
            {urgencyConfig.badgeLabel}
          </span>
        </div>

        {/* Headline */}
        <h4 className="font-display text-display-secondary text-olive-primary mb-1.5">
          {data.headline}
        </h4>

        {/* Body - shorter than lead card, truncated */}
        <p className={cn(
          "text-body-small text-olive-secondary leading-relaxed mb-3",
          !expanded && "line-clamp-2"
        )}>
          {data.body}
        </p>

        {/* Footer: Action + Expand */}
        <div className="flex items-center justify-between">
          {data.action && (
            <Link
              to={data.action.href}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-olive-tertiary hover:text-olive-primary transition-colors"
            >
              {data.action.label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          {sourceIndicators.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-[10px] text-olive-muted hover:text-olive-secondary transition-colors ml-auto"
            >
              {expanded ? 'Less' : 'More'}
              {expanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          )}
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {expanded && sourceIndicators.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-3">

                {/* ═══ WHY IT MATTERS ═══ */}
                <div>
                  <h5 className="text-[10px] font-semibold text-olive-primary uppercase tracking-wider mb-2">
                    Why it matters
                  </h5>
                  {data.whyItMatters ? (
                    <div className="p-2.5 rounded-lg bg-white/[0.02]">
                      <p className="text-xs text-olive-secondary leading-relaxed">
                        {data.whyItMatters}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sourceIndicators.map((ind) => ind.impact && (
                        <div key={ind.id} className="p-2.5 rounded-lg bg-white/[0.02]">
                          <p className="text-xs text-olive-secondary leading-relaxed">
                            <span className="font-medium text-olive-primary">{ind.name}:</span>{' '}
                            {ind.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ═══ WHAT TO DO ═══ */}
                {(data.actions && data.actions.length > 0) ? (
                  <div>
                    <h5 className="text-[10px] font-semibold text-olive-primary uppercase tracking-wider mb-2">
                      What to do
                    </h5>
                    <div className="space-y-1.5">
                      {data.actions.map((action) => {
                        const isCompleted = completedActions.has(action.id);
                        return (
                          <div
                            key={action.id}
                            className={cn(
                              'flex items-start gap-2 p-2.5 rounded-lg border transition-all text-xs',
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
                                'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                                isCompleted
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-green-500/30 hover:border-green-500/50'
                              )}
                            >
                              {isCompleted && (
                                <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <div className="flex-1">
                              <p className={cn(
                                'text-xs leading-relaxed',
                                isCompleted ? 'text-olive-tertiary line-through' : 'text-olive-primary'
                              )}>
                                {action.text}
                              </p>
                              {action.estimateMinutes && (
                                <p className="text-[9px] text-olive-muted mt-0.5">
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
                    <h5 className="text-[10px] font-semibold text-olive-primary uppercase tracking-wider mb-2">
                      What to do
                    </h5>
                    <div className="space-y-1.5">
                      {sourceIndicators.filter(ind => ind.action).map((ind) => (
                        <div key={ind.id} className="p-2.5 rounded-lg bg-green-500/[0.03] border border-green-500/10">
                          <p className="text-xs text-olive-secondary leading-relaxed">
                            {ind.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ RELATED INDICATORS ═══ */}
                <div>
                  <h5 className="text-[10px] font-semibold text-olive-primary uppercase tracking-wider mb-2">
                    Related indicators
                  </h5>
                  <div className="space-y-2">
                    {sourceIndicators.map((ind) => (
                      <a
                        key={ind.id}
                        href={ind.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {getTrendIcon(ind.indicator.status.trend)}
                          <span className="text-xs font-medium text-olive-primary">
                            {ind.name}
                          </span>
                          <span className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold',
                            ind.indicator.status.level === 'red' && 'bg-red-500/20 text-red-400',
                            ind.indicator.status.level === 'amber' && 'bg-amber-500/20 text-amber-400',
                            ind.indicator.status.level === 'green' && 'bg-green-500/20 text-green-400'
                          )}>
                            {ind.indicator.status.level}
                          </span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-olive-tertiary" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* ═══ SOURCE + TIMESTAMP ═══ */}
                <div className="pt-2 border-t border-white/[0.04]">
                  {data.timestamp && (
                    <p className="text-[9px] text-olive-muted text-right">
                      Updated {new Date(data.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Compact row for lower-priority patterns
export interface CompactRowData {
  id: string;
  text: string;
  domain: string;
  href?: string;
}

interface CompactRowProps {
  data: CompactRowData;
  index?: number;
}

export const CompactRow: React.FC<CompactRowProps> = ({ data, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.03 }}
      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-olive-tertiary flex-shrink-0" />
      <span className="text-sm text-olive-secondary flex-1">{data.text}</span>
      <span className="text-xs text-olive-muted capitalize">{data.domain.replace('_', ' ')}</span>
    </motion.div>
  );
};

// Grid container for secondary cards
interface SecondaryCardsGridProps {
  cards: SecondaryCardData[];
}

export const SecondaryCardsGrid: React.FC<SecondaryCardsGridProps> = ({ cards }) => {
  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {cards.map((card, index) => (
        <SecondaryCard key={card.id} data={card} index={index} />
      ))}
    </div>
  );
};
