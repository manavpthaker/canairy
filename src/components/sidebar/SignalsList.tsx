import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useStore } from '../../store';
import { IndicatorData } from '../../types';
import { formatValue } from '../../data/indicatorDisplay';

const LEVEL_ORDER = { red: 0, amber: 1 } as const;

/** Real elevated readings, newest data first. No generated headlines. */
export const SignalsList: React.FC = () => {
  const indicators = useStore((s) => s.indicators);

  const elevated = indicators
    .filter(
      (i): i is IndicatorData & { status: { level: 'red' | 'amber' } } =>
        i.status.dataSource === 'LIVE' && (i.status.level === 'red' || i.status.level === 'amber')
    )
    .sort((a, b) => LEVEL_ORDER[a.status.level] - LEVEL_ORDER[b.status.level])
    .slice(0, 8);

  if (elevated.length === 0) {
    return (
      <div className="text-center py-4 text-olive-tertiary text-sm">
        Nothing elevated in the latest readings
      </div>
    );
  }

  const trendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-olive-tertiary" aria-label="Rising" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-olive-tertiary" aria-label="Falling" />;
    return <Minus className="w-3 h-3 text-olive-muted" aria-hidden="true" />;
  };

  return (
    <div className="space-y-0">
      {elevated.map((ind, index) => {
        const Row = ind.sourceUrl ? motion.a : motion.div;
        return (
          <Row
            key={ind.id}
            {...(ind.sourceUrl ? { href: ind.sourceUrl, target: '_blank', rel: 'noopener noreferrer' } : {})}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="block py-3 border-b border-white/5 group"
          >
            <div className="flex items-start gap-2">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  ind.status.level === 'red' ? 'bg-red-400' : 'bg-amber-400'
                }`}
                aria-label={ind.status.level}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-olive-primary leading-snug group-hover:text-amber-400 transition-colors">
                  {ind.name}: {formatValue(ind.status.value, ind.unit)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {trendIcon(ind.status.trend)}
                  <span className="text-xs font-mono text-olive-tertiary truncate">{ind.dataSource}</span>
                  {ind.status.lastUpdate && (
                    <>
                      <span className="text-olive-muted">·</span>
                      <span className="text-xs font-mono text-olive-muted whitespace-nowrap">
                        {formatDistanceToNow(new Date(ind.status.lastUpdate), { addSuffix: true })}
                      </span>
                    </>
                  )}
                  {ind.sourceUrl && (
                    <ExternalLink className="w-2.5 h-2.5 text-olive-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  )}
                </div>
              </div>
            </div>
          </Row>
        );
      })}
    </div>
  );
};
