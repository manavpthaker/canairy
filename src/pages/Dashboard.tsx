import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe, 
  Brain,
  RefreshCw,
  Download,
  Bell,
  Settings,
  ChevronRight,
  Activity,
  Newspaper
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { IndicatorData } from '../types';
import { EnhancedIndicatorCard } from '../components/indicators/EnhancedIndicatorCard';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { SimpleExecutiveBanner } from '../components/dashboard/SimpleExecutiveBanner';
import { EnhancedExecutiveSummary } from '../components/dashboard/EnhancedExecutiveSummary';
import { SimpleDecisionSupport } from '../components/dashboard/SimpleDecisionSupport';
import { SimplePriorityActions } from '../components/dashboard/SimplePriorityActions';
import { ActionablePriorityActions } from '../components/dashboard/ActionablePriorityActions';
import { CriticalIndicators } from '../components/dashboard/CriticalIndicators';
import { RiskNarrativePanel } from '../components/dashboard/RiskNarrativePanel';
import { SituationalStatusBar } from '../components/dashboard/SituationalStatusBar';
import { CanaryLogo } from '../components/branding/CanaryLogo';
import { NewsTicker } from '../components/news/NewsTicker';
import { NewsSidebar } from '../components/news/NewsSidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/core/Card';
import { Button } from '../components/core/Button';
import { Badge } from '../components/core/Badge';
import { cn } from '../utils/cn';

export const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);
  const [showNewsSidebar, setShowNewsSidebar] = useState(false);
  
  const { 
    indicators, 
    hopiScore, 
    currentPhase, 
    systemStatus,
    loading,
    refreshAll 
  } = useStore();

  const sidebarItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/indicators', icon: Activity, label: 'Indicators' },
    { path: '/news', icon: Globe, label: 'News' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/reports', icon: Download, label: 'Reports' },
  ];


  const criticalCount = indicators?.filter(i => i.status.level === 'red' && i.critical).length || 0;
  const redCount = indicators?.filter(i => i.status.level === 'red').length || 0;
  const amberCount = indicators?.filter(i => i.status.level === 'amber').length || 0;
  const greenCount = indicators?.filter(i => i.status.level === 'green').length || 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] border-r border-[#1A1A1A] fixed h-full z-20">
        <div className="p-6">
          {/* Logo */}
          <div className="mb-8">
            <CanaryLogo size="md" showText={true} />
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#1A1A1A] hover:text-white transition-colors',
                  location.pathname === item.path && 'bg-[#1A1A1A] text-white'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* System Status */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#1A1A1A]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">System Status</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-300">Operational</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-[#111111] border-b border-[#1A1A1A] sticky top-0 z-10">
          <div className="px-12 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-8">
                <SituationalStatusBar />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshAll}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
                <button 
                  onClick={() => setShowNewsSidebar(!showNewsSidebar)}
                  className={cn(
                    "p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors",
                    showNewsSidebar && "bg-[#1A1A1A] text-white"
                  )}
                  title="Toggle news sidebar"
                >
                  <Newspaper className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-12">
          {/* News Ticker */}
          <div className="mb-6">
            <NewsTicker maxItems={5} />
          </div>

          {/* Enhanced Executive Summary */}
          <EnhancedExecutiveSummary />

          {/* Critical Indicators */}
          <CriticalIndicators 
            indicators={indicators}
            onIndicatorClick={(indicator) => setSelectedIndicator(indicator)}
          />

          {/* Risk Narrative Panel */}
          <RiskNarrativePanel />

          {/* Actionable Priority Actions */}
          <div className="mb-12">
            <ActionablePriorityActions />
          </div>


          {/* Quick Link to Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 border-t border-[#1A1A1A]"
          >
            <h3 className="text-2xl font-semibold text-white mb-3">
              Need more details?
            </h3>
            <p className="text-gray-400 mb-8 text-lg">
              View all {indicators.length} indicators with advanced filtering and search
            </p>
            <button
              onClick={() => navigate('/indicators')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] rounded-xl hover:bg-gray-100 transition-colors font-medium"
            >
              <Activity className="w-5 h-5" />
              View All Indicators
            </button>
          </motion.div>
        </div>
      </main>

      {/* Indicator Modal */}
      {selectedIndicator && (
        <IndicatorModal
          isOpen={!!selectedIndicator}
          onClose={() => setSelectedIndicator(null)}
          indicator={selectedIndicator}
        />
      )}
      
      {/* News Sidebar */}
      <NewsSidebar 
        isOpen={showNewsSidebar}
        onClose={() => setShowNewsSidebar(false)}
      />
    </div>
  );
};