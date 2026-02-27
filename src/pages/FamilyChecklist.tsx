import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  ChevronDown,
  Check,
  Shield,
  Printer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { PHASES } from '../data/phaseData';
import { cn } from '../utils/cn';

export const FamilyChecklist: React.FC = () => {
  const { currentPhase } = useStore();
  const phaseNumber = currentPhase?.number ?? 0;

  // All phases up to and including one ahead of current
  const relevantPhases = useMemo(() => {
    return PHASES.filter(p => p.number <= phaseNumber + 1);
  }, [phaseNumber]);

  const [completedItems, setCompletedItems] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('canairy_checklist');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [expandedPhase, setExpandedPhase] = useState<number | null>(phaseNumber);

  const toggleItem = (id: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('canairy_checklist', JSON.stringify([...next]));
      return next;
    });
  };

  const totalActions = relevantPhases.reduce((sum, p) => sum + p.actions.length, 0);
  const completedCount = relevantPhases.reduce((sum, p) => {
    return sum + p.actions.filter((_, i) => completedItems.has(`${p.number}-${i}`)).length;
  }, 0);
  const overallProgress = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;

  return (
    <>
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-1 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-300 transition-colors">Dashboard</Link>
            <ChevronDown className="w-3 h-3 text-gray-600 rotate-[-90deg]" />
            <span className="text-gray-300">Family Checklist</span>
          </div>

          <div className="flex items-center justify-between mt-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Family Actions</h1>
                <p className="text-gray-400">Simple, practical steps to keep your family confident and ready</p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-gray-300 rounded-lg hover:bg-[#2A2A2A] transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>

          {/* Overall progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Your family's progress</span>
              <span className="text-sm font-medium text-white">{completedCount}/{totalActions} ({overallProgress}%)</span>
            </div>
            <div className="h-3 bg-[#0A0A0A] rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  overallProgress === 100 ? 'bg-green-500' : overallProgress > 50 ? 'bg-indigo-500' : 'bg-indigo-500/70'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {overallProgress === 100 && (
              <p className="text-green-400 text-sm mt-2 font-medium">Your family is fully prepared for this phase. Amazing work!</p>
            )}
            {overallProgress > 0 && overallProgress < 100 && (
              <p className="text-gray-500 text-xs mt-2">Every step makes your family more resilient. Keep going!</p>
            )}
            {overallProgress === 0 && (
              <p className="text-gray-500 text-xs mt-2">Start by tapping any item below. Even one step makes a difference.</p>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {relevantPhases.map((phase) => {
          const isExpanded = expandedPhase === phase.number;
          const isCurrent = phase.number === phaseNumber;
          const phaseCompleted = phase.actions.filter((_, i) => completedItems.has(`${phase.number}-${i}`)).length;
          const phaseTotal = phase.actions.length;
          const phasePct = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;

          return (
            <div
              key={phase.number}
              className={cn(
                'rounded-2xl border overflow-hidden',
                isCurrent ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-[#1A1A1A] bg-[#111111]'
              )}
            >
              <button
                onClick={() => setExpandedPhase(isExpanded ? null : phase.number)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                  style={{
                    backgroundColor: `${phase.color}10`,
                    borderColor: `${phase.color}30`,
                  }}
                >
                  {phasePct === 100 ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <span className="text-sm font-bold" style={{ color: phase.color }}>{phase.number}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={cn('font-semibold', isCurrent ? 'text-white' : 'text-gray-400')}>
                      {phase.name}
                    </h3>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300 font-medium">CURRENT</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{phase.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500">{phaseCompleted}/{phaseTotal}</span>
                  <ChevronDown className={cn('w-5 h-5 text-gray-500 transition-transform', isExpanded && 'rotate-180')} />
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-[#1A1A1A] pt-4 space-y-1">
                  {phase.actions.map((action, i) => {
                    const itemId = `${phase.number}-${i}`;
                    const done = completedItems.has(itemId);
                    return (
                      <button
                        key={itemId}
                        onClick={() => toggleItem(itemId)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                          done ? 'bg-green-500/10 text-green-400' : 'hover:bg-[#1A1A1A] text-gray-300'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                            done ? 'bg-green-500 border-green-500' : 'border-gray-600'
                          )}
                        >
                          {done && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn('text-sm', done && 'line-through opacity-60')}>{action}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="text-center py-8">
          <Link
            to="/playbook"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
          >
            <Shield className="w-4 h-4" />
            View Full Resilience Playbook (Phases 0-9)
          </Link>
        </div>
      </div>
    </>
  );
};
