import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Activity,
  Zap,
  ChevronRight,
  ChevronDown,
  Timer,
  Database,
  Wifi
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';

type ThreatLevel = 'normal' | 'elevated' | 'high' | 'critical';

export const SituationalStatusBar: React.FC = () => {
  const { indicators, hopiScore, currentPhase } = useStore();
  const [, setCurrentTime] = useState(new Date());
  const [mobileExpanded, setMobileExpanded] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate threat level
  const getThreatLevel = (): ThreatLevel => {
    const redCount = indicators.filter(i => i.status.level === 'red').length;
    const criticalReds = indicators.filter(i => i.status.level === 'red' && i.critical).length;
    const amberCount = indicators.filter(i => i.status.level === 'amber').length;

    if (criticalReds > 0 || redCount >= 3) return 'critical';
    if (redCount >= 2) return 'high';
    if (redCount > 0 || amberCount >= 3) return 'elevated';
    return 'normal';
  };

  // Get time to act
  const getTimeToAct = (): string => {
    const criticalCount = indicators.filter(i => i.status.level === 'red' && i.critical).length;
    const redCount = indicators.filter(i => i.status.level === 'red').length;

    if (criticalCount > 0) return '24-48 hours';
    if (redCount >= 2) return '2-3 days';
    if (redCount > 0) return '1 week';
    return 'No urgency';
  };

  // Get data freshness
  const getDataFreshness = (): { text: string; quality: 'good' | 'stale' | 'poor' } => {
    if (!indicators.length) return { text: 'No data', quality: 'poor' };

    const latestUpdate = Math.max(...indicators.map(i => new Date(i.status.lastUpdate).getTime()));
    const minutesAgo = Math.floor((Date.now() - latestUpdate) / 60000);

    if (minutesAgo < 5) return { text: `${minutesAgo}m ago`, quality: 'good' };
    if (minutesAgo < 30) return { text: `${minutesAgo}m ago`, quality: 'stale' };
    return { text: '30+ min ago', quality: 'poor' };
  };

  // Calculate indicator counts
  const indicatorCounts = {
    red: indicators.filter(i => i.status.level === 'red').length,
    amber: indicators.filter(i => i.status.level === 'amber').length,
    green: indicators.filter(i => i.status.level === 'green').length,
  };

  const threatLevel = getThreatLevel();
  const timeToAct = getTimeToAct();
  const dataFreshness = getDataFreshness();

  const getThreatLevelConfig = (level: ThreatLevel) => {
    switch (level) {
      case 'critical':
        return {
          label: 'CRITICAL',
          labelFull: 'CRITICAL THREAT',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10 border-red-500/30',
          icon: AlertCircle,
          pulse: true
        };
      case 'high':
        return {
          label: 'HIGH',
          labelFull: 'HIGH THREAT',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10 border-red-500/30',
          icon: AlertCircle,
          pulse: false
        };
      case 'elevated':
        return {
          label: 'ELEVATED',
          labelFull: 'ELEVATED THREAT',
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10 border-amber-500/30',
          icon: Shield,
          pulse: false
        };
      case 'normal':
        return {
          label: 'NORMAL',
          labelFull: 'NORMAL STATUS',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10 border-green-500/30',
          icon: Shield,
          pulse: false
        };
    }
  };

  const threatConfig = getThreatLevelConfig(threatLevel);
  const ThreatIcon = threatConfig.icon;

  const getHOPITrend = () => {
    const redCount = indicators.filter(i => i.status.level === 'red').length;
    const amberCount = indicators.filter(i => i.status.level === 'amber').length;
    const deterioratingCount = indicators.filter(i =>
      (i.status.trend === 'up' && !i.greenFlag) ||
      (i.status.trend === 'down' && i.greenFlag)
    ).length;

    const trend = deterioratingCount > indicators.length / 3 ? 'up' :
                  (redCount + amberCount > 0 ? 'stable' : 'down');

    if (trend === 'stable') {
      return {
        trend: 'stable',
        icon: Minus,
        color: 'text-gray-400'
      };
    }

    return {
      trend,
      icon: trend === 'up' ? TrendingUp : TrendingDown,
      color: trend === 'up' ? 'text-red-400' : 'text-green-400'
    };
  };

  const hopiTrend = getHOPITrend();
  const HOPITrendIcon = hopiTrend.icon;

  // Get data source status
  const getDataSourceStatus = () => {
    const mockCount = indicators.filter(i => i.dataSource === 'MOCK').length;
    const liveCount = indicators.filter(i => i.dataSource === 'LIVE').length;
    const isAllMock = mockCount === indicators.length && indicators.length > 0;

    if (isAllMock) return { type: 'mock' as const, text: 'Demo', color: 'text-amber-400' };
    if (mockCount > 0) return { type: 'partial' as const, text: 'Partial', color: 'text-amber-400', live: liveCount, mock: mockCount };
    return { type: 'live' as const, text: 'Live', color: 'text-green-400' };
  };

  const dataSource = getDataSourceStatus();

  return (
    <div className="w-full">
      {/* Mobile: Compact view with expand */}
      <div className="xl:hidden">
        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="w-full flex items-center justify-between gap-2"
        >
          {/* Threat Badge */}
          <motion.div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
              threatConfig.bgColor,
              threatConfig.color,
              threatConfig.pulse && "animate-pulse"
            )}
            animate={threatConfig.pulse ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ThreatIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{threatConfig.labelFull}</span>
            <span className="sm:hidden">{threatConfig.label}</span>
          </motion.div>

          {/* Quick stats */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white font-mono text-xs sm:text-sm">
              {hopiScore?.score?.toFixed(1) || 'N/A'}/10
            </span>
            <div className="flex items-center gap-1">
              {indicatorCounts.red > 0 && (
                <div className="w-2 h-2 bg-red-500 rounded-full" title={`${indicatorCounts.red} red`} />
              )}
              {indicatorCounts.amber > 0 && (
                <div className="w-2 h-2 bg-amber-500 rounded-full" title={`${indicatorCounts.amber} amber`} />
              )}
              <div className="w-2 h-2 bg-green-500 rounded-full" title={`${indicatorCounts.green} green`} />
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              mobileExpanded && "rotate-180"
            )} />
          </div>
        </button>

        {/* Expanded mobile details */}
        <AnimatePresence>
          {mobileExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-[#1A1A1A] grid grid-cols-2 gap-3 text-sm">
                {/* Phase */}
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-white">Phase {currentPhase?.number || 0}</span>
                </div>

                {/* HOPI */}
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-mono">{hopiScore?.score?.toFixed(1) || 'N/A'}/10</span>
                  <HOPITrendIcon className={cn("w-3 h-3", hopiTrend.color)} />
                </div>

                {/* Indicator counts */}
                <div className="flex items-center gap-3">
                  {indicatorCounts.red > 0 && (
                    <span className="text-red-400">{indicatorCounts.red} RED</span>
                  )}
                  {indicatorCounts.amber > 0 && (
                    <span className="text-amber-400">{indicatorCounts.amber} AMBER</span>
                  )}
                  <span className="text-green-400">{indicatorCounts.green} GREEN</span>
                </div>

                {/* Data freshness */}
                <div className={cn(
                  "flex items-center gap-1",
                  dataFreshness.quality === 'good' ? "text-green-400" :
                  dataFreshness.quality === 'stale' ? "text-amber-400" : "text-red-400"
                )}>
                  <Database className="w-4 h-4" />
                  <span>{dataFreshness.text}</span>
                </div>

                {/* Time to act */}
                {timeToAct !== 'No urgency' && (
                  <div className="col-span-2 flex items-center gap-2">
                    <Timer className={cn(
                      "w-4 h-4",
                      timeToAct.includes('24-48') ? "text-red-400" :
                      timeToAct.includes('2-3') ? "text-amber-400" : "text-blue-400"
                    )} />
                    <span className={cn(
                      "font-medium",
                      timeToAct.includes('24-48') ? "text-red-400" :
                      timeToAct.includes('2-3') ? "text-amber-400" : "text-blue-400"
                    )}>
                      Act in {timeToAct}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Full horizontal bar */}
      <div className="hidden xl:flex items-center justify-between w-full">
        {/* Left Side - Threat Status */}
        <div className="flex items-center gap-4">
          {/* Threat Level Badge */}
          <motion.div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
              threatConfig.bgColor,
              threatConfig.color,
              threatConfig.pulse && "animate-pulse"
            )}
            animate={threatConfig.pulse ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ThreatIcon className="w-4 h-4" />
            <span>{threatConfig.labelFull}</span>
          </motion.div>

          {/* Phase Status */}
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-white font-medium">
              Phase {currentPhase?.number || 0}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">3 days</span>
            {threatLevel !== 'normal' && (
              <>
                <ChevronRight className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 text-xs">Phase {(currentPhase?.number || 0) + 1} risk</span>
              </>
            )}
          </div>

          {/* HOPI Score */}
          <div className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-white font-mono">
              {hopiScore?.score?.toFixed(1) || 'N/A'}/10
            </span>
            <HOPITrendIcon className={cn("w-3 h-3", hopiTrend.color)} />
          </div>

          {/* Time to Act */}
          {timeToAct !== 'No urgency' && (
            <div className="flex items-center gap-2 text-sm">
              <Timer className={cn(
                "w-4 h-4",
                timeToAct.includes('24-48') ? "text-red-400" :
                timeToAct.includes('2-3') ? "text-amber-400" : "text-blue-400"
              )} />
              <span className={cn(
                "font-medium",
                timeToAct.includes('24-48') ? "text-red-400" :
                timeToAct.includes('2-3') ? "text-amber-400" : "text-blue-400"
              )}>
                Act in {timeToAct}
              </span>
            </div>
          )}
        </div>

        {/* Center - Stats */}
        <div className="flex items-center gap-6">
          {/* Indicator Counts */}
          <div className="flex items-center gap-3 text-sm">
            {indicatorCounts.red > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-red-400 font-medium">{indicatorCounts.red} RED</span>
              </div>
            )}
            {indicatorCounts.amber > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-amber-400 font-medium">{indicatorCounts.amber} AMBER</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-green-400 font-medium">{indicatorCounts.green} GREEN</span>
            </div>
          </div>

          {/* Data Quality */}
          <div className="flex items-center gap-2 text-sm">
            <div className={cn(
              "flex items-center gap-1",
              dataFreshness.quality === 'good' ? "text-green-400" :
              dataFreshness.quality === 'stale' ? "text-amber-400" : "text-red-400"
            )}>
              <Database className="w-4 h-4" />
              <span>Updated {dataFreshness.text}</span>
            </div>
          </div>
        </div>

        {/* Right Side - System Status */}
        <div className="flex items-center gap-2 text-sm">
          {dataSource.type === 'mock' ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400">
              <Database className="w-4 h-4" />
              <span>Demo Mode</span>
            </div>
          ) : dataSource.type === 'partial' ? (
            <div className="flex items-center gap-1 text-amber-400" title={`${dataSource.live} live, ${dataSource.mock} simulated`}>
              <Wifi className="w-4 h-4" />
              <span>Partial Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-400">
              <Wifi className="w-4 h-4" />
              <span>Live Data</span>
            </div>
          )}
          {threatLevel !== 'normal' && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-xs"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-3 h-3" />
              <span>Enhanced Monitoring</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
