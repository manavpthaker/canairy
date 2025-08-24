import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Clock, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge, StatusBadge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { IndicatorData } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface IndicatorCardProps {
  indicator: IndicatorData;
  onClick?: () => void;
  compact?: boolean;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({
  indicator,
  onClick,
  compact = false,
}) => {
  const { status, name, domain, unit, dataSource, critical, greenFlag } = indicator;
  
  const getTrendIcon = () => {
    if (!status.trend) return <Minus className="w-4 h-4" />;
    return status.trend === 'up' ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getStatusGlow = () => {
    switch (status.level) {
      case 'green':
        return 'glow-success';
      case 'amber':
        return 'glow-warning';
      case 'red':
        return critical ? 'glow-danger animate-pulse-danger' : 'glow-danger';
      default:
        return '';
    }
  };

  const getDataSourceIcon = () => {
    switch (status.dataSource) {
      case 'LIVE':
        return <Database className="w-3 h-3" />;
      case 'MANUAL':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -2, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ duration: 0.3 }}
    >
      <Card
        interactive
        onClick={onClick}
        className={cn(
          'relative overflow-hidden',
          getStatusGlow(),
          compact && 'p-3'
        )}
      >
        {/* Critical indicator badge */}
        {critical && (
          <div className="absolute top-2 right-2">
            <Badge variant="red" size="sm">
              CRITICAL
            </Badge>
          </div>
        )}

        {/* Green flag indicator */}
        {greenFlag && (
          <div className="absolute top-2 right-2">
            <Badge variant="green" size="sm">
              POSITIVE
            </Badge>
          </div>
        )}

        <CardHeader className={compact ? 'pb-2' : ''}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className={cn('flex items-center gap-2', compact && 'text-base')}>
                {name}
                {status.trend && (
                  <span
                    className={cn(
                      'text-sm',
                      status.trend === 'up' && !greenFlag ? 'text-bunker-danger' : '',
                      status.trend === 'down' && !greenFlag ? 'text-bunker-success' : '',
                      status.trend === 'up' && greenFlag ? 'text-bunker-success' : '',
                      status.trend === 'down' && greenFlag ? 'text-bunker-danger' : ''
                    )}
                  >
                    {getTrendIcon()}
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" size="sm">
                  {domain.replace('_', ' ').toUpperCase()}
                </Badge>
                {getDataSourceIcon() && (
                  <span className="flex items-center gap-1 text-xs text-bunker-secondary">
                    {getDataSourceIcon()}
                    {status.dataSource}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className={compact ? 'py-2' : ''}>
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="text-2xl font-bold font-mono">
                {typeof status.value === 'number' 
                  ? status.value.toLocaleString()
                  : status.value}
              </div>
              <div className="text-sm text-bunker-secondary">{unit}</div>
            </div>
            <StatusBadge level={status.level} size={compact ? 'sm' : 'md'} />
          </div>
        </CardContent>

        {!compact && (
          <CardFooter className="border-t border-bunker-border pt-3">
            <div className="flex items-center gap-1 text-xs text-bunker-secondary">
              <Clock className="w-3 h-3" />
              <span>
                Updated {formatDistanceToNow(new Date(status.lastUpdate), { addSuffix: true })}
              </span>
            </div>
          </CardFooter>
        )}

        {/* Status color bar */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 h-1',
            status.level === 'green' && 'bg-bunker-success',
            status.level === 'amber' && 'bg-bunker-warning',
            status.level === 'red' && 'bg-bunker-danger',
            status.level === 'unknown' && 'bg-bunker-secondary'
          )}
        />
      </Card>
    </motion.div>
  );
};