// Straightforward messaging for Canairy
export const canairyMessages = {
  // Brand messaging
  brand: {
    tagline: "Early warning for your household",
    subtitle: "Stay informed, stay prepared, stay ahead",
    description: "Canairy tracks real-world indicators and tells you when to take action.",
  },

  // Status messages
  status: {
    allGood: {
      title: "All clear",
      message: "All indicators are in normal range. Nothing needs your attention right now.",
      icon: "happy",
    },
    attention: {
      title: "Some things to watch",
      message: "A few indicators are shifting. Review the details and decide if action is needed.",
      icon: "alert",
    },
    action: {
      title: "Action needed",
      message: "Multiple indicators are elevated. Check the action checklist for specific steps.",
      icon: "alert",
    },
  },

  // Indicator names — real names, no sugarcoating
  indicators: {
    MarketVolatility: {
      old: "Market volatility spike",
      new: "Market Volatility",
      description: "Measures how much bond markets are swinging in a single day",
    },
    TreasuryYield: {
      old: "Treasury yield inversion",
      new: "Treasury Auction Tail",
      description: "How much extra yield buyers demand at Treasury auctions",
    },
    JoblessClaims: {
      old: "Jobless claims surge",
      new: "Jobless Claims",
      description: "Weekly count of new unemployment filings",
    },
    GroceryCPI: {
      old: "Food inflation spike",
      new: "Grocery CPI",
      description: "Annualized rate of food price increases",
    },
    GDPGrowth: {
      old: "GDP contraction",
      new: "GDP Growth",
      description: "Whether the economy is growing or shrinking",
    },

    // Global indicators
    GlobalConflict: {
      old: "Global conflict intensity",
      new: "Global Conflict Intensity",
      description: "Number of active battle events worldwide",
    },
    TaiwanPLA: {
      old: "Taiwan Strait tensions",
      new: "Taiwan PLA Incursions",
      description: "Chinese military aircraft entering Taiwan's air defense zone",
    },
    NATOReadiness: {
      old: "NATO readiness level",
      new: "NATO High Readiness",
      description: "NATO force activations signaling escalation risk",
    },
    NuclearTests: {
      old: "Nuclear test activity",
      new: "Nuclear/Missile Tests",
      description: "Nuclear detonation and ICBM launch tests",
    },

    // Infrastructure
    GridOutage: {
      old: "Grid outage frequency",
      new: "Grid Outages",
      description: "Major power outages affecting 50K+ customers",
    },
    CISACyber: {
      old: "Cyber attack frequency",
      new: "CISA Cyber Threats",
      description: "Known exploited vulnerabilities in critical infrastructure",
    },
    WHODisease: {
      old: "Novel disease H2H transmission",
      new: "Novel Pathogen Alert",
      description: "Countries with new human-to-human disease transmission",
    },

    // Social indicators
    StrikeTracker: {
      old: "Labor strike activity",
      new: "Strike Activity",
      description: "Monthly worker-days lost to strikes",
    },
    SchoolClosures: {
      old: "School closure rate",
      new: "School Closures",
      description: "Rate of school closures across the country",
    },
    PharmacyShortage: {
      old: "Pharmacy shortage reports",
      new: "Pharmacy Shortages",
      description: "Reports of prescription medication unavailability",
    },
  },

  // Action messages
  actions: {
    green: {
      title: "All clear — stay ready",
      items: [
        "Review your family emergency contacts",
        "Check your emergency kit has fresh batteries",
        "Confirm your family meeting place",
        "Update any expired medications",
      ],
    },
    amber: {
      title: "Things are shifting — take simple steps",
      items: [
        "Top off your gas tank when it hits half full",
        "Add a few extra canned goods to your pantry each shop",
        "Make sure everyone in the family knows the plan",
        "Check in with neighbors and loved ones",
      ],
    },
    red: {
      title: "Action needed — follow the checklist",
      items: [
        "Fill up all vehicles with gas today",
        "Stock up on essentials for 2 weeks",
        "Charge all devices and power banks",
        "Touch base with your support network",
        "Review and run through your family emergency plan",
      ],
    },
  },

  // Onboarding
  onboarding: {
    welcome: {
      title: "Welcome to Canairy",
      steps: [
        "How Canairy works",
        "Set up your household profile",
        "Choose what matters most to you",
        "Create your first action plan",
        "Print your fridge sheet",
      ],
    },
  },

  // Achievements
  achievements: {
    firstWeek: {
      title: "One Week In",
      description: "You've been monitoring for a week.",
    },
    allGreen: {
      title: "All Clear",
      description: "Every indicator is green.",
    },
    actionComplete: {
      title: "Checklist Done",
      description: "You completed an action checklist.",
    },
    neighborHelp: {
      title: "Community Ready",
      description: "You helped a neighbor prepare.",
    },
  },

  // Help
  help: {
    whatIsThis: "Canairy tracks public data sources — treasury auctions, CISA alerts, conflict events, shipping rates — and tells you when they cross thresholds that matter for your household.",
    howItWorks: "We check data sources regularly and flag anything that crosses from green to amber or red. Each indicator has clear thresholds based on historical precedents.",
    whyPrepare: "Small steps now mean less scrambling later. Being prepared isn't about fear — it's about having a plan before you need one.",
  },
};
