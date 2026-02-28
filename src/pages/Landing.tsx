import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Activity,
  Bell,
  Eye,
  CheckCircle2
} from 'lucide-react';

const STORAGE_KEY = 'canairy_seen_landing';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    navigate('/dashboard');
  };

  // Features list
  const features = [
    {
      icon: Activity,
      title: 'Real-Time Monitoring',
      description: '35 indicators across economy, security, and society'
    },
    {
      icon: Bell,
      title: 'Early Warnings',
      description: 'Know when to prepare before disruptions hit'
    },
    {
      icon: Shield,
      title: 'Action Plans',
      description: 'Step-by-step guidance for every situation'
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center relative z-10"
      >
        {/* Logo / Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-6">
            <Eye className="w-10 h-10 text-green-400" />
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
          className="text-lg sm:text-xl text-white/40 mb-8 leading-relaxed"
        >
          Your family's early warning system for societal disruptions.
          <br />
          <span className="text-white/60">Like a canary in a coal mine — but for modern risks.</span>
        </motion.p>

        {/* What it does - simple explanation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-8 text-left"
        >
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">
            What You'll See
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">A simple status: Am I okay right now?</p>
                <p className="text-white/40 text-sm">Green means relax. Amber means pay attention. Red means take action.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Clear next steps when things change</p>
                <p className="text-white/40 text-sm">No guessing. Just practical actions: fill your gas tank, stock the pantry, have cash ready.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">The "why" behind every alert</p>
                <p className="text-white/40 text-sm">We explain what's happening in plain English. No jargon, no fear-mongering.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-full"
            >
              <feature.icon className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/60">{feature.title}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={handleEnter}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-[#09090B] rounded-xl font-medium text-lg hover:bg-white/90 transition-all"
        >
          <span>View Your Dashboard</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Subtle note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-xs text-white/20"
        >
          Free to use. No account required. Your data stays on your device.
        </motion.p>
      </motion.div>

      {/* Bottom attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 text-center"
      >
        <p className="text-xs text-white/15">
          Being prepared isn't about fear — it's about confidence.
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
