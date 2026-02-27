import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Eye,
  Newspaper,
  Bell,
  CheckSquare,
  Shield,
  BarChart3,
  FileText,
  Settings,
  RefreshCw,
  Menu,
  X,
  Heart,
} from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useStore } from '../../store';
import { CanaryLogo } from '../branding/CanaryLogo';
import { NewsSidebar } from '../news/NewsSidebar';
import { ErrorBoundary } from '../ErrorBoundary';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/checklist', icon: CheckSquare, label: 'Family Actions' },
  { path: '/indicators', icon: Eye, label: "What We're Watching" },
  { path: '/alerts', icon: Bell, label: 'Heads Up' },
  { path: '/playbook', icon: Shield, label: 'Family Plan' },
  { path: '/news', icon: Newspaper, label: 'News' },
  { path: '/analytics', icon: BarChart3, label: 'Trends' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const AppShell: React.FC = () => {
  const location = useLocation();
  const { loading, refreshAll, indicators } = useStore();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showNewsSidebar, setShowNewsSidebar] = useState(false);

  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const amberCount = indicators.filter(i => i.status.level === 'amber').length;

  // Family-friendly overall status
  const getOverallMood = () => {
    if (redCount >= 2) return { label: 'Action needed', color: 'text-red-400', dot: 'bg-red-500', pulse: true };
    if (redCount > 0 || amberCount >= 3) return { label: 'Stay alert', color: 'text-amber-400', dot: 'bg-amber-500', pulse: false };
    return { label: 'Looking good', color: 'text-green-400', dot: 'bg-green-500', pulse: false };
  };
  const mood = getOverallMood();

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex relative">
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
        <div className="p-5">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-between">
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

          {/* Family status pill */}
          <div className="mb-6 px-3 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A]">
            <div className="flex items-center gap-2.5">
              <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', mood.dot, mood.pulse && 'animate-pulse')} />
              <div className="min-w-0">
                <div className={cn('text-sm font-medium', mood.color)}>{mood.label}</div>
                <div className="text-xs text-gray-500">
                  {indicators.length} things monitored
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label="Primary navigation" className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              // Show alert count badge on Heads Up
              const showBadge = item.path === '/alerts' && redCount > 0;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMobileSidebar(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-[#1A1A1A] hover:text-white transition-colors text-sm',
                    isActive && 'bg-[#1A1A1A] text-white font-medium'
                  )}
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {showBadge && (
                    <span className="px-1.5 py-0.5 text-2xs bg-red-500/20 text-red-400 rounded-full font-medium">{redCount}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom — warm message */}
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-[#1A1A1A]">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Heart className="w-3.5 h-3.5 text-gray-600" />
            <span>Keeping your family informed</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main id="main-content" className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Header — simplified, warm */}
        <header className="bg-[#111111] border-b border-[#1A1A1A] sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile menu */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                aria-label="Open navigation menu"
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Status summary — plain language */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', mood.dot, mood.pulse && 'animate-pulse')} />
                  <span className={cn('text-sm font-medium', mood.color)}>{mood.label}</span>
                  {redCount > 0 && (
                    <span className="text-xs text-gray-500">
                      — {redCount} {redCount === 1 ? 'thing needs' : 'things need'} attention
                    </span>
                  )}
                  {redCount === 0 && amberCount > 0 && (
                    <span className="text-xs text-gray-500">
                      — {amberCount} to keep an eye on
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={refreshAll}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
                  title="Check for updates"
                >
                  <RefreshCw className={cn('w-4.5 h-4.5', loading && 'animate-spin')} style={{ width: 18, height: 18 }} />
                </button>
                <button
                  onClick={() => setShowNewsSidebar(!showNewsSidebar)}
                  className={cn(
                    'p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors',
                    showNewsSidebar && 'bg-[#1A1A1A] text-white'
                  )}
                  title="Latest news"
                >
                  <Newspaper className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </button>
                <Link
                  to="/alerts"
                  className="relative p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
                  title="Heads up"
                >
                  <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                  {redCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
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
