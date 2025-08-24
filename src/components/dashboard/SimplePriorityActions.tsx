import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2,
  Package,
  DollarSign,
  Zap,
  Shield,
  Users,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';

interface Action {
  id: string;
  title: string;
  description: string;
  urgency: 'immediate' | 'soon' | 'monitor';
  icon: React.ComponentType<any>;
}

export const SimplePriorityActions: React.FC = () => {
  const { indicators, currentPhase } = useStore();
  
  const generateActions = (): Action[] => {
    const actions: Action[] = [];
    const redIndicators = indicators.filter(i => i.status.level === 'red');
    const criticalReds = redIndicators.filter(i => i.critical);
    
    // Priority actions based on red indicators
    if (redIndicators.some(i => i.domain === 'energy')) {
      actions.push({
        id: 'energy-1',
        title: 'Check Energy Backup',
        description: 'Test generators and verify fuel reserves',
        urgency: criticalReds.some(i => i.domain === 'energy') ? 'immediate' : 'soon',
        icon: Zap
      });
    }
    
    if (redIndicators.some(i => i.domain === 'economy') || redIndicators.length >= 2) {
      actions.push({
        id: 'financial-1',
        title: 'Review Finances',
        description: 'Increase cash reserves and reduce debt exposure',
        urgency: redIndicators.length >= 3 ? 'immediate' : 'soon',
        icon: DollarSign
      });
    }
    
    if (redIndicators.length >= 2 || currentPhase?.number >= 3) {
      actions.push({
        id: 'supply-1',
        title: 'Stock Essentials',
        description: 'Ensure 2-week supply of food, water, and medications',
        urgency: redIndicators.length >= 3 ? 'immediate' : 'soon',
        icon: Package
      });
    }
    
    if (redIndicators.some(i => i.domain === 'global_conflict')) {
      actions.push({
        id: 'security-1',
        title: 'Update Security',
        description: 'Review emergency contacts and evacuation routes',
        urgency: 'soon',
        icon: Shield
      });
    }
    
    // Always show at least one action
    if (actions.length === 0) {
      actions.push({
        id: 'monitor-1',
        title: 'Maintain Readiness',
        description: 'Continue monitoring and update emergency plans',
        urgency: 'monitor',
        icon: CheckCircle2
      });
    }
    
    // Sort by urgency
    const urgencyOrder = { immediate: 0, soon: 1, monitor: 2 };
    return actions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]).slice(0, 4);
  };
  
  const actions = generateActions();
  
  const getUrgencyStyle = (urgency: Action['urgency']) => {
    switch (urgency) {
      case 'immediate':
        return 'bg-red-500/10 text-red-400 border-[#1A1A1A]';
      case 'soon':
        return 'bg-amber-500/10 text-amber-400 border-[#1A1A1A]';
      case 'monitor':
        return 'bg-[#0A0A0A] text-gray-400 border-[#1A1A1A]';
    }
  };
  
  const getUrgencyLabel = (urgency: Action['urgency']) => {
    switch (urgency) {
      case 'immediate':
        return 'Do today';
      case 'soon':
        return 'This week';
      case 'monitor':
        return 'Ongoing';
    }
  };
  
  return (
    <div className="bg-[#111111] rounded-2xl border border-[#1A1A1A] p-8">
      <h3 className="text-lg font-semibold text-white mb-6">Priority Actions</h3>
      
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "group relative rounded-xl border p-4 cursor-pointer transition-all hover:border-[#2A2A2A]",
              getUrgencyStyle(action.urgency)
            )}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                <action.icon className="w-5 h-5" />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-white">
                    {action.title}
                  </h4>
                  <span className="text-xs font-medium px-2 py-1 bg-[#1A1A1A] rounded">
                    {getUrgencyLabel(action.urgency)}
                  </span>
                </div>
                <p className="text-sm mt-1 text-gray-400">
                  {action.description}
                </p>
              </div>
              
              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* View All Link */}
      <div className="mt-6 text-center">
        <button className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          View all recommendations →
        </button>
      </div>
    </div>
  );
};