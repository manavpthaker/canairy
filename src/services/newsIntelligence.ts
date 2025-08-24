/**
 * @fileoverview News Intelligence Service for Brown Man Bunker
 * Adapted from Hummingbird's NewsIntelligenceEngine
 * Focuses on risk indicators and threat analysis
 */

import { RateLimiter } from './rateLimiter';
import { newsCache } from './newsCache';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: {
    id: string;
    name: string;
  };
  publishedAt: string;
  content: string;
  relevance_score?: number;
  source_credibility?: {
    score: number;
    bias: string;
    specialty?: string;
  };
  indicator_relevance?: string[];
}

interface SourceCredibility {
  score: number;
  bias: string;
  specialty: string;
}

interface IndicatorNewsMapping {
  indicators: string[];
  keywords: string[];
  exclusions: string[];
  sources: string[];
  context: string;
}

export class NewsIntelligenceService {
  private newsApiKey: string | undefined;
  private alphaVantageKey: string | undefined;
  private openaiApiKey: string | undefined;
  
  // Rate limiters for each API
  private newsApiLimiter: RateLimiter;
  private alphaVantageLimiter: RateLimiter;
  
  private sourceCredibility: Record<string, SourceCredibility> = {
    'wsj': { score: 95, bias: 'center-right', specialty: 'business' },
    'reuters': { score: 92, bias: 'center', specialty: 'global_news' },
    'bloomberg': { score: 90, bias: 'center', specialty: 'finance' },
    'ft': { score: 88, bias: 'center-right', specialty: 'business' },
    'cnbc': { score: 75, bias: 'center', specialty: 'markets' },
    'yahoo-finance': { score: 70, bias: 'center', specialty: 'retail_finance' },
    'marketwatch': { score: 72, bias: 'center', specialty: 'markets' },
    'bbc-news': { score: 85, bias: 'center-left', specialty: 'global_news' },
    'cnn': { score: 65, bias: 'left', specialty: 'general_news' },
    'fox-news': { score: 60, bias: 'right', specialty: 'general_news' }
  };

  private indicatorNewsMapping: Record<string, IndicatorNewsMapping> = {
    treasury_tail: {
      indicators: ['treasury_tail'],
      keywords: ['treasury auction', 'bond market', 'yield curve', 'federal reserve', 'interest rates', 'banking stress', 'liquidity crisis'],
      exclusions: ['personal finance', 'mortgage rates'],
      sources: ['wsj', 'reuters', 'bloomberg', 'ft'],
      context: 'Federal Reserve and banking system stress indicators'
    },
    taiwan_zone: {
      indicators: ['taiwan_zone'],
      keywords: ['taiwan strait', 'china military', 'pla exercises', 'semiconductor', 'tsmc', 'china taiwan', 'south china sea'],
      exclusions: ['tourism', 'culture'],
      sources: ['reuters', 'bbc-news', 'wsj', 'ft'],
      context: 'Taiwan conflict risk and semiconductor supply chain'
    },
    hormuz_war_risk: {
      indicators: ['hormuz_war_risk'],
      keywords: ['strait of hormuz', 'iran', 'oil tankers', 'persian gulf', 'shipping rates', 'war risk insurance'],
      exclusions: ['oil prices general'],
      sources: ['reuters', 'bloomberg', 'wsj'],
      context: 'Middle East shipping and oil supply risks'
    },
    mbridge_settlement: {
      indicators: ['mbridge_settlement'],
      keywords: ['mbridge', 'central bank digital currency', 'cbdc', 'dedollarization', 'yuan oil', 'petrodollar'],
      exclusions: ['bitcoin', 'crypto'],
      sources: ['reuters', 'ft', 'wsj', 'bloomberg'],
      context: 'Dollar dominance and alternative payment systems'
    },
    vix_volatility: {
      indicators: ['vix_volatility'],
      keywords: ['market volatility', 'vix', 'market crash', 'stock market decline', 'fear index'],
      exclusions: ['individual stocks'],
      sources: ['bloomberg', 'wsj', 'marketwatch', 'cnbc'],
      context: 'Market stress and volatility indicators'
    },
    ice_detention: {
      indicators: ['ice_detention'],
      keywords: ['ice detention', 'immigration enforcement', 'border security', 'deportation', 'immigrant detention'],
      exclusions: ['ice hockey'],
      sources: ['reuters', 'bbc-news', 'wsj'],
      context: 'Immigration enforcement and domestic control measures'
    },
    unemployment_rate: {
      indicators: ['unemployment_rate'],
      keywords: ['unemployment', 'jobless claims', 'layoffs', 'job market', 'labor statistics'],
      exclusions: ['job openings'],
      sources: ['wsj', 'reuters', 'bloomberg', 'cnbc'],
      context: 'Employment and economic indicators'
    },
    global_conflict_index: {
      indicators: ['global_conflict_index'],
      keywords: ['military conflict', 'war', 'armed conflict', 'geopolitical tension', 'international crisis'],
      exclusions: ['sports conflict', 'corporate conflict'],
      sources: ['reuters', 'bbc-news', 'wsj'],
      context: 'Global military and political stability'
    }
  };

