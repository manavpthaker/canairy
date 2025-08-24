// Family-friendly messaging for Canairy
export const canairyMessages = {
  // Brand messaging
  brand: {
    tagline: "Your family's gentle early-warning system",
    subtitle: "Stay prepared, stay calm, stay together",
    description: "Canairy helps your family spot changes early and take simple steps to stay resilient.",
  },

  // Status messages
  status: {
    allGood: {
      title: "Everything looks great!",
      message: "Canairy is happy - all indicators are in the green zone. Keep up the great family habits!",
      icon: "happy",
    },
    attention: {
      title: "Time to pay attention",
      message: "Canairy notices some changes. Let's review together and make a simple plan.",
      icon: "alert",
    },
    action: {
      title: "Time to feather your nest!",
      message: "Canairy suggests taking some family actions. Don't worry - we'll guide you step by step.",
      icon: "alert",
    },
  },

  // Indicator transformations
  indicators: {
    // Economic indicators
    MarketVolatility: {
      old: "Market volatility spike",
      new: "Market Weather Check",
      description: "Like checking if it's stormy or calm in the financial markets",
    },
    TreasuryYield: {
      old: "Treasury yield inversion",
      new: "Savings Health Monitor",
      description: "Helps us understand if savings accounts are working normally",
    },
    JoblessClaims: {
      old: "Jobless claims surge",
      new: "Job Market Temperature",
      description: "Shows if lots of families are looking for work",
    },
    GroceryCPI: {
      old: "Food inflation spike",
      new: "Grocery Price Tracker",
      description: "Watches for big changes in food costs",
    },
    GDPGrowth: {
      old: "GDP contraction",
      new: "Economy Growth Chart",
      description: "Shows if businesses are doing well or struggling",
    },

    // Global indicators
    GlobalConflict: {
      old: "Global conflict intensity",
      new: "World Peace Monitor",
      description: "Tracks tensions between countries",
    },
    TaiwanPLA: {
      old: "Taiwan Strait tensions",
      new: "Pacific Region Check",
      description: "Watches for changes in East Asia",
    },
    NATOReadiness: {
      old: "NATO readiness level",
      new: "Alliance Cooperation Score",
      description: "Shows how well countries are working together",
    },
    NuclearTests: {
      old: "Nuclear test activity",
      new: "Global Safety Watch",
      description: "Monitors unusual international activities",
    },

    // Infrastructure
    GridOutage: {
      old: "Grid outage frequency",
      new: "Power Reliability Score",
      description: "Tracks how steady our electricity supply is",
    },
    CISACyber: {
      old: "Cyber attack frequency",
      new: "Internet Safety Check",
      description: "Watches for computer security issues",
    },
    WHODisease: {
      old: "Novel disease H2H transmission",
      new: "Health Alert Monitor",
      description: "Tracks new illnesses spreading between people",
    },

    // Social indicators
    StrikeTracker: {
      old: "Labor strike activity",
      new: "Worker Happiness Index",
      description: "Shows if people are satisfied at work",
    },
    SchoolClosures: {
      old: "School closure rate",
      new: "School Open Tracker",
      description: "Monitors if schools are operating normally",
    },
    PharmacyShortage: {
      old: "Pharmacy shortage reports",
      new: "Medicine Availability",
      description: "Checks if pharmacies have what families need",
    },
  },

  // Action messages
  actions: {
    green: {
      title: "Great job staying prepared!",
      items: [
        "Review your family emergency contacts",
        "Check your emergency kit has fresh batteries",
        "Practice your family meeting place",
        "Update any expired medications",
      ],
    },
    amber: {
      title: "Let's build your family's resilience",
      items: [
        "Top off your gas tank when it hits half full",
        "Add a few extra canned goods to your pantry each shop",
        "Make sure everyone knows the family plan",
        "Check in with neighbors and loved ones",
      ],
    },
    red: {
      title: "Time to activate your family plan",
      items: [
        "Fill up all vehicles with gas today",
        "Stock up on essentials for 2 weeks",
        "Ensure all devices are charged",
        "Touch base with your support network",
        "Review and practice your family emergency plan",
      ],
    },
  },

  // Onboarding
  onboarding: {
    welcome: {
      title: "Welcome to your Canairy nest!",
      steps: [
        "Meet Canairy - your family's friendly guide",
        "Set up your family profile",
        "Choose what matters most to your family",
        "Create your first family action plan",
        "Print your fridge sheet reminder",
      ],
    },
  },

  // Achievements
  achievements: {
    firstWeek: {
      title: "Early Bird!",
      description: "You've been checking Canairy for a week!",
    },
    allGreen: {
      title: "Peaceful Nest",
      description: "All indicators are green - well done!",
    },
    actionComplete: {
      title: "Prepared Parent",
      description: "You completed a family action checklist!",
    },
    neighborHelp: {
      title: "Community Helper",
      description: "You helped a neighbor prepare too!",
    },
  },

  // Tooltips and help
  help: {
    whatIsThis: "Canairy watches many different signals to help your family stay ahead of changes. Like a canary in a coal mine, but friendlier!",
    howItWorks: "We check reliable data sources every hour and let you know if anything important changes. No scary news - just practical steps!",
    whyPrepare: "Being prepared isn't about fear - it's about confidence. Small steps today mean your family stays calm tomorrow.",
  },
};