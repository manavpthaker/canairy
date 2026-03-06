/**
 * Family Action Plan
 *
 * Unified action surface that consolidates:
 * - "This Week" actions (from AI insights, indicator fallbacks, user-added)
 * - "Building Readiness" tiers (from phaseTasks)
 * - "Priority Actions" in escalated mode (1 red indicator)
 * - High-priority actions in elevated phase (2+ red indicators)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Check,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardList,
  Home,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../store';
import {
  TASK_TIERS,
  TaskTier,
  PhaseTask,
  getVisibleTiers,
  getTierProgress,
  computeReadinessFromTiers,
} from '../data/phaseTasks';
import { ACTION_PROTOCOL_CHECKLIST, ActionProtocolItem } from '../data/phaseData';
import { generateActionList, ActionItem } from '../data/actionGenerator';
import { cn } from '../utils/cn';

// ============================================================================
// TYPES
// ============================================================================

type ThreatState = 'normal' | 'elevated' | 'critical';

// ============================================================================
// PERSISTENCE HELPERS
// ============================================================================

const STORAGE_KEYS = {
  thisWeek: 'canairy_action_plan_this_week',
  tiers: 'canairy_action_plan_tiers',
  critical: 'canairy_action_plan_critical',
  userAdded: 'canairy_action_plan_user_added',
};

function loadCompletedIds(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompletedIds(key: string, ids: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...ids]));
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface ActionCheckboxProps {
  checked: boolean;
  onChange: () => void;
  urgency?: 'now' | 'today' | 'this-week';
}

const ActionCheckbox: React.FC<ActionCheckboxProps> = ({ checked, onChange, urgency }) => {
  const urgencyColor = {
    now: 'border-red-400',
    today: 'border-amber-400',
    'this-week': 'border-emerald-400',
  }[urgency ?? 'this-week'];

  return (
    <button
      onClick={onChange}
      className={cn(
        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
        checked
          ? 'bg-emerald-500 border-emerald-500'
          : `bg-transparent ${urgencyColor} hover:bg-white/5`
      )}
    >
      {checked && <Check className="w-3.5 h-3.5 text-white" />}
    </button>
  );
};

interface UrgencyBadgeProps {
  urgency: 'now' | 'today' | 'this-week';
}

const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency }) => {
  const config = {
    now: { label: 'Now', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
    today: { label: 'Today', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    'this-week': { label: 'This Week', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  }[urgency];

  return (
    <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-md border', config.className)}>
      {config.label}
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FamilyActionPlan: React.FC = () => {
  const { indicators, currentPhase, systemPhase } = useStore();

  // Compute threat state based on red indicator count
  // Higher phase = more serious situation
  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const threatState: ThreatState = redCount >= 2 ? 'critical' : redCount === 1 ? 'elevated' : 'normal';

  // Completion state
  const [completedThisWeek, setCompletedThisWeek] = useState<Set<string>>(
    () => loadCompletedIds(STORAGE_KEYS.thisWeek)
  );
  const [completedTiers, setCompletedTiers] = useState<Set<string>>(
    () => loadCompletedIds(STORAGE_KEYS.tiers)
  );
  const [completedCritical, setCompletedCritical] = useState<Set<string>>(
    () => loadCompletedIds(STORAGE_KEYS.critical)
  );

  // Expanded tier state
  const [expandedTier, setExpandedTier] = useState<string | null>(() => {
    // Default to the first incomplete tier
    const phase = typeof systemPhase === 'number' ? systemPhase : 5;
    const visibleTiers = getVisibleTiers(phase);
    for (const tier of visibleTiers) {
      const progress = getTierProgress(tier, loadCompletedIds(STORAGE_KEYS.tiers));
      if (progress.percentage < 100) return tier.id;
    }
    return visibleTiers[0]?.id ?? null;
  });

  // Generate "This Week" actions from indicators
  const thisWeekActions = useMemo(() => {
    return generateActionList(indicators, completedTiers, systemPhase);
  }, [indicators, completedTiers, systemPhase]);

  // Visible tiers based on phase
  const visibleTiers = useMemo(() => {
    const phase = typeof systemPhase === 'number' ? systemPhase : 5;
    return getVisibleTiers(phase);
  }, [systemPhase]);

  // Readiness computation
  const readiness = useMemo(() => {
    return computeReadinessFromTiers(completedTiers);
  }, [completedTiers]);

  // Toggle handlers
  const toggleThisWeek = useCallback((id: string) => {
    setCompletedThisWeek(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCompletedIds(STORAGE_KEYS.thisWeek, next);
      return next;
    });
  }, []);

  const toggleTier = useCallback((id: string) => {
    setCompletedTiers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCompletedIds(STORAGE_KEYS.tiers, next);
      return next;
    });
  }, []);

  const toggleCritical = useCallback((id: string) => {
    setCompletedCritical(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCompletedIds(STORAGE_KEYS.critical, next);
      return next;
    });
  }, []);

  // Filter completed actions
  const activeThisWeekActions = thisWeekActions.filter(a => !completedThisWeek.has(a.id));
  const completedThisWeekActions = thisWeekActions.filter(a => completedThisWeek.has(a.id));

  // Critical actions categorization
  const criticalByCategory = useMemo(() => {
    const categories: Record<string, ActionProtocolItem[]> = {};
    ACTION_PROTOCOL_CHECKLIST.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });
    return categories;
  }, []);

  const criticalProgress = useMemo(() => {
    const completed = ACTION_PROTOCOL_CHECKLIST.filter(i => completedCritical.has(i.id)).length;
    return { completed, total: ACTION_PROTOCOL_CHECKLIST.length };
  }, [completedCritical]);

  // ── CRITICAL MODE (Phase 7+) ──
  if (threatState === 'critical') {
    return (
      <>
        {/* Header */}
        <div className="border-b border-white/[0.04]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3 mb-1 text-sm">
              <Link to="/dashboard" className="text-white/20 hover:text-white/40 transition-colors">
                Dashboard
              </Link>
              <ChevronDown className="w-3 h-3 text-white/10 rotate-[-90deg]" />
              <span className="text-white/50">Action Plan</span>
            </div>

            {/* Critical Phase Alert */}
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-red-400">7</span>
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-red-400">
                    Phase 7 — High Priority
                  </h1>
                  <p className="text-red-300/70 text-sm">
                    {redCount} critical indicators — prioritize these actions now
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-red-900/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(criticalProgress.completed / criticalProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-red-300/50 mt-2">
                {criticalProgress.completed} of {criticalProgress.total} complete
              </p>
            </div>
          </div>
        </div>

        {/* Critical Actions Checklist */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {Object.entries(criticalByCategory).map(([category, items]) => (
            <section key={category}>
              <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map(item => {
                  const done = completedCritical.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleCritical(item.id)}
                      className={cn(
                        'w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all',
                        'border',
                        done
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                      )}
                    >
                      <ActionCheckbox checked={done} onChange={() => {}} urgency="now" />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium',
                          done ? 'text-emerald-400 line-through opacity-60' : 'text-white'
                        )}>
                          {item.text}
                        </p>
                        {!done && (
                          <p className="text-sm text-white/40 mt-1">{item.why}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                          {item.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.time}
                            </span>
                          )}
                          {item.location && <span>{item.location}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Collapsed tier progress */}
          <section className="pt-6 border-t border-white/[0.06]">
            <details className="group">
              <summary className="flex items-center gap-3 cursor-pointer text-white/40 hover:text-white/60 transition-colors">
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                <span className="text-sm">Your readiness progress</span>
                <span className="text-xs text-white/20 ml-auto">{readiness.description}</span>
              </summary>
              <div className="mt-4 space-y-3">
                {TASK_TIERS.map(tier => {
                  const progress = getTierProgress(tier, completedTiers);
                  return (
                    <div key={tier.id} className="flex items-center gap-3 text-sm">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center',
                        progress.percentage === 100 ? 'bg-emerald-500/20' : 'bg-white/5'
                      )}>
                        {progress.percentage === 100 ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <span className="text-[10px] text-white/30">{progress.completed}</span>
                        )}
                      </div>
                      <span className={cn(
                        'flex-1',
                        progress.percentage === 100 ? 'text-emerald-400' : 'text-white/50'
                      )}>
                        {tier.title}
                      </span>
                      <span className="text-xs text-white/20">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>
          </section>
        </div>
      </>
    );
  }

  // ── NORMAL / ESCALATED MODE ──
  return (
    <>
      {/* Header */}
      <div className="border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-1 text-sm">
            <Link to="/dashboard" className="text-white/20 hover:text-white/40 transition-colors">
              Dashboard
            </Link>
            <ChevronDown className="w-3 h-3 text-white/10 rotate-[-90deg]" />
            <span className="text-white/50">Action Plan</span>
          </div>

          <div className="flex items-center justify-between mt-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white/40" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-white">Family Action Plan</h1>
                <p className="text-white/30 text-sm">
                  {readiness.description} — {thisWeekActions.length} actions this week
                </p>
              </div>
            </div>
          </div>

          {/* Gap messaging */}
          {visibleTiers.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-white/50">
                Current conditions call for <strong className="text-white">{visibleTiers[visibleTiers.length - 1]?.title}</strong>.{' '}
                {(() => {
                  for (const tier of visibleTiers) {
                    const progress = getTierProgress(tier, completedTiers);
                    if (progress.percentage < 100) {
                      const nextTask = tier.tasks.find(t => !completedTiers.has(t.id));
                      if (nextTask) {
                        return (
                          <>
                            Next step: <strong className="text-white">{nextTask.title}</strong>{' '}
                            <span className="text-white/30">({nextTask.timeEstimate})</span>
                          </>
                        );
                      }
                    }
                  }
                  return <span className="text-emerald-400">You're ahead of current conditions.</span>;
                })()}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Priority Actions (Elevated phase only) */}
        {threatState === 'elevated' && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <h2 className="text-lg font-display font-bold text-white">Priority Actions</h2>
              <span className="text-xs text-red-400/70 bg-red-500/10 px-2 py-0.5 rounded">
                1 critical indicator
              </span>
            </div>
            <div className="space-y-2">
              {thisWeekActions.filter(a => a.urgency === 'now').map(action => (
                <ActionRow
                  key={action.id}
                  action={action}
                  completed={completedThisWeek.has(action.id)}
                  onToggle={() => toggleThisWeek(action.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* This Week */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white/40" />
            </div>
            <h2 className="text-lg font-display font-bold text-white">This Week</h2>
            <span className="text-xs text-white/30">
              {activeThisWeekActions.length} active
            </span>
          </div>

          {activeThisWeekActions.length > 0 ? (
            <div className="space-y-2">
              {activeThisWeekActions
                .filter(a => threatState !== 'elevated' || a.urgency !== 'now')
                .map(action => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    completed={false}
                    onToggle={() => toggleThisWeek(action.id)}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/30">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/40" />
              <p>All caught up for this week!</p>
            </div>
          )}

          {/* Completed disclosure */}
          {completedThisWeekActions.length > 0 && (
            <details className="mt-4 group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm text-white/30 hover:text-white/50">
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                {completedThisWeekActions.length} completed
              </summary>
              <div className="mt-2 space-y-2 opacity-60">
                {completedThisWeekActions.map(action => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    completed={true}
                    onToggle={() => toggleThisWeek(action.id)}
                  />
                ))}
              </div>
            </details>
          )}
        </section>

        {/* Building Readiness */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Home className="w-4 h-4 text-white/40" />
            </div>
            <h2 className="text-lg font-display font-bold text-white">Building Readiness</h2>
          </div>

          <div className="space-y-3">
            {visibleTiers.map(tier => {
              const progress = getTierProgress(tier, completedTiers);
              const isExpanded = expandedTier === tier.id;
              const isComplete = progress.percentage === 100;

              return (
                <div
                  key={tier.id}
                  className={cn(
                    'rounded-xl border overflow-hidden transition-all',
                    isComplete
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  )}
                >
                  {/* Tier header */}
                  <button
                    onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
                    className="w-full px-5 py-4 flex items-center gap-4 text-left"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0',
                      isComplete
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-white/[0.04] border-white/[0.08]'
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <span className="text-sm font-bold text-white/30">
                          {progress.completed}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          'font-semibold',
                          isComplete ? 'text-emerald-400' : 'text-white'
                        )}>
                          {tier.title}
                        </h3>
                      </div>
                      <p className="text-sm text-white/30 truncate">{tier.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-white/20">
                        {progress.completed}/{progress.total}
                      </span>
                      <ChevronDown className={cn(
                        'w-5 h-5 text-white/20 transition-transform',
                        isExpanded && 'rotate-180'
                      )} />
                    </div>
                  </button>

                  {/* Progress bar */}
                  <div className="px-5 pb-4">
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                        )}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded tasks */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-white/[0.04] pt-4 space-y-2">
                          {tier.tasks.map(task => {
                            const done = completedTiers.has(task.id);
                            return (
                              <button
                                key={task.id}
                                onClick={() => toggleTier(task.id)}
                                className={cn(
                                  'w-full flex items-start gap-4 p-3 rounded-lg text-left transition-colors',
                                  done
                                    ? 'bg-emerald-500/5'
                                    : 'hover:bg-white/[0.03]'
                                )}
                              >
                                <div className={cn(
                                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                                  done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                                )}>
                                  {done && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    'text-sm font-medium',
                                    done ? 'text-emerald-400 line-through opacity-60' : 'text-white'
                                  )}>
                                    {task.title}
                                  </p>
                                  {!done && (
                                    <p className="text-sm text-white/40 mt-1">{task.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {task.timeEstimate}
                                    </span>
                                    {task.costEstimate && (
                                      <span>{task.costEstimate}</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
};

// ============================================================================
// ACTION ROW COMPONENT
// ============================================================================

interface ActionRowProps {
  action: ActionItem;
  completed: boolean;
  onToggle: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({ action, completed, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all border',
        completed
          ? 'bg-emerald-500/5 border-emerald-500/10'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
      )}
    >
      <ActionCheckbox checked={completed} onChange={() => {}} urgency={action.urgency} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={cn(
            'font-medium',
            completed ? 'text-emerald-400 line-through opacity-60' : 'text-white'
          )}>
            {action.task}
          </p>
          {!completed && <UrgencyBadge urgency={action.urgency} />}
        </div>
        {!completed && (
          <p className="text-sm text-white/40">{action.why}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {action.timeEstimate}
          </span>
        </div>
      </div>
    </button>
  );
};
