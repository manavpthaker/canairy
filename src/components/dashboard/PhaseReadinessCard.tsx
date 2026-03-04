import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../store';
import { PHASES } from '../../data/phaseData';

// Phase descriptions for user-friendly explanation
const PHASE_DESCRIPTIONS: Record<number, string> = {
  1: '72-hour basics: water, food, cash, and first aid',
  2: 'Extended supplies and home security improvements',
  3: 'Health supplies, off-grid comms, and air filtration',
  4: 'Alternative energy and vehicle preparation',
  5: 'Community coordination and skill building',
  6: 'Advanced self-sufficiency and hardening',
  7: 'Long-term resilience and remote options',
  8: 'Network-level preparations',
  9: 'Full grid independence',
};

// Mock task counts per phase (would come from checklist data)
const PHASE_TASK_COUNTS: Record<number, number> = {
  1: 6, 2: 8, 3: 9, 4: 7, 5: 6, 6: 8, 7: 5, 8: 4, 9: 3,
};

export const PhaseReadinessCard: React.FC = () => {
  const { systemPhase, checklistProgress } = useStore();

  // Handle 'tighten-up' state specially
  const isTightenUp = systemPhase === 'tighten-up';
  const phaseNum = isTightenUp ? 3 : systemPhase;

  const currentPhase = PHASES.find(p => p.number === phaseNum) ?? PHASES[0];
  const phaseDescription = isTightenUp
    ? 'Multiple critical indicators active — follow TIGHTEN-UP protocol'
    : (PHASE_DESCRIPTIONS[phaseNum] ?? currentPhase.description);

  // Calculate completed tasks for current phase
  const completedItems = checklistProgress?.completedItems?.length ?? 4;
  const totalTasks = PHASE_TASK_COUNTS[phaseNum] ?? 9;
  const progress = totalTasks > 0 ? Math.round((completedItems / totalTasks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-olive-card border border-white/[0.06] rounded-xl p-5 mb-4"
    >
      {/* Top row: Phase badge + info + View checklist */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Phase number badge */}
          <div className={`rounded-lg flex items-center justify-center ${
            isTightenUp ? 'w-auto px-2 h-9 bg-red-500/20' : 'w-9 h-9 bg-amber-500/15'
          }`}>
            <span className={`font-display font-bold ${
              isTightenUp ? 'text-sm text-red-400' : 'text-base text-amber-400'
            }`}>
              {isTightenUp ? 'TIGHTEN-UP' : phaseNum}
            </span>
          </div>

          <div>
            <p className={`text-sm font-display font-semibold ${
              isTightenUp ? 'text-red-400' : 'text-amber-400'
            }`}>
              {isTightenUp ? 'TIGHTEN-UP protocol is active' : `Phase ${phaseNum} conditions are active`}
            </p>
            <p className="text-xs text-olive-tertiary mt-0.5">
              {phaseDescription}
            </p>
          </div>
        </div>

        <Link
          to="/checklist"
          className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1"
        >
          View checklist
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Progress row */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
        <span className="text-xs text-olive-tertiary">
          You've completed {completedItems} of {totalTasks} {isTightenUp ? 'priority' : `Phase ${phaseNum}`} tasks
        </span>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};
