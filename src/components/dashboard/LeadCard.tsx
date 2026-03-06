import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Clock, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';
import { getDisplayName } from '../../data/indicatorTranslations';

export interface LeadCardData {
  id: string;
  headline: string;
  body: string;
  urgency: 'today' | 'week' | 'knowing';
  indicatorIds: string[];
  severity: number;
  confidence?: 'high' | 'moderate' | 'low';
  signalCount?: number;
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
    label: 'Do this today',
    className: 'urgency-today',
    borderColor: 'border-red-500/40',
  },
  week: {
    label: 'This week',
    className: 'urgency-week',
    borderColor: 'border-amber-500/40',
  },
  knowing: {
    label: 'Worth knowing',
    className: 'urgency-knowing',
    borderColor: 'border-olive-hover',
  },
};

const CONFIDENCE_COLORS = {
  high: 'text-green-400',
  moderate: 'text-amber-400',
  low: 'text-red-400',
};

export const LeadCard: React.FC<LeadCardProps> = ({ data, onClick, isSelected }) => {
  const urgencyConfig = URGENCY_CONFIG[data.urgency];
  const indicators = useStore((s) => s.indicators);

  // Resolve indicator names from IDs
  const sourceIndicators = data.indicatorIds
    .map((id) => {
      const indicator = indicators.find((i) => i.id === id);
      return indicator ? { id, name: getDisplayName(id) || indicator.name } : null;
    })
    .filter(Boolean) as { id: string; name: string }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onClick={onClick}
      className={cn(
        'lead-card p-5',
        data.urgency === 'today' && 'lead-card-red',
        data.urgency === 'week' && 'lead-card-amber',
        onClick && 'cursor-pointer hover:bg-white/[0.02] transition-colors',
        // Selected state: left border highlight + brighter background
        isSelected && 'border-l-3 border-l-amber-500 bg-white/[0.04]'
      )}
    >
      {/* Header: Urgency pill + confidence + icon */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <span className={cn('urgency-pill', urgencyConfig.className)}>
            <Clock className="w-3 h-3 mr-1" />
            {urgencyConfig.label}
          </span>
          {data.confidence && (
            <span className={cn('text-xs font-medium', CONFIDENCE_COLORS[data.confidence])}>
              {data.confidence.charAt(0).toUpperCase() + data.confidence.slice(1)} confidence
            </span>
          )}
          {data.signalCount && (
            <span className="text-xs text-olive-muted">
              · {data.signalCount} signals
            </span>
          )}
        </div>
        {data.severity >= 7 && (
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
        )}
      </div>

      {/* Headline */}
      <h3 className="font-display text-display-lead text-olive-primary mb-2">
        {data.headline}
      </h3>

      {/* Body */}
      <p className="text-body-card text-olive-secondary leading-relaxed mb-4">
        {data.body}
      </p>

      {/* Footer: Action + Learn more */}
      <div className="flex items-center justify-between">
        {data.action && (
          <a
            href={data.action.href}
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
          </a>
        )}
        {onClick && (
          <button
            className="inline-flex items-center gap-1 text-xs text-olive-tertiary hover:text-olive-secondary transition-colors ml-auto"
          >
            Learn more
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Source indicators */}
      {sourceIndicators.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          <p className="text-[10px] text-olive-muted mb-1.5">Based on:</p>
          <div className="flex flex-wrap gap-1.5">
            {sourceIndicators.slice(0, 3).map((ind) => (
              <Link
                key={ind.id}
                to={`/indicator/${ind.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-olive-data hover:bg-white/[0.08] hover:text-olive-secondary transition-colors"
              >
                {ind.name}
              </Link>
            ))}
            {sourceIndicators.length > 3 && (
              <span className="text-[10px] text-olive-muted px-1">
                +{sourceIndicators.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
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
