import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { useStore } from '../../store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555/api/v1';

// Source URLs for indicators - link to specific data/news pages
export const SOURCE_URLS: Record<string, string> = {
  // Economy
  econ_01_treasury_tail: 'https://www.treasurydirect.gov/auctions/auction-query/',
  econ_02_grocery_cpi: 'https://www.bls.gov/news.release/cpi.nr0.htm',
  market_01_intraday_swing: 'https://finance.yahoo.com/quote/%5ETNX/',
  green_g1_gdp_rates: 'https://www.bea.gov/data/gdp/gross-domestic-product',
  luxury_01_collapse: 'https://www.bloomberg.com/markets/sectors/consumer-discretionary',

  // Global Conflict
  taiwan_pla_activity: 'https://www.mnd.gov.tw/english/',
  taiwan_exclusion_zone: 'https://www.mnd.gov.tw/english/',
  global_conflict_intensity: 'https://acleddata.com/dashboard/',
  nato_high_readiness: 'https://www.nato.int/cps/en/natohq/news.htm',
  russia_nato_escalation: 'https://www.reuters.com/world/europe/',
  nuclear_01_tests: 'https://www.ctbto.org/specials/testing-times/',
  defense_spending_growth: 'https://www.sipri.org/databases/milex',
  hormuz_war_risk: 'https://www.lloyds.com/market-resources/marine',

  // Domestic Control
  ice_detention_surge: 'https://trac.syr.edu/immigration/detentionstats/',
  dhs_removal_expansion: 'https://www.federalregister.gov/agencies/homeland-security-department',
  national_guard_metros: 'https://www.nationalguard.mil/News/',
  hill_control_legislation: 'https://www.congress.gov/',

  // Security & Infrastructure
  cyber_01_cisa_kev: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
  cyber_02_ai_ransomware: 'https://www.cisa.gov/stopransomware/ransomware-alerts',
  grid_01_pjm_outages: 'https://www.oe.energy.gov/oe417.htm',
  bio_01_h2h_countries: 'https://www.who.int/emergencies/disease-outbreak-news',

  // Oil Axis
  oil_01_russian_brics: 'https://energyandcleanair.org/russia-fossil-tracker/',
  oil_02_mbridge_settlements: 'https://www.bis.org/about/bisih/topics/cbdc/mbridge.htm',
  oil_03_jodi_inventory: 'https://www.jodidata.org/oil/',
  oil_04_refinery_ratio: 'https://www.jodidata.org/oil/',
  spr_01_level: 'https://www.eia.gov/petroleum/supply/weekly/',
  ofac_01_designations: 'https://ofac.treasury.gov/recent-actions',

  // AI Window
  compute_01_training_cost: 'https://epochai.org/trends',
  labor_ai_01_layoffs: 'https://layoffs.fyi/',
  info_02_deepfake_shocks: 'https://www.sec.gov/news/market-alerts',

  // Jobs & Labor
  job_01_jobless_claims: 'https://www.dol.gov/ui/data.pdf',
  job_01_strike_days: 'https://striketracker.ilr.cornell.edu/',
  supply_pharmacy_shortage: 'https://www.accessdata.fda.gov/scripts/drugshortages/',

  // Rights & Governance
  power_01_ai_surveillance: 'https://legiscan.com/gaits/search',
  civil_01_acled_protests: 'https://acleddata.com/data-export-tool/',
  power_02_dod_autonomy: 'https://www.cbo.gov/topics/defense-and-national-security',
  liberty_01_litigation: 'https://www.aclu.org/court-cases',

  // Social Cohesion
  education_01_closures: 'https://nces.ed.gov/',

  // Default fallbacks by source
  BLS: 'https://www.bls.gov/news.release/',
  Treasury: 'https://www.treasury.gov/resource-center/',
  Fed: 'https://www.federalreserve.gov/newsevents.htm',
  CISA: 'https://www.cisa.gov/news-events/alerts',
  CDC: 'https://www.cdc.gov/media/',
  WHO: 'https://www.who.int/emergencies/disease-outbreak-news',
  EIA: 'https://www.eia.gov/petroleum/weekly/',
  Reuters: 'https://www.reuters.com/',
  Bloomberg: 'https://www.bloomberg.com/markets',
  AP: 'https://apnews.com/',
  NYSE: 'https://www.nyse.com/market-data',
  ACLED: 'https://acleddata.com/',
  NATO: 'https://www.nato.int/cps/en/natohq/news.htm',
  DOL: 'https://www.dol.gov/newsroom/',
  TRAC: 'https://trac.syr.edu/immigration/',
};

interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  source: string;
  published?: string;
}

// Get categories based on elevated indicators
const getCategories = (indicators: any[]): string => {
  const redIndicators = indicators.filter(i => i.status.level === 'red');
  const amberIndicators = indicators.filter(i => i.status.level === 'amber');
  const elevatedDomains = new Set([
    ...redIndicators.map(i => i.domain),
    ...amberIndicators.map(i => i.domain),
  ]);

  const categories: string[] = ['breaking'];

  if (elevatedDomains.has('economy') || elevatedDomains.has('jobs_labor')) {
    categories.push('economy');
  }
  if (elevatedDomains.has('security_infrastructure')) {
    categories.push('security');
  }
  if (elevatedDomains.has('global_conflict') || elevatedDomains.has('travel_mobility')) {
    categories.push('world', 'conflict');
  }

  return categories.join(',');
};

// Format relative time
const formatTimeAgo = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
};

export const SignalsList: React.FC = () => {
  const { indicators } = useStore();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const categories = getCategories(indicators);
      const response = await fetch(`${API_BASE_URL}/news/?categories=${categories}`);

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setArticles(data);
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Could not load news');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Refresh every 10 minutes
    const interval = setInterval(fetchNews, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [indicators.length]);

  if (loading && articles.length === 0) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-white/5 rounded w-full mb-1" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="w-5 h-5 text-olive-tertiary mx-auto mb-2" />
        <p className="text-xs text-olive-tertiary">{error}</p>
        <button
          onClick={fetchNews}
          className="mt-2 text-xs text-olive-secondary hover:text-amber-400 flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-4 text-olive-tertiary text-sm">
        No news available
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {articles.slice(0, 8).map((article, index) => (
        <motion.a
          key={`${article.url}-${index}`}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          className="block py-2.5 border-b border-white/5 group cursor-pointer"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-olive-primary leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">
                {article.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-olive-tertiary truncate max-w-[100px]">
                  {article.source}
                </span>
                {article.published && (
                  <>
                    <span className="text-olive-muted text-[10px]">·</span>
                    <span className="text-[10px] text-olive-muted">
                      {formatTimeAgo(article.published)}
                    </span>
                  </>
                )}
                <ExternalLink className="w-2.5 h-2.5 text-olive-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" />
              </div>
            </div>
          </div>
        </motion.a>
      ))}

      {/* Refresh button */}
      <div className="pt-3 flex items-center justify-center gap-2">
        <button
          onClick={fetchNews}
          disabled={loading}
          className="text-[10px] text-olive-muted hover:text-olive-secondary flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};
