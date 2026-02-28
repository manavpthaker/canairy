import React from 'react';
import { cn } from '../../utils/cn';
import { AlertLevel } from '../../types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: AlertLevel | 'default' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-2xs',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    };

    const variantClasses = {
      default: 'bg-white/[0.06] text-white/50 border border-white/[0.08]',
      outline: 'bg-transparent text-white/30 border border-white/[0.08]',
      accent: 'bg-white/10 text-white/60 border border-white/[0.12]',
      green: 'badge-success',
      amber: 'badge-warning',
      red: 'badge-danger',
      unknown: 'bg-white/[0.06] text-white/30 border border-white/[0.08]',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'badge',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full mr-1.5',
              variant === 'green' && 'bg-green-400',
              variant === 'amber' && 'bg-amber-400',
              variant === 'red' && 'bg-red-400',
              variant === 'accent' && 'bg-white/40',
              (variant === 'default' || variant === 'outline' || variant === 'unknown') && 'bg-white/30'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

interface StatusBadgeProps {
  level: AlertLevel;
  value?: string | number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  level,
  value,
  showIcon = true,
  size = 'md',
  pulse = false,
}) => {
  return (
    <Badge
      variant={level}
      size={size}
      dot={showIcon}
      className={cn(pulse && level === 'red' && 'animate-pulse')}
    >
      {value || level.toUpperCase()}
    </Badge>
  );
};
