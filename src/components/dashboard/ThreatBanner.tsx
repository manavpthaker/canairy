import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Check, Clock, Shield, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore, selectActionProtocolActive } from '../../store';
import { ACTION_CHECKLIST } from '../../data/phaseData';
import { generateSituationNarrative } from '../../utils/narrative';

export const ThreatBanner: React.FC = () => {
  const actionProtocolActive = useStore(selectActionProtocolActive);
  const { indicators } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const hasRed = redCount > 0;

  const narrative = useMemo(
    () => generateSituationNarrative(indicators),
    [indicators]
  );

  if (!hasRed) return null;

  const redIndicators = indicators.filter(i => i.status.level === 'red');
  const completedCount = completed.size;
  const totalCount = ACTION_CHECKLIST.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const toggleItem = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = [...new Set(ACTION_CHECKLIST.map(c => c.category))];

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
        actionProtocolActive ? 'threat-banner' : 'threat-banner-amber'
      )}>
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              actionProtocolActive
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-amber-500/15 border border-amber-500/25'
            )}>
              {actionProtocolActive ? (
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
                actionProtocolActive ? 'text-red-300' : 'text-amber-300'
              )}>
                {actionProtocolActive ? 'ACTION PROTOCOL ACTIVE' : 'ELEVATED ALERT'}
              </h2>
              <p className={cn(
                'text-xs sm:text-sm truncate',
                actionProtocolActive ? 'text-red-300/60' : 'text-amber-300/60'
              )}>
                {narrative?.headline
                  ? narrative.headline
                  : actionProtocolActive
                    ? `${redCount} indicators at red — 48-hour checklist active`
                    : `${redCount} indicator${redCount !== 1 ? 's' : ''} at red level`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {actionProtocolActive && (
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
              </>
            )}
            {expanded ? (
              <ChevronUp className={cn('w-4 h-4', actionProtocolActive ? 'text-red-400/60' : 'text-amber-400/60')} />
            ) : (
              <ChevronDown className={cn('w-4 h-4', actionProtocolActive ? 'text-red-400/60' : 'text-amber-400/60')} />
            )}
          </div>
        </button>

        {/* Expandable content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className={cn(
                'px-4 sm:px-6 pb-5 border-t',
                actionProtocolActive ? 'border-red-500/10' : 'border-amber-500/10'
              )}>
                {/* WHY section — what Canairy is seeing */}
                {narrative && (
                  <div className={cn(
                    'mt-4 mb-4 p-4 rounded-xl',
                    actionProtocolActive ? 'bg-red-950/30 border border-red-500/10' : 'bg-amber-950/30 border border-amber-500/10'
                  )}>
                    <div className="flex items-start gap-2 mb-2">
                      <Info className={cn('w-4 h-4 mt-0.5 flex-shrink-0', actionProtocolActive ? 'text-red-400' : 'text-amber-400')} />
                      <h3 className={cn('text-sm font-semibold', actionProtocolActive ? 'text-red-300' : 'text-amber-300')}>
                        What's happening
                      </h3>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed mb-3">
                      {narrative.explanation}
                    </p>
                    <p className="text-sm text-white/50 leading-relaxed">
                      {narrative.whatToDoAboutIt}
                    </p>
                  </div>
                )}

                {actionProtocolActive && (
                  <div className="flex items-center gap-2 py-3 text-xs text-red-300/50">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Complete within 48 hours of activation</span>
                  </div>
                )}

                {/* Triggering indicators with their WHY */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-2">Indicators driving this alert</h4>
                  <div className="space-y-1.5">
                    {redIndicators.map(ind => {
                      const keyInd = narrative?.keyIndicators.find(k => k.id === ind.id);
                      return (
                        <div
                          key={ind.id}
                          className={cn(
                            'px-3 py-2 rounded-lg',
                            ind.critical
                              ? 'bg-red-500/15 border border-red-500/20'
                              : 'bg-white/[0.03]'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-red-300">{ind.name}</span>
                            <span className="text-xs font-mono text-red-300/70">{ind.status.value} {ind.unit}</span>
                          </div>
                          {keyInd?.whyItMatters && (
                            <p className="text-xs text-white/40 mt-1 leading-relaxed">{keyInd.whyItMatters}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Checklist (action protocol only) */}
                {actionProtocolActive && (
                  <div className="space-y-4">
                    {categories.map(cat => (
                      <div key={cat}>
                        <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-1.5">{cat}</h4>
                        <div className="space-y-0.5">
                          {ACTION_CHECKLIST.filter(c => c.category === cat).map(item => {
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
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
