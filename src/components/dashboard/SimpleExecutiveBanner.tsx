import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';

type SystemStatus = 'stable' | 'monitoring' | 'action-required';

export const SimpleExecutiveBanner: React.FC = () => {
  const { indicators } = useStore();
  
  const getSystemStatus = (): { status: SystemStatus; message: string; subtext: string } => {
    const redCount = indicators.filter(i => i.status.level === 'red').length;
    const criticalReds = indicators.filter(i => i.status.level === 'red' && i.critical).length;
    const amberCount = indicators.filter(i => i.status.level === 'amber').length;
    
    if (redCount >= 2 || criticalReds > 0) {
      return {
        status: 'action-required',
        message: 'Action Required',
        subtext: `${redCount} indicators need immediate attention`
      };
    } else if (redCount > 0 || amberCount >= 3) {
      return {
        status: 'monitoring',
        message: 'Enhanced Monitoring',
        subtext: 'Some indicators showing elevated levels'
      };
    } else {
      return {
        status: 'stable',
        message: 'All Systems Normal',
        subtext: 'No significant threats detected'
      };
    }
  };
  
  const { status, message, subtext } = getSystemStatus();
  
  const getStatusIcon = () => {
    switch (status) {
      case 'stable':
        return <CheckCircle className="w-5 h-5" />;
      case 'monitoring':
        return <AlertTriangle className="w-5 h-5" />;
      case 'action-required':
        return <AlertCircle className="w-5 h-5" />;
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'stable':
        return 'text-green-400 border-[#1A1A1A]';
      case 'monitoring':
        return 'text-amber-400 border-[#1A1A1A]';
      case 'action-required':
        return 'text-red-400 border-[#1A1A1A]';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className={cn(
        'bg-[#111111] rounded-2xl border-2 p-6',
        getStatusColor()
      )}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {message}
            </h2>
            <p className="text-sm mt-1 text-gray-400">
              {subtext}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};