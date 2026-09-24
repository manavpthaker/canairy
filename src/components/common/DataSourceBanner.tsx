/**
 * DataSourceBanner - says plainly when the page isn't showing current data:
 * either the API is unreachable (we show the last real data this browser
 * loaded, with its age) or the app is running on demo data.
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/cn';

const IS_DEMO = import.meta.env.VITE_USE_MOCK_DATA === 'true';

interface DataSourceBannerProps {
  isUsingFallback: boolean;
  lastSuccessfulFetch?: Date | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const DataSourceBanner: React.FC<DataSourceBannerProps> = ({
  isUsingFallback,
  lastSuccessfulFetch,
  onRetry,
  isRetrying = false,
  className,
}) => {
  if (!isUsingFallback) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        role="alert"
        aria-live="polite"
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl',
          'bg-amber-500/10 border border-amber-500/20',
          className
        )}
      >
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" aria-hidden="true" />

        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-200">
            {IS_DEMO ? (
              <>
                <span className="font-medium">Demo data</span>
                <span className="text-amber-200/70"> — these are sample values, not real readings</span>
              </>
            ) : (
              <>
                <span className="font-medium">Can't reach Canairy right now</span>
                <span className="text-amber-200/70">
                  {lastSuccessfulFetch
                    ? ` — showing the data you last loaded ${formatDistanceToNow(lastSuccessfulFetch, { addSuffix: true })}`
                    : ' — try again in a minute'}
                </span>
              </>
            )}
          </p>
        </div>

        {onRetry && !IS_DEMO && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
              'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30',
              'transition-colors focus-visible:ring-2 focus-visible:ring-amber-400',
              isRetrying && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={isRetrying ? 'Retrying...' : 'Retry loading live data'}
          >
            <RefreshCw
              className={cn('w-4 h-4', isRetrying && 'animate-spin')}
              aria-hidden="true"
            />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default DataSourceBanner;
