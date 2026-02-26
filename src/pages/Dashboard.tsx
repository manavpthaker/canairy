import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Globe,
  RefreshCw,
  Bell,
  Settings,
  Shield,
  Activity,
  Newspaper,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { IndicatorData } from '../types';
import { IndicatorModal } from '../components/indicators/IndicatorModal';
import { HeroStatusCard } from '../components/dashboard/HeroStatusCard';
import { ActionablePriorityActions } from '../components/dashboard/ActionablePriorityActions';
import { CriticalIndicators } from '../components/dashboard/CriticalIndicators';
import { SituationalStatusBar } from '../components/dashboard/SituationalStatusBar';
import { TightenUpBanner } from '../components/dashboard/TightenUpBanner';
import { PhaseDetailPanel } from '../components/dashboard/PhaseDetailPanel';
import { DomainBreakdown } from '../components/dashboard/DomainBreakdown';
import { CanaryLogo } from '../components/branding/CanaryLogo';
import { NewsTicker } from '../components/news/NewsTicker';
import { NewsSidebar } from '../components/news/NewsSidebar';
import { DashboardLoader } from '../components/dashboard/DashboardLoader';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { cn } from '../utils/cn';

export const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);
  const [showNewsSidebar, setShowNewsSidebar] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const {
    indicators,
    loading,
    refreshAll
  } = useStore();

  const sidebarItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/indicators', icon: Activity, label: 'Indicators' },
    { path: '/news', icon: Globe, label: 'News' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/playbook', icon: Shield, label: 'Playbook' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];



  return (
    <div className="min-h-screen bg-[#0A0A0A] flex relative">
      {/* Skip to Content */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileSidebar(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop always visible, Mobile slides in */}
      <aside
        aria-label="Main navigation"
        className={cn(
          "w-64 bg-[#111111] border-r border-[#1A1A1A] fixed h-full z-40 transition-transform duration-300",
          "lg:translate-x-0",
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          {/* Logo with mobile close button */}
          <div className="mb-8 flex items-center justify-between">
            <CanaryLogo size="md" showText={true} />
            <button
              onClick={() => setShowMobileSidebar(false)}
              aria-label="Close navigation menu"
              className="p-2 text-gray-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav aria-label="Primary navigation" className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowMobileSidebar(false)} // Close on mobile after navigation
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

      {/* Main content - Responsive margin */}
      <main id="main-content" className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-[#111111] border-b border-[#1A1A1A] sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-12 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                aria-label="Open navigation menu"
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Status bar - responsive width */}
              <div className="flex-1 min-w-0">
                <SituationalStatusBar />
              </div>
              
              {/* Actions - responsive */}
              <div className="flex items-center gap-1 sm:gap-2">
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

        {/* Content - Responsive padding */}
        <div className="p-4 sm:p-6 lg:p-12">
          {/* Empty state — data loaded but no indicators */}
          {!loading && indicators.length === 0 && (
            <div className="text-center py-24">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No indicators loaded</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Unable to fetch indicator data. Check that the backend is running on port 5555.
              </p>
              <button
                onClick={refreshAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {/* Loading state — show loader while fetching data */}
          {loading && indicators.length === 0 && <DashboardLoader />}

          {/* Only show dashboard content when data is loaded */}
          {indicators.length > 0 && (
            <>
            {/* 1. Tighten-Up Banner — shows when ≥2 indicators are RED */}
          <ErrorBoundary isolate>
            <TightenUpBanner />
          </ErrorBoundary>

          {/* 2. Hero Status Card — "Am I okay?" above the fold */}
          <ErrorBoundary isolate>
            <HeroStatusCard />
          </ErrorBoundary>

          {/* 3. Actionable Priority Actions — moved up for action-first UX */}
          <ErrorBoundary isolate>
            <div className="mb-8">
              <ActionablePriorityActions />
            </div>
          </ErrorBoundary>

          {/* 4. Domain Breakdown + Critical Indicators side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <ErrorBoundary isolate>
              <DomainBreakdown />
            </ErrorBoundary>
            <ErrorBoundary isolate>
              <CriticalIndicators
                indicators={indicators}
                onIndicatorClick={(indicator) => setSelectedIndicator(indicator)}
              />
            </ErrorBoundary>
          </div>

          {/* 5. Phase Detail — current phase actions and triggers */}
          <ErrorBoundary isolate>
            <PhaseDetailPanel />
          </ErrorBoundary>

          {/* 6. News Ticker — moved to bottom */}
          <ErrorBoundary isolate>
            <div className="mb-8">
              <NewsTicker maxItems={5} />
            </div>
          </ErrorBoundary>


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
            </>
          )}
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
      
      {/* Mobile backdrop for news sidebar */}
      <AnimatePresence>
        {showNewsSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewsSidebar(false)}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};