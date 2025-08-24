import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Package, 
  DollarSign,
  Zap,
  Users,
  ChevronRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../core/Card';
import { Badge } from '../core/Badge';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';

interface Action {
  id: string;
  title: string;
  description: string;
  urgency: 'immediate' | 'soon' | 'monitor';
  timeframe: string;
  category: 'supply' | 'financial' | 'energy' | 'security' | 'community';
  icon: React.ComponentType<any>;
  indicators: string[];
  completed?: boolean;
}

export const PriorityActions: React.FC = () => {
  const { indicators, hopiScore, currentPhase } = useStore();
  
  const generateActions = (): Action[] => {
    const actions: Action[] = [];
    const redIndicators = indicators.filter(i => i.status.level === 'red');
    const criticalReds = redIndicators.filter(i => i.critical);
    
    // Energy-related actions
    const energyReds = redIndicators.filter(i => i.domain === 'energy');
    if (energyReds.length > 0) {
      actions.push({
        id: 'energy-1',
        title: 'Review Energy Backup Systems',
        description: 'Test generators, check fuel reserves, verify battery backup systems',
        urgency: criticalReds.some(i => i.domain === 'energy') ? 'immediate' : 'soon',
        timeframe: '24-48 hours',
        category: 'energy',
        icon: Zap,
        indicators: energyReds.map(i => i.name)
      });
    }
    
    // Economic actions
    const economicReds = redIndicators.filter(i => i.domain === 'economy');
    if (economicReds.length > 0 || hopiScore?.score > 0.6) {
      actions.push({
        id: 'financial-1',
        title: 'Secure Financial Position',
        description: 'Increase cash reserves, review investment allocations, reduce debt exposure',
        urgency: economicReds.some(i => i.critical) ? 'immediate' : 'soon',
        timeframe: '1 week',
        category: 'financial',
        icon: DollarSign,
        indicators: economicReds.map(i => i.name)
      });
    }
    
    // Supply chain actions
    if (redIndicators.length >= 2 || currentPhase?.number >= 3) {
      actions.push({
        id: 'supply-1',
        title: 'Stock Essential Supplies',
        description: 'Food (2-week minimum), water (1 gal/person/day), medications, first aid',
        urgency: redIndicators.length >= 3 ? 'immediate' : 'soon',
        timeframe: '48-72 hours',
        category: 'supply',
        icon: Package,
        indicators: ['Multiple system stress']
      });
    }
    
    // Security actions
    const conflictReds = redIndicators.filter(i => i.domain === 'global_conflict');
    if (conflictReds.length > 0) {
      actions.push({
        id: 'security-1',
        title: 'Review Security Measures',
        description: 'Update emergency contacts, review evacuation routes, secure documents',
        urgency: 'soon',
        timeframe: '1 week',
        category: 'security',
        icon: Shield,
        indicators: conflictReds.map(i => i.name)
      });
    }
    
    // Community actions
    if (currentPhase?.number >= 2) {
      actions.push({
        id: 'community-1',
        title: 'Strengthen Community Ties',
        description: 'Connect with neighbors, join local resilience groups, share resources',
        urgency: 'monitor',
        timeframe: '2 weeks',
        category: 'community',
        icon: Users,
        indicators: ['Phase escalation']
      });
    }
    
    // If no red indicators, add monitoring action
    if (redIndicators.length === 0) {
      actions.push({
        id: 'monitor-1',
        title: 'Maintain Readiness',
        description: 'Continue monitoring, update emergency plans, rotate supplies',
        urgency: 'monitor',
        timeframe: 'Ongoing',
        category: 'supply',
        icon: CheckCircle2,
        indicators: ['All systems normal']
      });
    }
    
    // Sort by urgency
    const urgencyOrder = { immediate: 0, soon: 1, monitor: 2 };
    return actions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  };
  
  const actions = generateActions();
  
  const getUrgencyColor = (urgency: Action['urgency']) => {
    switch (urgency) {
      case 'immediate':
        return 'bg-bmb-danger text-white';
      case 'soon':
        return 'bg-bmb-warning text-white';
      case 'monitor':
        return 'bg-bmb-success text-white';
    }
  };
  
  const getCategoryColor = (category: Action['category']) => {
    switch (category) {
      case 'supply':
        return 'text-blue-400';
      case 'financial':
        return 'text-green-400';
      case 'energy':
        return 'text-yellow-400';
      case 'security':
        return 'text-red-400';
      case 'community':
        return 'text-purple-400';
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader separator>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-bmb-accent" />
            Priority Actions
          </CardTitle>
          <Badge variant="accent" size="sm">
            {actions.filter(a => a.urgency !== 'monitor').length} Active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group relative overflow-hidden rounded-lg border transition-all",
                action.completed 
                  ? "border-bmb-border/50 opacity-60" 
                  : "border-bmb-border hover:border-bmb-accent/50 cursor-pointer"
              )}
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-bmb-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-bmb-dark",
                    getCategoryColor(action.category)
                  )}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-bmb-primary group-hover:text-bmb-accent transition-colors">
                        {action.title}
                      </h4>
                      <Badge 
                        size="sm" 
                        className={cn("flex-shrink-0", getUrgencyColor(action.urgency))}
                      >
                        {action.urgency}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-bmb-secondary mb-2">
                      {action.description}
                    </p>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-bmb-secondary">
                        <Clock className="w-3 h-3" />
                        {action.timeframe}
                      </span>
                      <span className="text-bmb-secondary/60">
                        {action.indicators.join(', ')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-bmb-secondary group-hover:text-bmb-accent transition-colors flex-shrink-0" />
                </div>
              </div>
              
              {/* Urgency indicator bar */}
              {action.urgency === 'immediate' && !action.completed && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-bmb-danger"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Action summary */}
        <div className="mt-6 p-4 bg-bmb-black/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-bmb-secondary">
              Based on {indicators.filter(i => i.status.level === 'red').length} red indicators
            </span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-bmb-accent hover:text-bmb-accent-light transition-colors font-medium"
            >
              View All Procedures →
            </motion.button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};