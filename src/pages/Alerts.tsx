import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Zap,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { DOMAIN_META } from '../types';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';

type AlertFilter = 'all' | 'critical' | 'warning' | 'info';

interface AlertItem {
  id: string;
  type: 'red_threshold' | 'tighten_up' | 'phase_change' | 'trend_warning';
  indicatorId?: string;
  indicatorName?: string;
  domain?: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
}

export const Alerts: React.FC = () => {
  const { indicators } = useStore();
  const [filter, setFilter] = useState<AlertFilter>('all');

  // Generate alerts from live indicator data
  const alerts = useMemo(() => {
    const items: AlertItem[] = [];
    const now = new Date().toISOString();

    // Tighten-up protocol
    const redCount = indicators.filter(i => i.status.level === 'red').length;
    if (redCount >= 2) {
      items.push({
        id: 'tighten-up',
        type: 'tighten_up',
        message: `TIGHTEN-UP protocol active — ${redCount} indicators at RED. Execute 48-hour checklist.`,
        severity: 'critical',
        timestamp: now,
      });
    }

    // Red threshold alerts
    indicators
      .filter(i => i.status.level === 'red')
      .forEach(ind => {
        items.push({
          id: `red-${ind.id}`,
          type: 'red_threshold',
          indicatorId: ind.id,
          indicatorName: ind.name,
          domain: ind.domain,
          message: `${ind.name} has breached the RED threshold (${typeof ind.status.value === 'number' ? ind.status.value.toFixed(1) : ind.status.value} ${ind.unit})`,
          severity: ind.critical ? 'critical' : 'warning',
          timestamp: ind.status.lastUpdate,
        });
      });

    // Amber warnings
    indicators
      .filter(i => i.status.level === 'amber')
      .forEach(ind => {
        items.push({
          id: `amber-${ind.id}`,
          type: 'trend_warning',
          indicatorId: ind.id,
          indicatorName: ind.name,
          domain: ind.domain,
          message: `${ind.name} at AMBER — approaching red threshold`,
          severity: 'info',
          timestamp: ind.status.lastUpdate,
        });
      });

    // Sort: critical first, then by timestamp
    items.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return items;
  }, [indicators]);

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <Zap className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'info': return <Info className="w-5 h-5 text-blue-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500';
      case 'warning': return 'border-l-amber-500';
      case 'info': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#1A1A1A]">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">Alerts</h1>
              <p className="text-gray-400 mt-1">Real-time alerts generated from indicator thresholds</p>
            </div>
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-gray-300 rounded-lg hover:bg-[#2A2A2A] transition-colors text-sm font-medium"
            >
              <Bell className="w-4 h-4" />
              Notification Settings
            </Link>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-[#0A0A0A] rounded-xl border border-red-500/10 p-3 sm:p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
            <div className="bg-[#0A0A0A] rounded-xl border border-amber-500/10 p-3 sm:p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{warningCount}</div>
              <div className="text-xs text-gray-500">Warnings</div>
            </div>
            <div className="bg-[#0A0A0A] rounded-xl border border-blue-500/10 p-3 sm:p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{infoCount}</div>
              <div className="text-xs text-gray-500">Monitoring</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg p-1 w-fit overflow-x-auto">
            {(['all', 'critical', 'warning', 'info'] as AlertFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                  filter === f ? 'bg-[#0A0A0A] text-white' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  'bg-[#111111] rounded-xl border border-[#1A1A1A] border-l-4 p-4 sm:p-5',
                  getSeverityBorder(alert.severity)
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{alert.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {alert.domain && (
                        <span className="text-xs text-gray-500">
                          {DOMAIN_META[alert.domain as keyof typeof DOMAIN_META]?.label ?? alert.domain}
                        </span>
                      )}
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {alert.indicatorId && (
                    <Link
                      to={`/indicator/${alert.indicatorId}`}
                      className="flex-shrink-0 p-2 text-gray-500 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">All Clear</h3>
            <p className="text-gray-400">No alerts match this filter</p>
          </div>
        )}
      </div>
    </>
  );
};
