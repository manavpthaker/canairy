import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Shield, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../core/Card';
import { Badge } from '../core/Badge';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';

interface KeyChange {
  indicator: string;
  change: number;
  trend: 'up' | 'down';
  impact: 'positive' | 'negative';
}

export const DecisionSupport: React.FC = () => {
  const { indicators, hopiScore, currentPhase } = useStore();
  
  // Calculate overall risk level (0-10 scale)
  const calculateRiskLevel = (): number => {
    if (!hopiScore) return 5;
    return Math.round(hopiScore.score * 10);
  };
  
  // Determine trend
  const calculateTrend = (): 'improving' | 'stable' | 'worsening' => {
    const redCount = indicators.filter(i => i.status.level === 'red').length;
    const previousRedCount = 1; // In real app, would compare with historical
    
    if (redCount > previousRedCount) return 'worsening';
    if (redCount < previousRedCount) return 'improving';
    return 'stable';
  };
  
  // Calculate time to action
  const calculateTimeToAct = (): string => {
    const criticalCount = indicators.filter(i => i.status.level === 'red' && i.critical).length;
    const redCount = indicators.filter(i => i.status.level === 'red').length;
    
    if (criticalCount > 0) return '24-48 hours';
    if (redCount >= 2) return '48-72 hours';
    if (redCount > 0) return '1 week';
    return 'No urgent action';
  };
  
  // Get key changes
  const getKeyChanges = (): KeyChange[] => {
    // In real app, would calculate actual changes
    return [
      {
        indicator: 'Energy costs',
        change: 15,
        trend: 'up',
        impact: 'negative'
      },
      {
        indicator: 'Global tensions',
        change: 8,
        trend: 'up',
        impact: 'negative'
      },
      {
        indicator: 'Local stability',
        change: 2,
        trend: 'up',
        impact: 'positive'
      }
    ];
  };
  
  const riskLevel = calculateRiskLevel();
  const trend = calculateTrend();
  const timeToAct = calculateTimeToAct();
  const keyChanges = getKeyChanges();
  
  const getRiskColor = (level: number) => {
    if (level <= 3) return 'text-green-400';
    if (level <= 6) return 'text-amber-400';
    return 'text-red-400';
  };
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="w-5 h-5 text-green-400" />;
      case 'worsening':
        return <TrendingUp className="w-5 h-5 text-red-400" />;
      default:
        return <BarChart3 className="w-5 h-5 text-white/30" />;
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader separator>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white/40" />
            Your Resilience Status
          </CardTitle>
          <Badge variant="accent" size="sm">
            Phase {currentPhase?.number || 0}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Risk Level Display */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-sm text-white/30">Overall Risk</span>
              <div className={cn('text-4xl font-bold', getRiskColor(riskLevel))}>
                {riskLevel}/10
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className="text-sm font-medium capitalize">{trend}</span>
            </div>
          </div>
          
          {/* Risk Level Bar */}
          <div className="relative h-3 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                background: `linear-gradient(to right, #10B981, #F59E0B, #EF4444)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${riskLevel * 10}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          
          {/* Risk Labels */}
          <div className="flex justify-between mt-1 text-xs text-white/30">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
          </div>
        </div>
        
        {/* Time to Action */}
        <div className="bg-white/[0.03]/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-white/40" />
              <span className="text-sm text-white/30">Time to Act</span>
            </div>
            <span className={cn(
              'font-bold',
              timeToAct === 'No urgent action' ? 'text-green-400' : 'text-amber-400'
            )}>
              {timeToAct}
            </span>
          </div>
        </div>
        
        {/* Key Changes */}
        <div>
          <h4 className="text-sm font-medium text-white/30 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Key Changes
          </h4>
          <div className="space-y-2">
            {keyChanges.map((change, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-2 bg-white/[0.03]/30 rounded-md"
              >
                <span className="text-sm">{change.indicator}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    change.impact === 'negative' ? 'text-red-400' : 'text-green-400'
                  )}>
                    {change.trend === 'up' ? '+' : '-'}{change.change}%
                  </span>
                  {change.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2 bg-white/10 text-white rounded-md font-medium hover:bg-white/10-light transition-colors"
          >
            View Full Analysis
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2 bg-white/[0.04] text-white border border-white/[0.06] rounded-md font-medium hover:bg-white/[0.08] transition-colors"
          >
            Take Action
          </motion.button>
        </div>
      </CardContent>
    </Card>
  );
};