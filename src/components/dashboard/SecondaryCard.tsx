import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

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

export const SecondaryCard: React.FC<SecondaryCardProps> = ({ data, index = 0 }) => {
  const urgencyConfig = URGENCY_CONFIG[data.urgency];

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
      <p className="text-body-small text-olive-secondary leading-relaxed line-clamp-2 mb-3">
        {data.body}
      </p>

      {/* Action link */}
      {data.action && (
        <a
          href={data.action.href}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-olive-tertiary hover:text-olive-primary transition-colors"
        >
          {data.action.label}
          <ArrowRight className="w-3 h-3" />
        </a>
      )}
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
