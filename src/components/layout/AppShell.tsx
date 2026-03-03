import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Eye,
  CheckSquare,
  Shield,
  BarChart3,
  Settings,
  RefreshCw,
  Menu,
  X,
  Bell,
  Newspaper,
  FileText,
} from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useStore } from '../../store';
import { CanaryLogo } from '../branding/CanaryLogo';
import { ErrorBoundary } from '../ErrorBoundary';
import { LiveTicker } from './LiveTicker';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/checklist', icon: CheckSquare, label: 'Actions' },
  { path: '/indicators', icon: Eye, label: 'Monitor' },
  { path: '/analytics', icon: BarChart3, label: 'Insights' },
  { path: '/playbook', icon: Shield, label: 'Plan' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const SECONDARY_NAV = [
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/news', icon: Newspaper, label: 'News' },
  { path: '/reports', icon: FileText, label: 'Reports' },
];

// Bottom tab bar items (mobile)
const BOTTOM_TABS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/checklist', icon: CheckSquare, label: 'Actions' },
  { path: '/indicators', icon: Eye, label: 'Monitor' },
  { path: '/playbook', icon: Shield, label: 'Plan' },
  { path: '/settings', icon: Settings, label: 'More' },
];

export const AppShell: React.FC = () => {
  const location = useLocation();
  const { loading, refreshAll, indicators } = useStore();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const redCount = indicators.filter(i => i.status.level === 'red').length;
  const amberCount = indicators.filter(i => i.status.level === 'amber').length;

  const isDemoMode = indicators.length > 0 && indicators.every(i => i.status.dataSource === 'MOCK' || i.status.dataSource === 'DEMO');

  const getOverallMood = () => {
    if (redCount >= 2) return { label: 'Action needed', color: 'text-red-400', dot: 'bg-red-500', pulse: true };
    if (redCount > 0 || amberCount >= 3) return { label: 'Stay alert', color: 'text-amber-400', dot: 'bg-amber-500', pulse: false };
    return { label: 'All clear', color: 'text-green-400', dot: 'bg-green-500', pulse: false };
  };
  const mood = getOverallMood();

  const hasTicker = indicators.length > 0;
  const tickerHeight = hasTicker ? '32px' : '0';

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col">
      {hasTicker && <LiveTicker className="sticky top-0 z-50" />}

      <div className="flex-1 flex relative">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>

        {/* ── Mobile Sidebar Backdrop ── */}
        <AnimatePresence>
          {showMobileSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar (desktop) ── */}
        <aside
          aria-label="Main navigation"
          className={cn(
            'w-56 fixed z-40 transition-transform duration-300',
            'bg-[#0E0E10]/90 backdrop-blur-xl border-r border-white/[0.04]',
            'lg:translate-x-0',
            showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{
            top: hasTicker ? tickerHeight : '0',
            height: hasTicker ? `calc(100vh - ${tickerHeight})` : '100vh',
          }}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Link to="/" onClick={() => setShowMobileSidebar(false)}>
                  <CanaryLogo size="sm" showText={true} />
                </Link>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 text-white/30 hover:text-white lg:hidden rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Primary Navigation */}
            <nav aria-label="Primary navigation" className="flex-1 px-3 py-2">
              <div className="space-y-0.5">
                {NAV_ITEMS.map(item => {
                  const active = isActive(item.path);
                  const showBadge = item.path === '/checklist' && redCount > 0;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMobileSidebar(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200',
                        active
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {showBadge && (
                        <span className="w-5 h-5 flex items-center justify-center text-2xs bg-red-500/20 text-red-400 rounded-md font-medium">
                          {redCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Secondary nav */}
              <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-0.5">
                {SECONDARY_NAV.map(item => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMobileSidebar(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200',
                        active
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Version / System status */}
            <div className="p-4 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center gap-2 text-xs text-white/15">
                <span className={cn('w-1.5 h-1.5 rounded-full', mood.dot)} />
                <span>System {mood.label.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main id="main-content" className="flex-1 lg:ml-56 min-h-screen flex flex-col pb-16 lg:pb-0">
          {/* Header — minimal */}
          <header
            className="bg-[#0E0E10]/80 backdrop-blur-xl border-b border-white/[0.04] sticky z-10"
            style={{ top: hasTicker ? tickerHeight : '0' }}
          >
            <div className="px-4 sm:px-6 lg:px-8 py-2.5">
              <div className="flex items-center justify-between gap-4">
                {/* Mobile menu */}
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  aria-label="Open navigation menu"
                  className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-colors lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      mood.dot,
                      mood.pulse && 'animate-pulse'
                    )} />
                    <span className={cn('text-sm font-medium', mood.color)}>{mood.label}</span>
                    {redCount > 0 && (
                      <span className="text-xs text-white/20">
                        &mdash; {redCount} need{redCount === 1 ? 's' : ''} attention
                      </span>
                    )}
                  </div>
                </div>

                {/* DEMO badge */}
                {isDemoMode && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-medium text-amber-400">DEMO</span>
                  </div>
                )}

                {/* Refresh */}
                <button
                  onClick={refreshAll}
                  disabled={loading}
                  className="p-2 text-white/20 hover:text-white/50 hover:bg-white/5 rounded-xl transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {/* ── Mobile Bottom Tabs ── */}
        <nav
          aria-label="Mobile navigation"
          className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[#0E0E10]/95 backdrop-blur-xl border-t border-white/[0.04]"
        >
          <div className="flex items-center justify-around px-2 py-1.5">
            {BOTTOM_TABS.map(tab => {
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0',
                    active ? 'text-white' : 'text-white/25'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-2xs truncate">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
