import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Newspaper, 
  Filter,
  Globe,
  TrendingUp,
  AlertTriangle,
  Shield,
  Zap
} from 'lucide-react';
import { NewsFeed } from '../components/news/NewsFeed';
import { Card, CardHeader, CardTitle, CardContent } from '../components/core/Card';
import { Button } from '../components/core/Button';
import { Badge } from '../components/core/Badge';
import { cn } from '../utils/cn';

type NewsFilter = 'all' | 'high' | 'medium' | 'low' | 'indicators';
type DomainFilter = 'all' | 'economy' | 'global_conflict' | 'energy' | 'ai_tech' | 'domestic_control';

const indicatorOptions = [
  { id: 'treasury_tail', name: 'Treasury Tail Risk', icon: TrendingUp },
  { id: 'taiwan_zone', name: 'Taiwan Exclusion Zone', icon: Shield },
  { id: 'hormuz_war_risk', name: 'Hormuz War Risk', icon: Zap },
  { id: 'vix_volatility', name: 'VIX Volatility', icon: TrendingUp },
  { id: 'ice_detention', name: 'ICE Detention', icon: AlertTriangle },
  { id: 'global_conflict_index', name: 'Global Conflict', icon: Globe },
];

export const News: React.FC = () => {
  const [urgencyFilter, setUrgencyFilter] = useState<NewsFilter>('all');
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [showIndicatorFilter, setShowIndicatorFilter] = useState(false);

  const getFilteredView = () => {
    if (selectedIndicator) {
      return (
        <NewsFeed 
          key={`indicator-${selectedIndicator}`}
          indicatorId={selectedIndicator} 
          limit={20}
          showGlobal={false}
        />
      );
    }
    
    return (
      <NewsFeed 
        key="global-feed"
        showGlobal={true}
        limit={20}
      />
    );
  };

  const clearFilters = () => {
    setSelectedIndicator(null);
    setUrgencyFilter('all');
    setDomainFilter('all');
    setShowIndicatorFilter(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#1A1A1A] sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-white">Risk Intelligence News</h1>
              <p className="text-gray-400 mt-1">Real-time news filtered by risk indicators</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowIndicatorFilter(!showIndicatorFilter)}
                variant={showIndicatorFilter ? 'primary' : 'outline'}
                size="sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter by Indicator
              </Button>
              
              {(selectedIndicator || urgencyFilter !== 'all' || domainFilter !== 'all') && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Indicator Filter Panel */}
          {showIndicatorFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 p-4 bg-[#0A0A0A] rounded-lg border border-[#1A1A1A]"
            >
              <h3 className="text-white font-medium mb-3">Filter by Risk Indicator</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  onClick={() => setSelectedIndicator(null)}
                  className={cn(
                    "p-3 rounded-lg text-sm font-medium transition-all text-left",
                    !selectedIndicator
                      ? "bg-white text-[#0A0A0A]"
                      : "bg-[#1A1A1A] text-gray-300 hover:bg-[#2A2A2A] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    All News
                  </div>
                </button>
                
                {indicatorOptions.map((indicator) => (
                  <button
                    key={indicator.id}
                    onClick={() => setSelectedIndicator(indicator.id)}
                    className={cn(
                      "p-3 rounded-lg text-sm font-medium transition-all text-left",
                      selectedIndicator === indicator.id
                        ? "bg-white text-[#0A0A0A]"
                        : "bg-[#1A1A1A] text-gray-300 hover:bg-[#2A2A2A] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <indicator.icon className="w-4 h-4" />
                      {indicator.name}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Active Filters */}
          {(selectedIndicator || urgencyFilter !== 'all' || domainFilter !== 'all') && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400">Active filters:</span>
              
              {selectedIndicator && (
                <Badge variant="primary">
                  {indicatorOptions.find(i => i.id === selectedIndicator)?.name || selectedIndicator}
                </Badge>
              )}
              
              {urgencyFilter !== 'all' && (
                <Badge variant="amber">
                  {urgencyFilter.charAt(0).toUpperCase() + urgencyFilter.slice(1)} Urgency
                </Badge>
              )}
              
              {domainFilter !== 'all' && (
                <Badge variant="blue">
                  {domainFilter.replace('_', ' ')} Domain
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main News Feed */}
          <div className="lg:col-span-3">
            {getFilteredView()}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Risk Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Current Risk Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">High Priority</span>
                    <Badge variant="red" size="sm">2 indicators</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Monitoring</span>
                    <Badge variant="amber" size="sm">3 indicators</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Normal</span>
                    <Badge variant="green" size="sm">11 indicators</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* News Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-purple-400" />
                  News Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Wall Street Journal</span>
                    <Badge variant="green" size="sm">95/100</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Reuters</span>
                    <Badge variant="green" size="sm">92/100</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Bloomberg</span>
                    <Badge variant="green" size="sm">90/100</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Financial Times</span>
                    <Badge variant="green" size="sm">88/100</Badge>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#1A1A1A]">
                  <p className="text-xs text-gray-400">
                    Sources rated by credibility and bias assessment
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full justify-start" size="sm" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Dashboard
                  </Button>
                  <Button className="w-full justify-start" size="sm" variant="outline">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Check Alerts
                  </Button>
                  <Button className="w-full justify-start" size="sm" variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Emergency Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};