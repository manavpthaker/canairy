import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { DataPoint, IndicatorData } from '../../types';
import { format } from 'date-fns';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  TimeScale
);

interface IndicatorChartProps {
  indicator: IndicatorData;
  timeRange?: '24h' | '7d' | '30d' | '90d';
  height?: number;
  className?: string;
}

export const IndicatorChart: React.FC<IndicatorChartProps> = ({
  indicator,
  timeRange = '24h',
  height = 100,
  className
}) => {
  // Chart colors based on indicator status
  const getStatusColor = (level: string, alpha: number = 1) => {
    switch (level) {
      case 'green': return `rgba(16, 185, 129, ${alpha})`;
      case 'amber': return `rgba(245, 158, 11, ${alpha})`;
      case 'red': return `rgba(239, 68, 68, ${alpha})`;
      default: return `rgba(156, 163, 175, ${alpha})`;
    }
  };

  // Generate historical data if not provided
  const generateHistoricalData = (): DataPoint[] => {
    const now = new Date();
    const points: DataPoint[] = [];
    let dataPoints = 24; // Default for 24h

    switch (timeRange) {
      case '7d': dataPoints = 7 * 24; break;
      case '30d': dataPoints = 30; break;
      case '90d': dataPoints = 90; break;
    }

    const currentValue = typeof indicator.status.value === 'number' ? indicator.status.value : 50;
    const volatility = indicator.domain === 'economy' ? 0.1 : 0.05;

    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * (timeRange === '24h' ? 3600000 : 86400000));
      const randomChange = (Math.random() - 0.5) * volatility * currentValue;
      const value = Math.max(0, currentValue + randomChange * (i / dataPoints));
      
      let level: 'green' | 'amber' | 'red' = 'green';
      // Use optional chaining for safety
      const redThreshold = indicator.thresholds?.threshold_red;
      const amberThreshold = indicator.thresholds?.threshold_amber;
      
      if (redThreshold !== undefined && value >= redThreshold) level = 'red';
      else if (amberThreshold !== undefined && value >= amberThreshold) level = 'amber';

      points.push({ timestamp: timestamp.toISOString(), value, level });
    }

    return points;
  };

  const historicalData = indicator.history || generateHistoricalData();

  // Get chart type based on indicator
  const getChartType = () => {
    switch (indicator.id) {
      case 'ice_detention':
        return 'gauge';
      case 'taiwan_zone':
        return 'binary';
      case 'global_conflict_index':
        return 'heatmap';
      case 'vix_volatility':
      case 'treasury_tail':
        return 'area';
      case 'unemployment_rate':
      case 'mbridge_settlement':
        return 'bar';
      case 'hormuz_war_risk':
        return 'area-threshold';
      default:
        return 'line';
    }
  };

  const chartType = getChartType();

  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        titleColor: '#fff',
        bodyColor: '#9CA3AF',
        borderColor: '#262626',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y || context.parsed;
            return `${value.toFixed(2)} ${indicator.unit}`;
          }
        }
      },
    },
  };

  // Render gauge chart for capacity indicators
  if (chartType === 'gauge' && typeof indicator.status.value === 'number') {
    const value = indicator.status.value;
    const remaining = 100 - value;
    
    const data = {
      datasets: [{
        data: [value, remaining],
        backgroundColor: [
          getStatusColor(indicator.status.level),
          'rgba(26, 26, 26, 0.3)'
        ],
        borderWidth: 0,
      }],
    };

    const gaugeOptions = {
      ...commonOptions,
      cutout: '75%',
      rotation: -90,
      circumference: 180,
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          enabled: false
        }
      }
    };

    return (
      <div className={className} style={{ height, position: 'relative' }}>
        <Doughnut data={data} options={gaugeOptions} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center mt-8">
            <div className="text-2xl font-bold text-white">{value}%</div>
            <div className="text-xs text-gray-400">Capacity</div>
          </div>
        </div>
      </div>
    );
  }

  // Render binary state chart for zone indicators
  if (chartType === 'binary') {
    const data = {
      labels: historicalData.map(d => format(new Date(d.timestamp), timeRange === '24h' ? 'HH:mm' : 'MMM dd')),
      datasets: [{
        label: indicator.name,
        data: historicalData.map(d => d.value > 0 ? 1 : 0),
        borderColor: getStatusColor(indicator.status.level),
        backgroundColor: getStatusColor(indicator.status.level, 0.1),
        stepped: true,
        fill: true,
      }],
    };

    const binaryOptions = {
      ...commonOptions,
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: {
            stepSize: 1,
            callback: (value: any) => value === 1 ? 'Active' : 'Inactive',
            color: '#9CA3AF',
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.1)',
          }
        },
        x: {
          ticks: {
            color: '#9CA3AF',
            maxRotation: 0,
          },
          grid: {
            display: false,
          }
        }
      }
    };

    return (
      <div className={className} style={{ height }}>
        <Line data={data} options={binaryOptions} />
      </div>
    );
  }

  // Render area chart for volatility indicators
  if (chartType === 'area') {
    const data = {
      labels: historicalData.map(d => format(new Date(d.timestamp), timeRange === '24h' ? 'HH:mm' : 'MMM dd')),
      datasets: [{
        label: indicator.name,
        data: historicalData.map(d => d.value),
        borderColor: getStatusColor(indicator.status.level),
        backgroundColor: getStatusColor(indicator.status.level, 0.2),
        fill: true,
        tension: 0.4,
      }],
    };

    // Add threshold lines
    const thresholdDatasets: any[] = [];
    const chartAmberThreshold = indicator.thresholds?.threshold_amber;
    const chartRedThreshold = indicator.thresholds?.threshold_red;

    if (chartAmberThreshold !== undefined) {
      thresholdDatasets.push({
        label: 'Amber Threshold',
        data: Array(historicalData.length).fill(chartAmberThreshold),
        borderColor: getStatusColor('amber', 0.5),
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      });
    }
    if (chartRedThreshold !== undefined) {
      thresholdDatasets.push({
        label: 'Red Threshold',
        data: Array(historicalData.length).fill(chartRedThreshold),
        borderColor: getStatusColor('red', 0.5),
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      });
    }

    data.datasets.push(...thresholdDatasets);

    const areaOptions = {
      ...commonOptions,
      scales: {
        y: {
          ticks: {
            color: '#9CA3AF',
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.1)',
          }
        },
        x: {
          ticks: {
            color: '#9CA3AF',
            maxRotation: 0,
          },
          grid: {
            display: false,
          }
        }
      }
    };

    return (
      <div className={className} style={{ height }}>
        <Line data={data} options={areaOptions} />
      </div>
    );
  }

  // Render bar chart for certain indicators
  if (chartType === 'bar') {
    const data = {
      labels: historicalData.slice(-10).map(d => format(new Date(d.timestamp), timeRange === '24h' ? 'HH:mm' : 'MMM dd')),
      datasets: [{
        label: indicator.name,
        data: historicalData.slice(-10).map(d => d.value),
        backgroundColor: historicalData.slice(-10).map(d => getStatusColor(d.level, 0.7)),
        borderColor: historicalData.slice(-10).map(d => getStatusColor(d.level)),
        borderWidth: 1,
      }],
    };

    const barOptions = {
      ...commonOptions,
      scales: {
        y: {
          ticks: {
            color: '#9CA3AF',
            callback: (value: any) => `${value} ${indicator.unit}`,
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.1)',
          }
        },
        x: {
          ticks: {
            color: '#9CA3AF',
          },
          grid: {
            display: false,
          }
        }
      }
    };

    return (
      <div className={className} style={{ height }}>
        <Bar data={data} options={barOptions} />
      </div>
    );
  }

  // Render area chart with threshold zones
  if (chartType === 'area-threshold') {
    const data = {
      labels: historicalData.map(d => format(new Date(d.timestamp), timeRange === '24h' ? 'HH:mm' : 'MMM dd')),
      datasets: [
        {
          label: indicator.name,
          data: historicalData.map(d => d.value),
          borderColor: getStatusColor(indicator.status.level),
          backgroundColor: getStatusColor(indicator.status.level, 0.2),
          fill: true,
          tension: 0.4,
        }
      ],
    };

    // Add colored zones for thresholds
    const areaAmberThreshold = indicator.thresholds?.threshold_amber;
    const areaRedThreshold = indicator.thresholds?.threshold_red;

    if (areaRedThreshold !== undefined && areaAmberThreshold !== undefined) {
      data.datasets.unshift({
        label: 'Critical Zone',
        data: Array(historicalData.length).fill(100), // Re-evaluate this '100' if it's not a universal max
        backgroundColor: getStatusColor('red', 0.1),
        fill: '+1',
        pointRadius: 0,
        borderWidth: 0,
      } as any);
      
      data.datasets.unshift({
        label: 'Warning Zone',
        data: Array(historicalData.length).fill(areaRedThreshold),
        backgroundColor: getStatusColor('amber', 0.1),
        fill: '+1',
        pointRadius: 0,
        borderWidth: 0,
      } as any);
      
      data.datasets.unshift({
        label: 'Safe Zone',
        data: Array(historicalData.length).fill(areaAmberThreshold),
        backgroundColor: getStatusColor('green', 0.1),
        fill: 'origin',
        pointRadius: 0,
        borderWidth: 0,
      } as any);
    }

    const areaThresholdOptions = {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        legend: {
          display: false,
        },
        tooltip: {
          ...commonOptions.plugins.tooltip,
          filter: (item: any) => item.datasetIndex === data.datasets.length - 1,
        }
      },
      scales: {
        y: {
          max: indicator.id === 'hormuz_war_risk' ? 0.2 : undefined,
          ticks: {
            color: '#9CA3AF',
            callback: (value: any) => {
              if (indicator.id === 'hormuz_war_risk') {
                return `${(value * 100).toFixed(3)}%`;
              }
              return `${value} ${indicator.unit}`;
            }
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.1)',
          }
        },
        x: {
          ticks: {
            color: '#9CA3AF',
            maxRotation: 0,
          },
          grid: {
            display: false,
          }
        }
      }
    };

    return (
      <div className={className} style={{ height }}>
        <Line data={data} options={areaThresholdOptions} />
      </div>
    );
  }

  // Default line chart
  const data = {
    labels: historicalData.map(d => format(new Date(d.timestamp), timeRange === '24h' ? 'HH:mm' : 'MMM dd')),
    datasets: [{
      label: indicator.name,
      data: historicalData.map(d => d.value),
      borderColor: getStatusColor(indicator.status.level),
      backgroundColor: getStatusColor(indicator.status.level, 0.1),
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.3,
    }],
  };

  const lineOptions = {
    ...commonOptions,
    scales: {
      y: {
        ticks: {
          color: '#9CA3AF',
          callback: (value: any) => `${value} ${indicator.unit}`,
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        }
      },
      x: {
        ticks: {
          color: '#9CA3AF',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div className={className} style={{ height }}>
      <Line data={data} options={lineOptions} />
    </div>
  );
};