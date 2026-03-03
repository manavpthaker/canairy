import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_STEPS = [
  { text: 'Connecting to data sources', delay: 0 },
  { text: 'Checking economic indicators', delay: 600 },
  { text: 'Scanning global conflict signals', delay: 1200 },
  { text: 'Reviewing infrastructure status', delay: 1800 },
  { text: 'Analyzing supply chain and energy', delay: 2400 },
  { text: 'Calculating risk scores', delay: 3000 },
  { text: 'Building your dashboard', delay: 3600 },
];

interface StreamingLoaderProps {
  loading: boolean;
  hasData: boolean;
}

export const StreamingLoader: React.FC<StreamingLoaderProps> = ({ loading, hasData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!loading || hasData) {
      // Fade out after data arrives
      const timeout = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timeout);
    }

    setVisible(true);
    setCurrentStep(0);

    const timers = LOADING_STEPS.map((step, idx) =>
      setTimeout(() => setCurrentStep(idx), step.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [loading, hasData]);

  if (!visible || hasData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #12121A 0%, #0A0A0C 70%)' }}
      >
        <div className="flex flex-col items-center gap-8 px-6 max-w-md w-full">
          {/* Logo / Brand */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Canairy
            </h1>
            <p className="text-xs text-white/30 mt-1">Early warning for your household</p>
          </motion.div>

          {/* Animated ring */}
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="3"
              />
              <motion.circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="url(#loaderGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={213.6}
                initial={{ strokeDashoffset: 213.6 }}
                animate={{ strokeDashoffset: 213.6 - (213.6 * ((currentStep + 1) / LOADING_STEPS.length)) }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono text-white/40">
                {Math.round(((currentStep + 1) / LOADING_STEPS.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Streaming status lines */}
          <div className="w-full space-y-2">
            {LOADING_STEPS.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: idx <= currentStep ? 1 : 0,
                  x: idx <= currentStep ? 0 : -10,
                }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
                  idx < currentStep
                    ? 'bg-green-500'
                    : idx === currentStep
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-white/10'
                }`} />
                <span className={`text-sm transition-colors duration-300 ${
                  idx < currentStep
                    ? 'text-white/30'
                    : idx === currentStep
                      ? 'text-white/60'
                      : 'text-white/10'
                }`}>
                  {step.text}
                  {idx < currentStep && (
                    <span className="text-green-500/60 ml-2">done</span>
                  )}
                  {idx === currentStep && (
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-white/30 ml-1"
                    >
                      ...
                    </motion.span>
                  )}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
