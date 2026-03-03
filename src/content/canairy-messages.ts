// Direct, clear messaging for Canairy — no metaphors, no cute language
export const canairyMessages = {
  brand: {
    tagline: "Your family's early-warning system",
    subtitle: 'Stay prepared, stay informed, stay together',
    description: 'Canairy tracks public indicators that affect household resilience and tells you when to act.',
  },

  status: {
    allGood: {
      title: 'All indicators normal',
      message: 'All monitored indicators are within safe ranges. No action needed right now.',
      icon: 'happy',
    },
    attention: {
      title: 'Some indicators are elevated',
      message: 'A few indicators have shifted. Review the details below and consider the recommended steps.',
      icon: 'alert',
    },
    action: {
      title: 'Multiple indicators need attention',
      message: 'Several indicators are at critical levels. Review the action checklist and take the recommended steps.',
      icon: 'alert',
    },
  },

  indicators: {
    MarketVolatility: {
      old: 'Market volatility spike',
      new: 'Market Volatility',
      description: 'Tracks large, sudden moves in financial markets that signal institutional stress',
    },
    TreasuryYield: {
      old: 'Treasury yield inversion',
      new: 'Treasury Auction Health',
      description: 'Monitors whether government bond auctions are attracting buyers at normal rates',
    },
    JoblessClaims: {
      old: 'Jobless claims surge',
      new: 'Unemployment Claims',
      description: 'Tracks weekly new filings for unemployment insurance across the US',
    },
    GroceryCPI: {
      old: 'Food inflation spike',
      new: 'Grocery Price Index',
      description: 'Measures how fast food prices are rising compared to wages',
    },
    GDPGrowth: {
      old: 'GDP contraction',
      new: 'Economic Growth',
      description: 'Shows whether the overall economy is growing or shrinking',
    },
    GlobalConflict: {
      old: 'Global conflict intensity',
      new: 'Global Conflict Level',
      description: 'Tracks the number and severity of armed conflicts worldwide',
    },
    TaiwanPLA: {
      old: 'Taiwan Strait tensions',
      new: 'Taiwan Strait Activity',
      description: 'Monitors Chinese military activity near Taiwan, which affects global chip supply',
    },
    NATOReadiness: {
      old: 'NATO readiness level',
      new: 'NATO Force Readiness',
      description: 'Tracks whether NATO has activated high-readiness forces',
    },
    NuclearTests: {
      old: 'Nuclear test activity',
      new: 'Nuclear and Missile Tests',
      description: 'Monitors nuclear and ICBM test activity by any nation',
    },
    GridOutage: {
      old: 'Grid outage frequency',
      new: 'Power Grid Reliability',
      description: 'Tracks how often and how severely the electrical grid fails',
    },
    CISACyber: {
      old: 'Cyber attack frequency',
      new: 'Critical Infrastructure Attacks',
      description: 'Monitors actively exploited vulnerabilities in power, water, and financial systems',
    },
    WHODisease: {
      old: 'Novel disease H2H transmission',
      new: 'Novel Pathogen Tracking',
      description: 'Monitors new diseases spreading between people across countries',
    },
    StrikeTracker: {
      old: 'Labor strike activity',
      new: 'Labor Strike Activity',
      description: 'Tracks the number of workers on strike and affected industries',
    },
    SchoolClosures: {
      old: 'School closure rate',
      new: 'School Operations',
      description: 'Monitors whether schools are operating normally or facing closures',
    },
    PharmacyShortage: {
      old: 'Pharmacy shortage reports',
      new: 'Medication Availability',
      description: 'Tracks reported shortages of common medications at pharmacies',
    },
  },

  actions: {
    green: {
      title: 'Maintain your baseline',
      items: [
        'Review your family emergency contacts',
        'Check your emergency kit has fresh batteries',
        'Confirm your family meeting location',
        'Replace any expired medications',
      ],
    },
    amber: {
      title: 'Increase your readiness',
      items: [
        'Fill vehicle gas tanks when they hit half',
        'Add extra non-perishable food to your pantry',
        'Make sure everyone knows the family plan',
        'Check in with neighbors and extended family',
      ],
    },
    red: {
      title: 'Activate your family plan',
      items: [
        'Fill up all vehicles today',
        'Stock essentials for 2 weeks',
        'Charge all devices and battery packs',
        'Contact your support network',
        'Review and walk through your emergency plan',
      ],
    },
  },

  onboarding: {
    welcome: {
      title: 'Welcome to Canairy',
      steps: [
        'Understand what Canairy monitors and why',
        'Set up your household profile',
        'Choose which indicators matter most to you',
        'Create your first action checklist',
        'Print your refrigerator reference sheet',
      ],
    },
  },

  achievements: {
    firstWeek: {
      title: 'One Week In',
      description: 'You have been monitoring for a full week.',
    },
    allGreen: {
      title: 'All Clear',
      description: 'All indicators are green. Good time to maintain your baseline.',
    },
    actionComplete: {
      title: 'Checklist Complete',
      description: 'You completed an action checklist.',
    },
    neighborHelp: {
      title: 'Community Builder',
      description: 'You helped a neighbor prepare.',
    },
  },

  help: {
    whatIsThis: 'Canairy monitors public data sources that indicate societal stress. When patterns shift, it tells you what changed and what to do about it.',
    howItWorks: 'We check government APIs, financial data, and public reports on a regular schedule. When thresholds are crossed, you get clear guidance on what steps to take.',
    whyPrepare: 'Being prepared is not about fear. It is about having a plan so your family stays calm when things get uncertain.',
  },
};
