import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Activity,
  Bell,
  Eye,
  TrendingUp,
  Zap,
  Globe,
  Database,
  Clock,
} from 'lucide-react';

const STORAGE_KEY = 'canairy_seen_landing';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center p-6 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl w-full relative z-10 pt-12 sm:pt-16"
      >
        {/* Header */}
        <div className="text-center mb-10">
          {/* Logo / Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <Eye className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          {/* Wordmark */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-display font-bold text-white mb-4 tracking-tight"
          >
            Canairy
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg sm:text-xl text-white/50 leading-relaxed max-w-xl mx-auto"
          >
            A free, open monitoring dashboard that tracks early warning signs of societal disruption.
            <span className="block mt-2 text-white/70">Like a canary in a coal mine — for the modern world.</span>
          </motion.p>
        </div>

        {/* What This Is */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-6"
        >
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
            What This Dashboard Tracks
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Economic Signals</p>
                <p className="text-white/40 text-xs mt-0.5">Treasury auctions, inflation, currency shifts, supply chains</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Geopolitical Risks</p>
                <p className="text-white/40 text-xs mt-0.5">Conflict zones, shipping lanes, trade tensions, sanctions</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Infrastructure</p>
                <p className="text-white/40 text-xs mt-0.5">Power grid, cyber threats, communications, fuel supply</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What You'll Find */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-6"
        >
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
            What You'll Find Inside
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Activity className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-white/70">
                <span className="text-white font-medium">35+ live indicators</span> — pulled from government APIs, financial data providers, and official sources
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-white/70">
                <span className="text-white font-medium">Simple status levels</span> — Green (normal), Amber (elevated), Red (action needed)
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-white/70">
                <span className="text-white font-medium">Practical action checklists</span> — concrete steps families can take at each alert level
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Database className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-white/70">
                <span className="text-white font-medium">Transparent sources</span> — every data point links to its official source
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-white/70">
                <span className="text-white font-medium">Real-time updates</span> — data refreshes automatically, no manual checking required
              </span>
            </div>
          </div>
        </motion.div>

        {/* Philosophy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-center mb-8 px-4"
        >
          <p className="text-white/30 text-sm italic">
            "Most people don't track macroeconomic signals or geopolitical developments — and they shouldn't have to.
            This dashboard does the monitoring, so families can focus on living their lives until something actually needs attention."
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <button
            onClick={handleEnter}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-[#09090B] rounded-xl font-medium text-lg hover:bg-white/90 transition-all"
          >
            <span>Enter the Dashboard</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-4 text-xs text-white/25">
            Free and open source. No account required. No data collection.
          </p>
        </motion.div>
      </motion.div>

      {/* Bottom attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-auto pt-12 pb-6 text-center"
      >
        <p className="text-xs text-white/15">
          Preparedness isn't paranoia — it's peace of mind.
        </p>
      </motion.div>
    </div>
  );
};

// Helper to check if user has seen landing
export const hasSeenLanding = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

export default Landing;
