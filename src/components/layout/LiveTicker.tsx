import React, { useMemo } from 'react';
import { useStore, selectActionProtocolActive } from '../../store';
import { cn } from '../../utils/cn';

interface TickerItem {
  text: string;
  urgency: 'high' | 'medium' | 'low';
}

export const LiveTicker: React.FC<{ className?: string }> = ({ className }) => {
  const { indicators } = useStore();
  const actionProtocolActive = useStore(selectActionProtocolActive);

  const items = useMemo((): TickerItem[] => {
    const result: TickerItem[] = [];

    if (actionProtocolActive) {
      const redCount = indicators.filter(i => i.status.level === 'red').length;
      result.push({ text: `ACTION PROTOCOL ACTIVE — ${redCount} indicators at red`, urgency: 'high' });
    }

    indicators.filter(i => i.status.level === 'red' && i.enabled !== false).forEach(ind => {
      result.push({ text: `${ind.name}: ${ind.status.value} ${ind.unit} — RED`, urgency: 'high' });
    });

    indicators.filter(i => i.status.level === 'amber' && i.status.trend === 'up' && i.enabled !== false).forEach(ind => {
      result.push({ text: `${ind.name}: ${ind.status.value} ${ind.unit} — rising`, urgency: 'medium' });
    });

    indicators.filter(i => i.status.level === 'amber' && i.status.trend !== 'up' && i.enabled !== false).slice(0, 3).forEach(ind => {
      result.push({ text: `${ind.name}: ${ind.status.value} ${ind.unit}`, urgency: 'low' });
    });

    if (result.length === 0) {
      const greenCount = indicators.filter(i => i.status.level === 'green' && i.enabled !== false).length;
      result.push({ text: `All clear — ${greenCount} indicators green`, urgency: 'low' });
    }

    return result;
  }, [indicators, actionProtocolActive]);

  if (items.length === 0) return null;

  const totalChars = items.reduce((sum, item) => sum + item.text.length, 0);
  const duration = Math.max(20, totalChars * 0.15);

  const urgencyColor = (urgency: TickerItem['urgency']) => {
    switch (urgency) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-white/40';
    }
  };

  const urgencyDot = (urgency: TickerItem['urgency']) => {
    switch (urgency) {
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-amber-400';
      case 'low': return 'bg-white/20';
    }
  };

  const tickerContent = items.map((item, i) => (
    <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap px-4">
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', urgencyDot(item.urgency))} />
      <span className={cn('text-xs font-medium', urgencyColor(item.urgency))}>{item.text}</span>
      {i < items.length - 1 && <span className="text-white/10 ml-4">•</span>}
    </span>
  ));

  return (
    <div className={cn('h-8 bg-[#0E0E10]/95 backdrop-blur-xl border-b border-white/[0.04] overflow-hidden', className)}>
      <div
        className="ticker-scroll flex items-center h-full"
        style={{ '--ticker-duration': `${duration}s` } as React.CSSProperties}
        onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
      >
        {tickerContent}
        {tickerContent}
      </div>
    </div>
  );
};
