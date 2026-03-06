import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ChevronDown, ChevronUp, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';
import { getDisplayName, getImpact, getAction, INDICATOR_TRANSLATIONS } from '../../data/indicatorTranslations';
import { SOURCE_URLS } from '../sidebar/SignalsList';

export interface SecondaryCardData {
  id: string;
  headline: string;
  body: string;
  urgency: 'today' | 'week' | 'knowing';
  indicatorIds: string[];
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
    label: 'Do this today',
    className: 'urgency-today',
  },
  week: {
    label: 'This week',
    className: 'urgency-week',
  },
  knowing: {
    label: 'Worth knowing',
    className: 'urgency-knowing',
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
  const urgencyConfig = URGENCY_CONFIG[data.urgency];
  const indicators = useStore((s) => s.indicators);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.05 }}
      className="secondary-card p-4"
    >
      {/* Urgency tag */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('urgency-pill', urgencyConfig.className)}>
          <Clock className="w-3 h-3 mr-1" />
          {urgencyConfig.label}
        </span>
      </div>

      {/* Headline */}
      <h4 className="font-display text-display-secondary text-olive-primary mb-1.5">
        {data.headline}
      </h4>

      {/* Body - shorter than lead card */}
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
              {sourceIndicators.map((ind) => (
                <div
                  key={ind.id}
                  className="rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden"
                >
                  {/* Header with indicator name and status */}
                  <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(ind.indicator.status.trend)}
                      <span className={cn(
                        'text-xs font-semibold',
                        ind.indicator.status.level === 'red' && 'text-red-300',
                        ind.indicator.status.level === 'amber' && 'text-amber-300',
                        ind.indicator.status.level === 'green' && 'text-green-300'
                      )}>
                        {ind.name}
                      </span>
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold',
                        ind.indicator.status.level === 'red' && 'bg-red-500/20 text-red-400',
                        ind.indicator.status.level === 'amber' && 'bg-amber-500/20 text-amber-400'
                      )}>
                        {ind.indicator.status.level}
                      </span>
                    </div>
                    <a
                      href={ind.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-olive-tertiary hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                      {ind.source}
                      <ExternalLink className="w-2 h-2" />
                    </a>
                  </div>

                  {/* News headline - what's happening */}
                  {ind.translation && (
                    <div className="px-3 py-2 bg-white/[0.01]">
                      <p className="text-xs text-olive-primary font-medium leading-snug">
                        {ind.indicator.status.level === 'red'
                          ? ind.translation.redHeadline
                          : ind.translation.amberHeadline}
                      </p>
                    </div>
                  )}

                  {/* Why it matters */}
                  {ind.impact && (
                    <div className="px-3 py-2 border-t border-white/[0.04]">
                      <p className="text-[10px] text-olive-muted mb-0.5">Why it matters:</p>
                      <p className="text-xs text-olive-secondary leading-relaxed">
                        {ind.impact}
                      </p>
                    </div>
                  )}

                  {/* What to do */}
                  {ind.action && (
                    <div className="px-3 py-2 border-t border-white/[0.04] bg-green-500/[0.02]">
                      <p className="text-[10px] text-green-400/70 mb-0.5">What to do:</p>
                      <p className="text-xs text-olive-secondary leading-relaxed">
                        {ind.action}
                      </p>
                    </div>
                  )}

                  {/* Data point */}
                  <div className="px-3 py-1.5 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[9px] text-olive-muted">Reading:</span>
                    <span className="text-[10px] font-mono text-olive-data">
                      {ind.translation?.dataPointTemplate
                        ? ind.translation.dataPointTemplate.replace('{value}', String(ind.indicator.status.value))
                        : ind.indicator.status.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
