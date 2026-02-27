import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Activity,
  Globe,
  Bell,
  Download,
  Shield,
  Settings,
  BarChart3,
  RefreshCw,
  Newspaper,
  Menu,
  X,
} from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useStore } from '../../store';
import { CanaryLogo } from '../branding/CanaryLogo';
import { NewsSidebar } from '../news/NewsSidebar';
import { SituationalStatusBar } from '../dashboard/SituationalStatusBar';
import { ErrorBoundary } from '../ErrorBoundary';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/indicators', icon: Activity, label: 'Indicators' },
  { path: '/news', icon: Globe, label: 'News' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/reports', icon: Download, label: 'Reports' },
  { path: '/playbook', icon: Shield, label: 'Playbook' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const AppShell: React.FC = () => {
  const location = useLocation();
  const { loading, refreshAll } = useStore();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showNewsSidebar, setShowNewsSidebar] = useState(false);

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

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={cn(
          'w-64 bg-[#111111] border-r border-[#1A1A1A] fixed h-full z-40 transition-transform duration-300',
          'lg:translate-x-0',
          showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6">
          {/* Logo with mobile close button */}
          <div className="mb-8 flex items-center justify-between">
            <Link to="/" onClick={() => setShowMobileSidebar(false)}>
              <CanaryLogo size="md" showText={true} />
            </Link>
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
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMobileSidebar(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#1A1A1A] hover:text-white transition-colors',
                    isActive && 'bg-[#1A1A1A] text-white'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
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
      <main id="main-content" className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-[#111111] border-b border-[#1A1A1A] sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                aria-label="Open navigation menu"
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Status bar */}
              <div className="flex-1 min-w-0">
                <ErrorBoundary isolate>
                  <SituationalStatusBar />
                </ErrorBoundary>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={refreshAll}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
                </button>
                <button
                  onClick={() => setShowNewsSidebar(!showNewsSidebar)}
                  className={cn(
                    'p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors',
                    showNewsSidebar && 'bg-[#1A1A1A] text-white'
                  )}
                  title="Toggle news sidebar"
                >
                  <Newspaper className="w-5 h-5" />
                </button>
                <Link
                  to="/alerts"
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
                  title="Alerts"
                >
                  <Bell className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>

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