  constructor() {
    this.newsApiKey = import.meta.env.VITE_NEWS_API_KEY;
    this.alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

    // Initialize rate limiters based on API limits
    this.newsApiLimiter = new RateLimiter(100, 24 * 60 * 60 * 1000); // 100 requests per day
    this.alphaVantageLimiter = new RateLimiter(5, 60 * 1000); // 5 requests per minute

    if (!this.newsApiKey) {
      console.warn('⚠️ NEWS_API_KEY not found - using demo data');
    }
    
    // Clean up cache periodically
    setInterval(() => newsCache.cleanup(), 60 * 1000); // Every minute
  }

  async getNewsForIndicator(indicatorId: string, limit: number = 5): Promise<NewsArticle[]> {
    // Check cache first
    const cacheKey = `news:${indicatorId}:${limit}`;
    const cachedNews = newsCache.get<NewsArticle[]>(cacheKey);
    if (cachedNews) {
      console.log(`📰 Returning cached news for ${indicatorId}`);
      return cachedNews;
    }

    const mapping = this.indicatorNewsMapping[indicatorId];
    if (!mapping) {
      console.warn(`No news mapping found for indicator: ${indicatorId}`);
      return this.getMockNewsForIndicator(indicatorId, limit);
    }

    if (!this.newsApiKey) {
      return this.getMockNewsForIndicator(indicatorId, limit);
    }

    // Check rate limit
    if (!await this.newsApiLimiter.checkLimit('newsapi')) {
      console.warn('⚠️ News API rate limit exceeded, using cached or mock data');
      return this.getMockNewsForIndicator(indicatorId, limit);
    }

    try {
      const articles: NewsArticle[] = [];
      
      // Search for each keyword set
      for (const keyword of mapping.keywords.slice(0, 3)) { // Limit to prevent API overuse
        const query = this.buildSearchQuery(keyword, mapping.exclusions);
        const sources = mapping.sources.join(',');
        
        const url = `https://newsapi.org/v2/everything?` +
          `q=${encodeURIComponent(query)}&` +
          `sources=${sources}&` +
          `sortBy=publishedAt&` +
          `pageSize=${Math.ceil(limit / 2)}&` +
          `language=en&` +
          `from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`;

        const response = await fetch(url, {
          headers: {
            'X-API-Key': this.newsApiKey
          }
        });

        if (response.ok) {
          const data = await response.json();
          const enhancedArticles = data.articles.map((article: any) => ({
            ...article,
            relevance_score: this.calculateRelevanceScore(article, keyword),
            source_credibility: this.sourceCredibility[article.source.id] || { score: 60, bias: 'unknown' },
            indicator_relevance: [indicatorId]
          }));
          
          articles.push(...enhancedArticles);
        }
      }

      // Sort by relevance and credibility, remove duplicates
      const uniqueArticles = this.removeDuplicateArticles(articles);
      const sortedArticles = uniqueArticles
        .sort((a, b) => (b.relevance_score! * b.source_credibility!.score) - (a.relevance_score! * a.source_credibility!.score))
        .slice(0, limit);
      
      // Cache the results
      newsCache.set(cacheKey, sortedArticles);
      
      return sortedArticles;

    } catch (error) {
      console.error(`Error fetching news for ${indicatorId}:`, error);
      
      // If it's a 429 (rate limit) error, update our rate limiter
      if (error instanceof Error && error.message.includes('429')) {
        console.warn('📛 News API returned 429 - rate limit hit');
      }
      
      return this.getMockNewsForIndicator(indicatorId, limit);
    }
  }

