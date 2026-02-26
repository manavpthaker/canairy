import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { HOPIScore } from '../../types';

interface HOPIGaugeProps {
  score: HOPIScore | null;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const HOPIGauge: React.FC<HOPIGaugeProps> = ({
  score,
  size = 'md',
  showDetails = true,
}) => {
  const sizeConfig = {
    sm: { width: 200, height: 120, strokeWidth: 16, fontSize: 'text-3xl' },
    md: { width: 280, height: 160, strokeWidth: 20, fontSize: 'text-4xl' },
    lg: { width: 360, height: 200, strokeWidth: 24, fontSize: 'text-5xl' },
  };

  const { width, height, strokeWidth, fontSize } = sizeConfig[size];
  const radius = (width - strokeWidth) / 2;
  const centerX = width / 2;
  const centerY = height - 20; // Positioned near bottom

  // Score goes from 0 to 10
  const displayScore = score?.score || 0;
  const normalizedScore = Math.min(1, Math.max(0, displayScore / 10));

  // Arc goes from 180° (left) to 0° (right) - semicircle opening upward
  const startAngle = Math.PI; // 180° (left side)
  const endAngle = 0; // 0° (right side)
  const scoreAngle = startAngle - normalizedScore * Math.PI; // Progress along the arc

  // Convert angle to coordinates
  const polarToCartesian = (angle: number, r: number) => ({
    x: centerX + r * Math.cos(angle),
    y: centerY - r * Math.sin(angle), // Subtract because SVG Y is inverted
  });

  // Create arc path
  const createArc = (startA: number, endA: number, r: number) => {
    const start = polarToCartesian(startA, r);
    const end = polarToCartesian(endA, r);
    const largeArcFlag = Math.abs(startA - endA) > Math.PI ? 1 : 0;
    // Sweep flag: 0 for counter-clockwise (our direction)
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const getScoreColor = () => {
    if (displayScore < 3) return '#10B981'; // Green
    if (displayScore < 6) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getScoreLabel = () => {
    if (displayScore < 3) return 'LOW RISK';
    if (displayScore < 5) return 'MODERATE';
    if (displayScore < 7) return 'ELEVATED';
    return 'CRITICAL';
  };

  const confidence = score?.confidence || 0;
  const phase = score?.phase || 0;

  const getPhaseColor = (p: number) => {
    if (p <= 2) return '#10B981';
    if (p <= 5) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background arc */}
        <path
          d={createArc(startAngle, endAngle, radius)}
          fill="none"
          stroke="#262626"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="hopi-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        {/* Value arc - animated */}
        <motion.path
          d={createArc(startAngle, scoreAngle, radius)}
          fill="none"
          stroke="url(#hopi-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: normalizedScore }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Score indicator dot */}
        <motion.circle
          cx={polarToCartesian(scoreAngle, radius).x}
          cy={polarToCartesian(scoreAngle, radius).y}
          r={strokeWidth / 2 + 2}
          fill={getScoreColor()}
          stroke="#0A0A0A"
          strokeWidth={3}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        />

        {/* Score text - centered below arc */}
        <text
          x={centerX}
          y={centerY - radius / 3}
          textAnchor="middle"
          dominantBaseline="middle"
          className={cn(fontSize, 'font-bold font-mono')}
          fill="#F9FAFB"
        >
          {displayScore.toFixed(1)}
        </text>

        <text
          x={centerX}
          y={centerY - radius / 3 + 30}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm"
          fill="#9CA3AF"
        >
          out of 10
        </text>

        {/* Scale markers */}
        {[0, 2.5, 5, 7.5, 10].map((mark, i) => {
          const markAngle = startAngle - (mark / 10) * Math.PI;
          const innerPos = polarToCartesian(markAngle, radius - strokeWidth / 2 - 8);
          return (
            <text
              key={i}
              x={innerPos.x}
              y={innerPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs"
              fill="#4B5563"
            >
              {mark}
            </text>
          );
        })}
      </svg>

      {/* Details below gauge */}
      {showDetails && score && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 flex items-center gap-6"
        >
          <div className="text-center">
            <div
              className="text-xl font-bold"
              style={{ color: getPhaseColor(phase) }}
            >
              PHASE {phase}
            </div>
            <div className="text-xs text-gray-500">Current</div>
          </div>

          <div className="w-px h-8 bg-[#262626]" />

          <div className="text-center">
            <div className="text-xl font-bold text-white">
              {confidence.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Confidence</div>
          </div>

          <div className="w-px h-8 bg-[#262626]" />

          <div
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-full",
              displayScore < 3 && "bg-green-500/10 text-green-400",
              displayScore >= 3 && displayScore < 6 && "bg-amber-500/10 text-amber-400",
              displayScore >= 6 && "bg-red-500/10 text-red-400"
            )}
          >
            {getScoreLabel()}
          </div>
        </motion.div>
      )}
    </div>
  );
};
