import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';

export const SimpleDecisionSupport: React.FC = () => {
  const { indicators, hopiScore, currentPhase } = useStore();
  
  const calculateRiskLevel = (): number => {
    if (!hopiScore) return 5;
    return Math.round(hopiScore.score * 10);
  };
  
  const calculateTimeToAct = (): string => {
    const criticalCount = indicators.filter(i => i.status.level === 'red' && i.critical).length;
    const redCount = indicators.filter(i => i.status.level === 'red').length;
    
    if (criticalCount > 0) return '24-48 hours';
    if (redCount >= 2) return '48-72 hours';
    if (redCount > 0) return '1 week';
    return 'No urgent action';
  };
  
  const getKeyChanges = () => {
    const redIndicators = indicators.filter(i => i.status.level === 'red');
    const amberIndicators = indicators.filter(i => i.status.level === 'amber');
    
    return [
      ...redIndicators.slice(0, 2).map(i => ({
        name: i.name,
        level: 'critical' as const
      })),
      ...amberIndicators.slice(0, 3 - redIndicators.length).map(i => ({
        name: i.name,
        level: 'warning' as const
      }))
    ];
  };
  
  const riskLevel = calculateRiskLevel();
  const timeToAct = calculateTimeToAct();
  const keyChanges = getKeyChanges();
  
  const getRiskColor = (level: number) => {
    if (level <= 3) return 'text-green-400';
    if (level <= 6) return 'text-amber-400';
    return 'text-red-400';
  };
  
  return (
    <div className="bg-[#111111] rounded-2xl border border-[#1A1A1A] p-8">
      <h3 className="text-lg font-semibold text-white mb-6">Your Status</h3>
      
      {/* Risk Level */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm text-gray-400">Overall Risk</span>
          <div className={cn('text-4xl font-bold', getRiskColor(riskLevel))}>
            {riskLevel}/10
          </div>
        </div>
        
        {/* Simple progress bar */}
        <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              riskLevel <= 3 && 'bg-green-400',
              riskLevel > 3 && riskLevel <= 6 && 'bg-amber-400',
              riskLevel > 6 && 'bg-red-400'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${riskLevel * 10}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
      
      {/* Time to Act */}
      <div className="bg-[#0A0A0A] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Time to Act</span>
          </div>
          <span className={cn(
            'font-semibold',
            timeToAct === 'No urgent action' ? 'text-gray-300' : 'text-amber-400'
          )}>
            {timeToAct}
          </span>
        </div>
      </div>
      
      {/* Key Changes */}
      {keyChanges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Key Changes</h4>
          <div className="space-y-2">
            {keyChanges.map((change, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm"
              >
                <AlertTriangle className={cn(
                  'w-4 h-4',
                  change.level === 'critical' ? 'text-red-400' : 'text-amber-400'
                )} />
                <span className="text-gray-400">{change.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Current Phase */}
      <div className="mt-6 pt-6 border-t border-[#1A1A1A]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Current Phase</span>
          <span className="font-medium text-white">Phase {currentPhase?.number || 0}</span>
        </div>
      </div>
    </div>
  );
};