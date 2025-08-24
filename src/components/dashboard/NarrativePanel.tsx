import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Globe,
  Zap,
  DollarSign,
  Shield,
  Brain,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../core/Card';
import { Badge } from '../core/Badge';
import { cn } from '../../utils/cn';
import { useStore } from '../../store';
import { format } from 'date-fns';

interface NarrativeSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  content: string;
  indicators: string[];
  severity: 'info' | 'warning' | 'critical';
}

export const NarrativePanel: React.FC = () => {
  const { indicators, hopiScore, currentPhase, systemStatus } = useStore();
  
  // Generate narrative based on current system state
  const generateNarrative = (): NarrativeSection[] => {
    const sections: NarrativeSection[] = [];
    const redIndicators = indicators.filter(i => i.status.level === 'red');
    const amberIndicators = indicators.filter(i => i.status.level === 'amber');
    
    // Domain analysis
    const domainStatus = {
      economy: indicators.filter(i => i.domain === 'economy' && i.status.level !== 'green'),
      global_conflict: indicators.filter(i => i.domain === 'global_conflict' && i.status.level !== 'green'),
      energy: indicators.filter(i => i.domain === 'energy' && i.status.level !== 'green'),
      ai_tech: indicators.filter(i => i.domain === 'ai_tech' && i.status.level !== 'green'),
      domestic_control: indicators.filter(i => i.domain === 'domestic_control' && i.status.level !== 'green'),
    };
    
    // Executive Summary
    if (redIndicators.length >= 2 || redIndicators.some(i => i.critical)) {
      sections.push({
        id: 'exec-critical',
        title: 'Critical Alert',
        icon: AlertTriangle,
        content: `Multiple systems are showing signs of significant stress. ${redIndicators.length} indicators have crossed critical thresholds, suggesting coordinated disruption across ${Object.entries(domainStatus).filter(([_, indicators]) => indicators.some(i => i.status.level === 'red')).length} domains. Immediate action is recommended to secure essential resources and review contingency plans.`,
        indicators: redIndicators.map(i => i.name),
        severity: 'critical'
      });
    } else if (redIndicators.length > 0 || amberIndicators.length >= 3) {
      sections.push({
        id: 'exec-warning',
        title: 'Elevated Risk',
        icon: TrendingUp,
        content: `System monitoring has detected elevated risk levels across multiple indicators. While no immediate action is required, enhanced vigilance is recommended. ${amberIndicators.length} indicators are approaching critical thresholds.`,
        indicators: [...redIndicators, ...amberIndicators].map(i => i.name),
        severity: 'warning'
      });
    } else {
      sections.push({
        id: 'exec-stable',
        title: 'System Stable',
        icon: Shield,
        content: 'All monitored systems are operating within normal parameters. No significant threats detected. Continue routine monitoring and maintain standard preparedness levels.',
        indicators: [],
        severity: 'info'
      });
    }
    
    // Economic Analysis
    if (domainStatus.economy.length > 0) {
      const economicReds = domainStatus.economy.filter(i => i.status.level === 'red');
      sections.push({
        id: 'economic',
        title: 'Economic Conditions',
        icon: DollarSign,
        content: economicReds.length > 0 
          ? `Economic indicators suggest increasing market instability. ${economicReds.map(i => i.name).join(', ')} showing critical stress. Consider reducing exposure to volatile assets and increasing cash reserves.`
          : `Economic indicators showing early warning signs. Market volatility increasing but within manageable ranges. Monitor closely for further deterioration.`,
        indicators: domainStatus.economy.map(i => i.name),
        severity: economicReds.length > 0 ? 'warning' : 'info'
      });
    }
    
    // Geopolitical Analysis
    if (domainStatus.global_conflict.length > 0) {
      const conflictReds = domainStatus.global_conflict.filter(i => i.status.level === 'red');
      sections.push({
        id: 'geopolitical',
        title: 'Global Security',
        icon: Globe,
        content: conflictReds.length > 0
          ? `Geopolitical tensions have escalated significantly. ${conflictReds.map(i => i.name).join(', ')} indicate heightened conflict risk. Review travel plans and ensure important documents are secured.`
          : `Geopolitical monitoring shows increased tensions in key regions. While not yet critical, the trend suggests potential for rapid escalation.`,
        indicators: domainStatus.global_conflict.map(i => i.name),
        severity: conflictReds.length > 0 ? 'critical' : 'warning'
      });
    }
    
    // Energy Analysis
    if (domainStatus.energy.length > 0) {
      const energyReds = domainStatus.energy.filter(i => i.status.level === 'red');
      sections.push({
        id: 'energy',
        title: 'Energy Security',
        icon: Zap,
        content: energyReds.length > 0
          ? `Energy infrastructure showing critical stress. ${energyReds.map(i => i.name).join(', ')} at dangerous levels. Verify backup power systems and consider fuel reserves.`
          : `Energy markets showing volatility. Grid stability metrics within acceptable ranges but trending negative. Consider energy conservation measures.`,
        indicators: domainStatus.energy.map(i => i.name),
        severity: energyReds.length > 0 ? 'critical' : 'warning'
      });
    }
    
    // Technology Risk
    if (domainStatus.ai_tech.length > 0) {
      sections.push({
        id: 'tech',
        title: 'Technology Disruption',
        icon: Brain,
        content: `AI and technology indicators suggest increasing systemic risk. ${domainStatus.ai_tech.map(i => i.name).join(', ')} showing concerning patterns. Ensure critical data is backed up and review digital security measures.`,
        indicators: domainStatus.ai_tech.map(i => i.name),
        severity: domainStatus.ai_tech.some(i => i.status.level === 'red') ? 'warning' : 'info'
      });
    }
    
    return sections;
  };
  
  const narrative = generateNarrative();
  const today = format(new Date(), 'MMMM d, yyyy');
  
  const getSeverityColor = (severity: NarrativeSection['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-bmb-danger/50 bg-bmb-danger/5';
      case 'warning':
        return 'border-bmb-warning/50 bg-bmb-warning/5';
      case 'info':
        return 'border-bmb-border';
    }
  };
  
  const getSeverityBadge = (severity: NarrativeSection['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="red" size="sm">CRITICAL</Badge>;
      case 'warning':
        return <Badge variant="amber" size="sm">WARNING</Badge>;
      case 'info':
        return <Badge variant="default" size="sm">INFO</Badge>;
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader separator>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-bmb-accent" />
            Intelligence Briefing
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-bmb-secondary">
            <Calendar className="w-4 h-4" />
            {today}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {narrative.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-lg border transition-all",
                getSeverityColor(section.severity)
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                  section.severity === 'critical' ? 'bg-bmb-danger/20 text-bmb-danger' :
                  section.severity === 'warning' ? 'bg-bmb-warning/20 text-bmb-warning' :
                  'bg-bmb-accent/20 text-bmb-accent'
                )}>
                  <section.icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-medium text-bmb-primary">
                      {section.title}
                    </h3>
                    {getSeverityBadge(section.severity)}
                  </div>
                  
                  <p className="text-sm text-bmb-secondary mb-3 leading-relaxed">
                    {section.content}
                  </p>
                  
                  {section.indicators.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {section.indicators.slice(0, 3).map((indicator, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-bmb-black/30 rounded-md text-bmb-secondary"
                        >
                          {indicator}
                        </span>
                      ))}
                      {section.indicators.length > 3 && (
                        <span className="text-xs px-2 py-1 text-bmb-secondary">
                          +{section.indicators.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <ChevronRight className="w-5 h-5 text-bmb-secondary flex-shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom summary */}
        <div className="mt-6 p-4 bg-bmb-black/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-bmb-secondary">Analysis Confidence: </span>
              <span className="font-medium text-bmb-primary">
                {systemStatus?.dataQuality?.toFixed(0) || 94}%
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-sm text-bmb-accent hover:text-bmb-accent-light transition-colors font-medium"
            >
              Generate Full Report →
            </motion.button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};