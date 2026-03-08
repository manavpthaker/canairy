/**
 * Signal Content Library
 *
 * Predefined content for signal cards based on indicator patterns.
 * Each signal includes household-specific "why it matters" explanations
 * and actionable "what to do" items with time estimates.
 *
 * These actions flow UP into the action plan's "This week" section.
 */

import { ActionItem } from '../components/dashboard/LeadCard';

export interface SignalContent {
  category: string;
  headline: string;
  body: string;
  whyItMatters: string;
  actions: ActionItem[];
  indicatorIds: string[];
  urgency: 'today' | 'week' | 'knowing';
}

// ═══════════════════════════════════════════════════════════════════════════
// INFRASTRUCTURE UNDER SUSTAINED ATTACK
// ═══════════════════════════════════════════════════════════════════════════
export const INFRASTRUCTURE_SIGNAL: SignalContent = {
  category: 'INFRASTRUCTURE UNDER SUSTAINED ATTACK',
  headline: 'Grid and cyber vulnerabilities at elevated levels',
  body: 'CISA has added 12 new exploits to the Known Exploited Vulnerabilities catalog this month, with 4 targeting industrial control systems. Simultaneously, grid disturbance reports are up 23% quarter-over-quarter, with Texas and the Northeast showing the most strain. The convergence of cyber vulnerabilities and physical grid stress creates compounding risk for extended outages.',
  whyItMatters: 'Your home runs on PJM grid power and Verizon fiber. When grid operators face simultaneous cyber and physical threats, rolling blackouts become more likely—especially during peak demand. Your generator only covers essentials for 48 hours, and the chest freezer will spoil after 24 hours without power.',
  actions: [
    {
      id: 'infra-1',
      text: 'Test generator startup and check fuel level',
      estimateMinutes: 15,
    },
    {
      id: 'infra-2',
      text: 'Charge all portable battery packs and power stations',
      estimateMinutes: 5,
    },
    {
      id: 'infra-3',
      text: 'Download offline maps and save emergency contacts to paper',
      estimateMinutes: 20,
    },
  ],
  indicatorIds: ['cyber_01_cisa_kev', 'grid_01_pjm_outages'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// OIL SECURITY SLIPPING
// ═══════════════════════════════════════════════════════════════════════════
export const OIL_SECURITY_SIGNAL: SignalContent = {
  category: 'OIL SECURITY SLIPPING',
  headline: 'Strategic Petroleum Reserve nearing danger zone, could trigger fuel shortages',
  body: 'The US Strategic Petroleum Reserve has dwindled to just 350 million barrels, dangerously close to the 400 million barrel threshold that has historically triggered supply concerns. Meanwhile, JODI inventory data shows global crude stocks 8% below the 5-year average, and mBridge settlements in non-dollar currencies reached 23% of Gulf crude transactions last month.',
  whyItMatters: 'Your oil tank runs on ULSD delivered by Petro. When the SPR drops this low, heating oil prices spike within weeks and delivery schedules get unreliable. Last time reserves hit this level in 2022, your heating costs jumped 40% in one quarter. Winter is 3 months away.',
  actions: [
    {
      id: 'oil-1',
      text: 'Call Petro to schedule an early fill before price increases',
      estimateMinutes: 10,
    },
    {
      id: 'oil-2',
      text: 'Check oil tank gauge and note current level',
      estimateMinutes: 5,
    },
    {
      id: 'oil-3',
      text: 'Research backup heating options (electric space heaters, propane)',
      estimateMinutes: 30,
    },
  ],
  indicatorIds: ['spr_01_level', 'oil_03_jodi_inventory', 'oil_02_mbridge_settlements'],
  urgency: 'today',
};

// ═══════════════════════════════════════════════════════════════════════════
// LABOR DISRUPTIONS
// ═══════════════════════════════════════════════════════════════════════════
export const LABOR_SIGNAL: SignalContent = {
  category: 'LABOR DISRUPTIONS',
  headline: 'Strike activity and layoff announcements accelerating',
  body: 'Cornell strike tracker shows 2.3 million worker-days lost to strikes this quarter, the highest since 2019. Simultaneously, tech and logistics layoffs have jumped 45% month-over-month. Jobless claims ticked up to 245,000 last week, still below recession thresholds but trending in the wrong direction. Pharmacy and medication shortages are at 18-month highs.',
  whyItMatters: 'Your household relies on two tech-sector incomes. When layoff announcements spike in your industry vertical, the typical time-to-new-job extends from 3 months to 5+ months. Your current emergency fund covers 4 months of expenses. The pharmacy shortage also affects your recurring prescriptions.',
  actions: [
    {
      id: 'labor-1',
      text: 'Review and update LinkedIn profile and resume',
      estimateMinutes: 45,
    },
    {
      id: 'labor-2',
      text: 'Request 90-day prescription refills for essential medications',
      estimateMinutes: 15,
    },
    {
      id: 'labor-3',
      text: 'Calculate exact monthly burn rate and runway',
      estimateMinutes: 20,
    },
  ],
  indicatorIds: ['job_01_strike_days', 'labor_ai_01_layoffs', 'job_01_jobless_claims', 'supply_pharmacy_shortage'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// FINANCIAL DISTRESS
// ═══════════════════════════════════════════════════════════════════════════
export const FINANCIAL_SIGNAL: SignalContent = {
  category: 'FINANCIAL DISTRESS',
  headline: 'Treasury market stress and grocery inflation squeezing households',
  body: 'The 10-year Treasury auction tailed by 4.2 basis points yesterday—the widest miss since September 2023—signaling weak demand for US debt. Grocery CPI is running at 4.8% annually, with eggs up 22% and beef up 15%. Intraday market swings have exceeded 2% on 8 of the last 20 trading days, indicating elevated uncertainty.',
  whyItMatters: 'Your mortgage rate adjusts annually based on Treasury yields. A sustained Treasury selloff could push your next adjustment 50-75 basis points higher, adding $200-300/month to your payment. Meanwhile, your grocery budget is already $150/month over target. Your 529 contributions are exposed to the daily volatility.',
  actions: [
    {
      id: 'fin-1',
      text: 'Review mortgage terms and calculate potential rate adjustment impact',
      estimateMinutes: 20,
    },
    {
      id: 'fin-2',
      text: 'Move 3 months of expenses to high-yield savings if in market',
      estimateMinutes: 15,
    },
    {
      id: 'fin-3',
      text: 'Adjust grocery shopping to focus on sales and bulk staples',
      estimateMinutes: 10,
    },
  ],
  indicatorIds: ['econ_01_treasury_tail', 'econ_02_grocery_cpi', 'market_01_intraday_swing'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// TRAVEL RESTRICTIONS
// ═══════════════════════════════════════════════════════════════════════════
export const TRAVEL_SIGNAL: SignalContent = {
  category: 'TRAVEL RESTRICTIONS',
  headline: 'Passport processing delays and international travel advisories expanding',
  body: 'State Department passport processing has slipped to 10-12 weeks for routine applications, up from 6-8 weeks last quarter. Travel advisories have been issued or upgraded for 7 countries in the past 30 days. CBP is reporting 23% longer wait times at major ports of entry, and the FAA has issued 4 ground stops this month due to system issues.',
  whyItMatters: 'Your family has passports expiring in 8 months and 14 months. The expiration window for visa-free travel is typically 6 months—meaning one passport is effectively unusable for international trips already. Your planned spring break trip to Mexico requires valid passports with 6+ months validity.',
  actions: [
    {
      id: 'travel-1',
      text: 'Check passport expiration dates for all family members',
      estimateMinutes: 5,
    },
    {
      id: 'travel-2',
      text: 'Submit renewal applications now if expiring within 12 months',
      estimateMinutes: 45,
    },
    {
      id: 'travel-3',
      text: 'Review travel insurance coverage for trip interruption',
      estimateMinutes: 15,
    },
  ],
  indicatorIds: ['state_dept_travel', 'cbp_wait_times', 'faa_ground_stops'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL SIGNALS
// ═══════════════════════════════════════════════════════════════════════════

export const GLOBAL_CONFLICT_SIGNAL: SignalContent = {
  category: 'GLOBAL CONFLICT ESCALATION',
  headline: 'Taiwan strait activity and NATO readiness at multi-year highs',
  body: 'PLA air and naval incursions into Taiwan\'s ADIZ have occurred on 28 of the last 30 days, with 3 carrier groups now operating in the Western Pacific. NATO has raised readiness levels for rapid reaction forces, and Hormuz war-risk insurance premiums have doubled since January. ACLED reports global armed conflict fatalities up 34% year-over-year.',
  whyItMatters: 'Your investment portfolio has 15% exposure to semiconductor stocks, heavily dependent on Taiwan foundries. A Taiwan crisis would immediately halt chip production, crushing those positions. More broadly, your household electronics, car, and appliances all contain Taiwan-sourced chips—replacements would be delayed months.',
  actions: [
    {
      id: 'conflict-1',
      text: 'Review portfolio exposure to Taiwan/China-dependent companies',
      estimateMinutes: 30,
    },
    {
      id: 'conflict-2',
      text: 'Ensure essential electronics (laptop, phone) are current and working',
      estimateMinutes: 10,
    },
    {
      id: 'conflict-3',
      text: 'Consider purchasing backup router and modem now',
      estimateMinutes: 15,
    },
  ],
  indicatorIds: ['taiwan_pla_activity', 'nato_high_readiness', 'hormuz_war_risk', 'global_conflict_intensity'],
  urgency: 'knowing',
};

export const DOMESTIC_CONTROL_SIGNAL: SignalContent = {
  category: 'DOMESTIC CONTROL MEASURES',
  headline: 'ICE detention capacity and enforcement actions expanding',
  body: 'ICE detention facilities are operating at 94% capacity, the highest level since 2019. DHS has issued 3 new removal expansion directives this quarter. National Guard deployments to metropolitan areas have increased 40%, and Congress is considering 12 bills that would expand surveillance authority or restrict civil liberties.',
  whyItMatters: 'Your household includes one family member on a work visa with renewal pending. Increased enforcement activity and processing backlogs could delay renewal by 3-6 months, creating employment authorization gaps. The expanding surveillance authorities also affect your privacy expectations for communications and travel.',
  actions: [
    {
      id: 'domestic-1',
      text: 'Verify all immigration documents are current and accessible',
      estimateMinutes: 15,
    },
    {
      id: 'domestic-2',
      text: 'Contact immigration attorney to confirm renewal timeline',
      estimateMinutes: 20,
    },
    {
      id: 'domestic-3',
      text: 'Review household emergency communication plan',
      estimateMinutes: 15,
    },
  ],
  indicatorIds: ['ice_detention_surge', 'dhs_removal_expansion', 'national_guard_metros', 'hill_control_legislation'],
  urgency: 'week',
};

export const HEALTH_BIOSECURITY_SIGNAL: SignalContent = {
  category: 'HEALTH & BIOSECURITY',
  headline: 'Disease outbreak alerts and medication shortages at concerning levels',
  body: 'WHO has issued disease outbreak alerts for 5 countries with human-to-human transmission confirmed. Domestically, the FDA drug shortage list has grown to 137 medications, including common antibiotics and diabetes drugs. Hospital capacity in 12 states is above 85%, leaving little surge capacity.',
  whyItMatters: 'Your household includes a family member who takes daily medication for a chronic condition. That specific medication is on the FDA watch list for potential shortage. Additionally, your children\'s school district has no remote learning infrastructure anymore—an outbreak would mean missed education.',
  actions: [
    {
      id: 'health-1',
      text: 'Request 90-day supplies of all critical prescriptions',
      estimateMinutes: 15,
    },
    {
      id: 'health-2',
      text: 'Restock household first aid and OTC medication supplies',
      estimateMinutes: 25,
    },
    {
      id: 'health-3',
      text: 'Verify health insurance coverage for telehealth visits',
      estimateMinutes: 10,
    },
  ],
  indicatorIds: ['bio_01_h2h_countries', 'supply_pharmacy_shortage'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// SIGNAL LOOKUP BY DOMAIN
// ═══════════════════════════════════════════════════════════════════════════

export const SIGNAL_CONTENT_BY_DOMAIN: Record<string, SignalContent> = {
  'security_infrastructure': INFRASTRUCTURE_SIGNAL,
  'oil_axis': OIL_SECURITY_SIGNAL,
  'energy': OIL_SECURITY_SIGNAL,
  'jobs_labor': LABOR_SIGNAL,
  'economy': FINANCIAL_SIGNAL,
  'travel_mobility': TRAVEL_SIGNAL,
  'aviation': TRAVEL_SIGNAL,
  'global_conflict': GLOBAL_CONFLICT_SIGNAL,
  'domestic_control': DOMESTIC_CONTROL_SIGNAL,
  'supply_chain': HEALTH_BIOSECURITY_SIGNAL,
};

/**
 * Get signal content based on elevated indicators
 */
export function getSignalContentForIndicators(
  indicatorIds: string[],
  domain: string
): SignalContent | null {
  return SIGNAL_CONTENT_BY_DOMAIN[domain] || null;
}

/**
 * Generate a unique action ID for tracking completion
 */
export function generateActionId(signalId: string, index: number): string {
  return `${signalId}-action-${index}`;
}
