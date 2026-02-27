import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Check, Clock, Shield } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore, selectTightenUpActive } from '../../store';
import { TIGHTEN_UP_CHECKLIST } from '../../data/phaseData';

export const ThreatBanner: React.FC = () => {
  const tightenUpActive = useStore(selectTightenUpActive);
  const { indicators } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const hasRed = redCount > 0;

  if (!hasRed) return null;

  const redIndicators = indicators.filter(i => i.status.level === 'red');
  const completedCount = completed.size;
  const totalCount = TIGHTEN_UP_CHECKLIST.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const toggleItem = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = [...new Set(TIGHTEN_UP_CHECKLIST.map(c => c.category))];

  return (
    <motion.div
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={cn(
        'rounded-2xl overflow-hidden',
        tightenUpActive ? 'threat-banner' : 'threat-banner-amber'
      )}>
        {/* Header */}
        <button
          onClick={() => tightenUpActive && setExpanded(!expanded)}
          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              tightenUpActive
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-amber-500/15 border border-amber-500/25'
            )}>
              {tightenUpActive ? (
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </motion.div>
              ) : (
                <Shield className="w-5 h-5 text-amber-400" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className={cn(
                'text-sm sm:text-base font-display font-bold tracking-wide',
                tightenUpActive ? 'text-red-300' : 'text-amber-300'
              )}>
                {tightenUpActive ? 'TIGHTEN-UP PROTOCOL' : 'ELEVATED AWARENESS'}
              </h2>
              <p className={cn(
                'text-xs sm:text-sm truncate',
                tightenUpActive ? 'text-red-300/60' : 'text-amber-300/60'
              )}>
                {tightenUpActive
                  ? `${redCount} indicators critical — 48-hour checklist active`
                  : `${redCount} indicator${redCount !== 1 ? 's' : ''} at red level`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {tightenUpActive && (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs font-mono text-red-300/70">
                    {completedCount}/{totalCount}
                  </span>
                  <div className="w-16 h-1.5 bg-red-900/40 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-red-400/80 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-red-400/60" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-red-400/60" />
                )}
              </>
            )}
          </div>
        </button>

        {/* Expandable checklist (tighten-up only) */}
        <AnimatePresence>
          {expanded && tightenUpActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-6 pb-5 border-t border-red-500/10">
                <div className="flex items-center gap-2 py-3 text-xs text-red-300/50">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Complete within 48 hours of activation</span>
                </div>

                {/* Triggering indicators */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {redIndicators.map(ind => (
                    <span
                      key={ind.id}
                      className={cn(
                        'px-2 py-1 text-xs rounded-lg',
                        ind.critical
                          ? 'bg-red-500/15 text-red-300 border border-red-500/20'
                          : 'bg-white/5 text-red-300/70'
                      )}
                    >
                      {ind.name}
                    </span>
                  ))}
                </div>

                {/* Checklist */}
                <div className="space-y-4">
                  {categories.map(cat => (
                    <div key={cat}>
                      <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-1.5">{cat}</h4>
                      <div className="space-y-0.5">
                        {TIGHTEN_UP_CHECKLIST.filter(c => c.category === cat).map(item => {
                          const done = completed.has(item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                                done ? 'bg-green-500/[0.08] text-green-400' : 'hover:bg-white/[0.03] text-white/70'
                              )}
                            >
                              <div className={cn(
                                'w-4.5 h-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                                done ? 'bg-green-500 border-green-500' : 'border-white/20'
                              )} style={{ width: 18, height: 18 }}>
                                {done && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={cn('text-sm', done && 'line-through opacity-50')}>
                                {item.text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
