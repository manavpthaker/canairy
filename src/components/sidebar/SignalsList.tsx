import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useStore } from '../../store';
import { getSignalHeadline, INDICATOR_TRANSLATIONS } from '../../data/indicatorTranslations';

interface Signal {
  id: string;
  headline: string;
  source: string;
  url: string;  // Required - every signal must link to source
  trend?: 'up' | 'down' | 'neutral';
  timestamp?: string;
}

// Source URLs for indicators
const SOURCE_URLS: Record<string, string> = {
  // Economy
  econ_01_treasury_tail: 'https://www.treasury.gov/resource-center/data-chart-center/interest-rates/Pages/TextView.aspx?data=yield',
  econ_02_grocery_cpi: 'https://www.bls.gov/cpi/',
  econ_03_stock_volatility: 'https://www.nyse.com/market-data',
  econ_04_corporate_spreads: 'https://fred.stlouisfed.org/series/BAMLC0A0CM',
  econ_05_bank_cds: 'https://fred.stlouisfed.org/series/BAMLC0A0CM',
  // Supply chain
  supply_chain_container: 'https://fbx.freightos.com/',
  supply_chain_semiconductor: 'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/',
  supply_chain_drug: 'https://www.accessdata.fda.gov/scripts/drugshortages/',
  // Geopolitical
  taiwan_pla: 'https://www.reuters.com/world/asia-pacific/',
  taiwan_adiz: 'https://www.mnd.gov.tw/english/',
  hormuz_insurance: 'https://www.lloyds.com/news-and-insights/risk-reports',
  // Infrastructure
  grid_frequency: 'https://www.eia.gov/electricity/gridmonitor/dashboard/electric_overview/US48/US48',
  grid_reserve: 'https://www.nerc.com/pa/RAPA/ri/Pages/default.aspx',
  cyber_cisa: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
  // Health
  health_cdc: 'https://www.cdc.gov/surveillance/index.html',
  health_who: 'https://www.who.int/emergencies/disease-outbreak-news',
  // Default fallbacks by source
  BLS: 'https://www.bls.gov/',
  Treasury: 'https://www.treasury.gov/',
  Fed: 'https://www.federalreserve.gov/',
  CISA: 'https://www.cisa.gov/',
  CDC: 'https://www.cdc.gov/',
  WHO: 'https://www.who.int/',
  EIA: 'https://www.eia.gov/',
  Reuters: 'https://www.reuters.com/',
  Bloomberg: 'https://www.bloomberg.com/markets',
  AP: 'https://apnews.com/',
  NYSE: 'https://www.nyse.com/market-data',
};

// Get URL for a signal based on indicator ID or source name
const getSignalUrl = (indicatorId: string, source: string): string => {
  // Try indicator-specific URL first
  if (SOURCE_URLS[indicatorId]) {
    return SOURCE_URLS[indicatorId];
  }
  // Fall back to source-based URL
  if (SOURCE_URLS[source]) {
    return SOURCE_URLS[source];
  }
  // Default fallback
  return 'https://www.reuters.com/';
};

export const SignalsList: React.FC = () => {
  const { indicators } = useStore();

  // Generate signals from indicator changes using news-style headlines
  const generateSignals = (): Signal[] => {
    const signals: Signal[] = [];

    // Get red indicators first (most urgent)
    const redIndicators = indicators.filter(i => i.status.level === 'red');
    const amberIndicators = indicators.filter(i => i.status.level === 'amber');

    // Generate news-style headlines for red indicators
    redIndicators.slice(0, 3).forEach(ind => {
      const translation = INDICATOR_TRANSLATIONS[ind.id];
      const source = translation?.sourceAbbrev || ind.domain.replace('_', ' ');
      signals.push({
        id: `red-${ind.id}`,
        headline: getSignalHeadline(ind.id, 'red'),
        source,
        url: getSignalUrl(ind.id, source),
        trend: 'up',
        timestamp: 'Now',
      });
    });

    // Generate news-style headlines for amber indicators
    amberIndicators.slice(0, 5).forEach(ind => {
      const translation = INDICATOR_TRANSLATIONS[ind.id];
      const source = translation?.sourceAbbrev || ind.domain.replace('_', ' ');
      signals.push({
        id: `amber-${ind.id}`,
        headline: getSignalHeadline(ind.id, 'amber'),
        source,
        url: getSignalUrl(ind.id, source),
        trend: ind.status.trend === 'up' ? 'up' : ind.status.trend === 'down' ? 'down' : 'neutral',
        timestamp: '2h ago',
      });
    });

    // Add contextual signals if we have space
    if (signals.length < 6 && amberIndicators.some(i => i.domain === 'economy')) {
      signals.push({
        id: 'context-economy',
        headline: 'Fed signals interest rate hold through Q2',
        source: 'Bloomberg',
        url: 'https://www.bloomberg.com/markets',
        trend: 'neutral',
        timestamp: '4h ago',
      });
    }

    if (signals.length < 7 && amberIndicators.some(i => i.domain === 'supply_chain')) {
      signals.push({
        id: 'context-supply',
        headline: 'West Coast port talks continue without resolution',
        source: 'AP',
        url: 'https://apnews.com/hub/supply-chain',
        trend: 'neutral',
        timestamp: '6h ago',
      });
    }

    return signals.slice(0, 8);
  };

  const signals = generateSignals();

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-red-400" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-green-400" />;
      default:
        return <Minus className="w-3 h-3 text-olive-tertiary" />;
    }
  };

  if (signals.length === 0) {
    return (
      <div className="text-center py-4 text-olive-tertiary text-sm">
        No active signals
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {signals.map((signal, index) => (
        <motion.a
          key={signal.id}
          href={signal.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="block py-3 border-b border-white/5 group cursor-pointer"
        >
          <div className="flex items-start gap-2">
            <div className="mt-1 flex-shrink-0">
              {getTrendIcon(signal.trend)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-olive-primary leading-snug group-hover:text-amber-400 transition-colors">
                {signal.headline}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-olive-tertiary">{signal.source}</span>
                {signal.timestamp && (
                  <>
                    <span className="text-olive-muted">·</span>
                    <span className="text-xs font-mono text-olive-muted">{signal.timestamp}</span>
                  </>
                )}
                <ExternalLink className="w-2.5 h-2.5 text-olive-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </div>
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
};