  async getGlobalNewsFeed(limit: number = 10): Promise<NewsArticle[]> {
    // Get news for all indicators and combine
    const allNews: NewsArticle[] = [];
    
    for (const indicatorId of Object.keys(this.indicatorNewsMapping)) {
      const indicatorNews = await this.getNewsForIndicator(indicatorId, 2);
      allNews.push(...indicatorNews);
    }

    // Sort by publication date and relevance
    return allNews
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
  }

  async getNewsForIndicators(indicatorIds: string[], limit: number = 20): Promise<Record<string, NewsArticle[]>> {
    const result: Record<string, NewsArticle[]> = {};
    
    for (const indicatorId of indicatorIds) {
      result[indicatorId] = await this.getNewsForIndicator(indicatorId, Math.ceil(limit / indicatorIds.length));
    }
    
    return result;
  }

  private buildSearchQuery(keyword: string, exclusions: string[]): string {
    let query = keyword;
    
    // Add exclusions with NOT operator
    if (exclusions.length > 0) {
      const excludeTerms = exclusions.map(term => `-"${term}"`).join(' ');
      query += ` ${excludeTerms}`;
    }
    
    return query;
  }

  private calculateRelevanceScore(article: any, keyword: string): number {
    let score = 0;
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // Title matches are more important
    if (title.includes(keywordLower)) score += 10;
    if (description.includes(keywordLower)) score += 5;
    
    // Recency boost (within 24 hours)
    const publishedAt = new Date(article.publishedAt).getTime();
    const now = Date.now();
    const hoursAgo = (now - publishedAt) / (1000 * 60 * 60);
    
    if (hoursAgo < 24) score += 5;
    else if (hoursAgo < 72) score += 2;
    
    return Math.max(score, 1); // Minimum score of 1
  }

  private removeDuplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title + article.source.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getMockNewsForIndicator(indicatorId: string, limit: number): NewsArticle[] {
    const mockNews: Record<string, NewsArticle[]> = {
      treasury_tail: [
        {
          title: "Federal Reserve Signals Cautious Approach to Rate Policy",
          description: "Treasury auction shows mixed demand as investors weigh inflation concerns against growth outlook.",
          url: "#",
          source: { id: "wsj", name: "Wall Street Journal" },
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          content: "Demo content",
          relevance_score: 9,
          source_credibility: this.sourceCredibility.wsj,
          indicator_relevance: ["treasury_tail"]
        }
      ],
      taiwan_zone: [
        {
          title: "China Conducts Military Exercises Near Taiwan Strait",
          description: "Latest round of exercises raises concerns about semiconductor supply chain stability.",
          url: "#",
          source: { id: "reuters", name: "Reuters" },
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          content: "Demo content",
          relevance_score: 10,
          source_credibility: this.sourceCredibility.reuters,
          indicator_relevance: ["taiwan_zone"]
        }
      ],
      vix_volatility: [
        {
          title: "Market Volatility Spikes on Economic Uncertainty",
          description: "VIX jumps as investors brace for potential market turbulence amid mixed economic signals.",
          url: "#",
          source: { id: "bloomberg", name: "Bloomberg" },
          publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          content: "Demo content",
          relevance_score: 8,
          source_credibility: this.sourceCredibility.bloomberg,
          indicator_relevance: ["vix_volatility"]
        }
      ]
    };

    return (mockNews[indicatorId] || []).slice(0, limit);
  }

  getSourceCredibilityInfo(): Record<string, SourceCredibility> {
    return this.sourceCredibility;
  }

  getIndicatorMapping(): Record<string, IndicatorNewsMapping> {
    return this.indicatorNewsMapping;
  }

  // Get API status and rate limit info
  getApiStatus() {
    return {
      newsApi: {
        enabled: !!this.newsApiKey,
        remaining: this.newsApiLimiter.getRemainingRequests('newsapi'),
        resetTime: this.newsApiLimiter.getResetTime('newsapi'),
      },
      alphaVantage: {
        enabled: !!this.alphaVantageKey,
        remaining: this.alphaVantageLimiter.getRemainingRequests('alphavantage'),
        resetTime: this.alphaVantageLimiter.getResetTime('alphavantage'),
      },
      cache: newsCache.getStats()
    };
  }
}

export const newsIntelligence = new NewsIntelligenceService();