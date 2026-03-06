/**
 * ActionPlanPreview
 *
 * Condensed action plan preview for the dashboard.
 * Shows top 5 "This Week" actions with inline checkboxes,
 * plus a tier summary with progress bar.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, ChevronRight, ClipboardList } from 'lucide-react';
import { useStore } from '../../store';
import { generateActionList, ActionItem } from '../../data/actionGenerator';
import {
  TASK_TIERS,
  getVisibleTiers,
  getTierProgress,
  computeReadinessFromTiers,
} from '../../data/phaseTasks';
import { cn } from '../../utils/cn';

// ============================================================================
// PERSISTENCE
// ============================================================================

const STORAGE_KEY = 'canairy_action_plan_this_week';
const TIER_STORAGE_KEY = 'canairy_action_plan_tiers';

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
// COMPONENT
// ============================================================================

export const ActionPlanPreview: React.FC = () => {
  const { indicators, systemPhase } = useStore();

  // Completion state
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => loadCompletedIds(STORAGE_KEY)
  );
  const tierCompletedIds = useMemo(
    () => loadCompletedIds(TIER_STORAGE_KEY),
    []
  );

  // Generate actions
  const actions = useMemo(() => {
    return generateActionList(indicators, tierCompletedIds, systemPhase);
  }, [indicators, tierCompletedIds, systemPhase]);

  // Get top 5 incomplete actions
  const topActions = useMemo(() => {
    return actions
      .filter(a => !completedIds.has(a.id))
      .slice(0, 5);
  }, [actions, completedIds]);

  // Get active tier info
  const tierInfo = useMemo(() => {
    const phase = typeof systemPhase === 'number' ? systemPhase : 5;
    const visibleTiers = getVisibleTiers(phase);

    // Find the first incomplete tier
    for (const tier of visibleTiers) {
      const progress = getTierProgress(tier, tierCompletedIds);
      if (progress.percentage < 100) {
        return { tier, progress };
      }
    }

    // All complete - show last tier
    const lastTier = visibleTiers[visibleTiers.length - 1];
    return {
      tier: lastTier,
      progress: getTierProgress(lastTier, tierCompletedIds),
    };
  }, [systemPhase, tierCompletedIds]);

  const readiness = useMemo(() => {
    return computeReadinessFromTiers(tierCompletedIds);
  }, [tierCompletedIds]);

  // Toggle handler
  const toggleAction = useCallback((id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCompletedIds(STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Urgency styling
  const getUrgencyColor = (urgency: ActionItem['urgency']) => {
    return {
      now: 'border-red-400',
      today: 'border-amber-400',
      'this-week': 'border-emerald-400',
    }[urgency];
  };

  const getUrgencyBadge = (urgency: ActionItem['urgency']) => {
    const config = {
      now: { label: 'Now', className: 'bg-red-500/15 text-red-400' },
      today: { label: 'Today', className: 'bg-amber-500/15 text-amber-400' },
      'this-week': { label: 'This week', className: 'bg-emerald-500/15 text-emerald-400' },
    }[urgency];
    return (
      <span className={cn('px-1.5 py-0.5 text-[9px] font-medium rounded', config.className)}>
        {config.label}
      </span>
    );
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white">Your action plan</h3>
            <p className="text-xs text-white/30">{readiness.description}</p>
          </div>
        </div>
        <Link
          to="/action-plan"
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          Open full plan
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Actions list */}
      <div className="px-5 py-3 space-y-1">
        {topActions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => toggleAction(action.id)}
            className="w-full flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-white/[0.03] transition-colors text-left group"
          >
            {/* Checkbox */}
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
              getUrgencyColor(action.urgency),
              'group-hover:bg-white/5'
            )}>
              <span className="text-[10px] font-mono text-white/40">{index + 1}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white truncate">{action.task}</p>
                {getUrgencyBadge(action.urgency)}
              </div>
              <p className="text-xs text-white/30 mt-0.5 truncate">{action.why}</p>
            </div>

            {/* Time estimate */}
            <span className="text-[10px] text-white/20 flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" />
              {action.timeEstimate}
            </span>
          </button>
        ))}

        {topActions.length === 0 && (
          <p className="text-sm text-white/30 py-4 text-center">
            All caught up! Check the full plan for readiness tasks.
          </p>
        )}
      </div>

      {/* Tier progress footer */}
      {tierInfo.tier && (
        <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white/40">
              Working on: <span className="text-white/60">{tierInfo.tier.title}</span>
            </span>
            <span className="text-white/30">
              {tierInfo.progress.completed}/{tierInfo.progress.total}
            </span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                tierInfo.progress.percentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'
              )}
              style={{ width: `${tierInfo.progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
