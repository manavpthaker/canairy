import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronDown, ChevronUp, Check, Clock, MapPin, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore, selectTightenUpActive } from '../../store';
import { TIGHTEN_UP_CHECKLIST, TightenUpItem } from '../../data/phaseData';

const STORAGE_KEY = 'canairy_tightenup_checklist';

export const TightenUpBanner: React.FC = () => {
  const tightenUpActive = useStore(selectTightenUpActive);
  const { indicators } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(() => {
    // Load from localStorage on initial render
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(parsed.items || []);
      }
    } catch {
      // Ignore parse errors
    }
    return new Set();
  });

  // Save to localStorage whenever completed changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: Array.from(completed),
        lastUpdated: new Date().toISOString()
      }));
    } catch {
      // Ignore storage errors
    }
  }, [completed]);

  if (!tightenUpActive) return null;

  const redIndicators = indicators.filter((i) => i.status.level === 'red');
  const completedCount = completed.size;
  const totalCount = TIGHTEN_UP_CHECKLIST.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const toggleItem = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = [...new Set(TIGHTEN_UP_CHECKLIST.map((c) => c.category))];

  // Find the next uncompleted item
  const nextItem = TIGHTEN_UP_CHECKLIST.find(item => !completed.has(item.id));

  return (
    <motion.div
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="rounded-2xl border-2 border-red-500/50 bg-red-500/10 overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            </motion.div>
            <div className="min-w-0">
              <h2 className="text-lg font-display font-bold text-red-400">
                TIGHTEN-UP PROTOCOL
              </h2>
              <p className="text-sm text-red-300/80 truncate">
                {redIndicators.length} RED indicator{redIndicators.length !== 1 ? 's' : ''} triggered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="text-sm font-mono text-red-300">
                {completedCount}/{totalCount}
              </div>
              <div className="w-16 h-2 bg-red-900/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* NEXT ACTION - Always visible with full WHY */}
        {nextItem && (
          <div className="px-4 sm:px-6 pb-4 border-t border-red-500/20">
            <div className="pt-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="text-red-400">▶</span> NEXT ACTION
              </div>

              <div className="bg-[#0A0A0A] rounded-xl p-4 space-y-3">
                {/* Task */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleItem(nextItem.id)}
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    aria-label="Mark as complete"
                  >
                    <div className="w-6 h-6 rounded border-2 border-red-400 flex items-center justify-center">
                      <Check className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                  <div className="flex-1">
                    <div className="text-white font-medium">{nextItem.text}</div>
                  </div>
                </div>

                {/* WHY - Always visible for next action */}
                <div className="text-sm text-gray-400 pl-14">
                  <span className="text-red-400 font-medium">WHY: </span>
                  {nextItem.why}
                </div>

                {/* Time & Location */}
                <div className="flex flex-wrap items-center gap-4 text-xs pl-14">
                  {nextItem.time && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{nextItem.time}</span>
                    </div>
                  )}
                  {nextItem.location && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{nextItem.location}</span>
                    </div>
                  )}
                </div>

                {/* Large Mark Complete CTA */}
                <button
                  onClick={() => toggleItem(nextItem.id)}
                  className="w-full mt-2 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Mark Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All done state */}
        {!nextItem && (
          <div className="px-4 sm:px-6 pb-4 border-t border-red-500/20">
            <div className="pt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-medium">All items complete!</span>
              </div>
            </div>
          </div>
        )}

        {/* View all items button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 sm:px-6 py-3 border-t border-red-500/20 flex items-center justify-center gap-2 text-sm text-red-300 hover:bg-red-500/5 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide all items
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              View all {totalCount} items
            </>
          )}
        </button>

        {/* Expandable checklist */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-6 pb-6 border-t border-red-500/20">
                {/* Timer */}
                <div className="flex items-center gap-2 py-3 text-sm text-red-300/80">
                  <Clock className="w-4 h-4" />
                  <span>Complete within 48 hours of activation</span>
                </div>

                {/* Red indicators causing activation */}
                <div className="mb-4 p-3 bg-[#0A0A0A] rounded-lg">
                  <div className="text-xs text-gray-400 mb-2">Triggering indicators:</div>
                  <div className="flex flex-wrap gap-2">
                    {redIndicators.map((ind) => (
                      <span
                        key={ind.id}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md',
                          ind.critical
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-red-500/10 text-red-400'
                        )}
                      >
                        {ind.name}
                        {ind.critical && ' (CRITICAL)'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Checklist by category */}
                <div className="space-y-4">
                  {categories.map((cat) => (
                    <div key={cat}>
                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        {cat}
                      </h4>
                      <div className="space-y-1">
                        {TIGHTEN_UP_CHECKLIST.filter((c) => c.category === cat).map(
                          (item: TightenUpItem) => {
                            const done = completed.has(item.id);
                            const isItemExpanded = expandedItem === item.id;
                            return (
                              <div key={item.id} className="space-y-1">
                                <div className="flex items-start gap-2">
                                  {/* Checkbox - Large touch target */}
                                  <button
                                    onClick={() => toggleItem(item.id)}
                                    className={cn(
                                      'w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                                      done
                                        ? 'bg-green-500/20'
                                        : 'bg-red-500/5 hover:bg-red-500/10'
                                    )}
                                    aria-label={done ? 'Mark as incomplete' : 'Mark as complete'}
                                  >
                                    <div
                                      className={cn(
                                        'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                                        done
                                          ? 'bg-green-500 border-green-500'
                                          : 'border-gray-600'
                                      )}
                                    >
                                      {done && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                  </button>

                                  {/* Item content */}
                                  <button
                                    onClick={() => setExpandedItem(isItemExpanded ? null : item.id)}
                                    className={cn(
                                      'flex-1 min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors',
                                      done
                                        ? 'bg-green-500/10 text-green-400'
                                        : 'hover:bg-red-500/5 text-gray-300',
                                      isItemExpanded && !done && 'bg-red-500/5'
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'text-sm flex-1',
                                        done && 'line-through opacity-60'
                                      )}
                                    >
                                      {item.text}
                                    </span>
                                    <Info className={cn(
                                      "w-4 h-4 flex-shrink-0 transition-colors",
                                      isItemExpanded ? "text-red-400" : "text-gray-500"
                                    )} />
                                  </button>
                                </div>

                                {/* Expanded WHY context */}
                                <AnimatePresence>
                                  {isItemExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden ml-13"
                                    >
                                      <div className="pl-14 pr-3 py-2 space-y-2">
                                        {/* WHY */}
                                        <div className="text-sm text-gray-400">
                                          <span className="text-red-400 font-medium">WHY: </span>
                                          {item.why}
                                        </div>
                                        {/* Time & Location */}
                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                          {item.time && (
                                            <div className="flex items-center gap-1 text-gray-500">
                                              <Clock className="w-3.5 h-3.5" />
                                              <span>{item.time}</span>
                                            </div>
                                          )}
                                          {item.location && (
                                            <div className="flex items-center gap-1 text-gray-500">
                                              <MapPin className="w-3.5 h-3.5" />
                                              <span>{item.location}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          }
                        )}
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
