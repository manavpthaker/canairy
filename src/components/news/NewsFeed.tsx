import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  ExternalLink, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../core/Card';
import { Badge } from '../core/Badge';
import { cn } from '../../utils/cn';
import { newsIntelligence } from '../../services/newsIntelligence';
import { formatDistanceToNow } from 'date-fns';

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

interface NewsFeedProps {
  indicatorId?: string;
  limit?: number;
  showGlobal?: boolean;
  className?: string;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({
  indicatorId,
  limit = 10,
  showGlobal = true,
  className
}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadNews();
    
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing news feed...');
      loadNews();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [indicatorId, limit, showGlobal]);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let newsArticles: NewsArticle[];
      
      if (indicatorId) {
        newsArticles = await newsIntelligence.getNewsForIndicator(indicatorId, limit);
      } else if (showGlobal) {
        newsArticles = await newsIntelligence.getGlobalNewsFeed(limit);
      } else {
        newsArticles = [];
      }
      
      setArticles(newsArticles);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load news articles');
      console.error('News feed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCredibilityBadge = (credibility?: { score: number; bias: string }) => {
    if (!credibility) return null;
    
    const { score, bias } = credibility;
    let variant: 'green' | 'amber' | 'red' = 'green';
    
    if (score >= 85) variant = 'green';
    else if (score >= 70) variant = 'amber';
    else variant = 'red';
    
    return (
      <Badge variant={variant} size="sm">
        {score}/100
      </Badge>
    );
  };

  const getRelevanceBadge = (relevanceScore?: number) => {
    if (!relevanceScore) return null;
    
    let variant: 'green' | 'amber' | 'red' = 'green';
    let label = 'High';
    
    if (relevanceScore >= 8) {
      variant = 'green';
      label = 'High';
    } else if (relevanceScore >= 5) {
      variant = 'amber';
      label = 'Medium';
    } else {
      variant = 'red';
      label = 'Low';
    }
    
    return (
      <Badge variant={variant} size="sm">
        {label} Relevance
      </Badge>
    );
  };

  const toggleExpanded = (index: number) => {
    setExpandedArticle(expandedArticle === index ? null : index);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Loading News...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            News Feed Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={loadNews}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-400" />
            {indicatorId ? 'Related News' : 'Global Risk News'}
            {articles.length > 0 && (
              <Badge variant="default" size="sm">
                {articles.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </span>
            <button
              onClick={loadNews}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Refresh news"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Recent News</h3>
            <p className="text-gray-400">No relevant news articles found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {articles.map((article, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-[#1A1A1A] rounded-lg p-4 hover:border-[#2A2A2A] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1 line-clamp-2">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-400">
                          {article.source.name}
                        </span>
                        {getCredibilityBadge(article.source_credibility)}
                        {getRelevanceBadge(article.relevance_score)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {article.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {article.indicator_relevance && article.indicator_relevance.map((indicator, i) => (
                        <Badge key={i} variant="default" size="sm">
                          {indicator.replace('_', ' ').toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        {expandedArticle === index ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      {article.url !== '#' && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="Read full article"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedArticle === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t border-[#1A1A1A]"
                      >
                        <div className="space-y-3">
                          {article.source_credibility && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">
                                Source Quality: {article.source_credibility.score}/100
                              </span>
                              <span className="text-gray-400">
                                Bias: {article.source_credibility.bias}
                              </span>
                              {article.source_credibility.specialty && (
                                <span className="text-gray-400">
                                  Specialty: {article.source_credibility.specialty}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="bg-[#0A0A0A] rounded-lg p-3">
                            <h5 className="text-white font-medium mb-2 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-400" />
                              Why This Matters for Your Security
                            </h5>
                            <p className="text-gray-300 text-sm">
                              This news relates to risk indicators in your monitoring system. 
                              {article.indicator_relevance?.includes('treasury_tail') && 
                                ' Changes in treasury markets can affect banking stability and your savings.'}
                              {article.indicator_relevance?.includes('taiwan_zone') && 
                                ' Taiwan tensions could disrupt global supply chains and electronics availability.'}
                              {article.indicator_relevance?.includes('vix_volatility') && 
                                ' Market volatility affects retirement accounts and job security.'}
                              {article.indicator_relevance?.includes('hormuz_war_risk') && 
                                ' Shipping disruptions would immediately impact gas and grocery prices.'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};