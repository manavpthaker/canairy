/**
 * Signal Content Library
 *
 * Natural-language briefings for families based on indicator patterns.
 * Written conversationally, like someone explaining the situation over coffee.
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
// INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════
export const INFRASTRUCTURE_SIGNAL: SignalContent = {
  category: 'INFRASTRUCTURE STRESS',
  headline: 'Power grid showing strain as cyber threats increase',
  body: 'The grid is under more pressure than usual right now. Outage reports have climbed 23% this quarter, mostly in Texas and the Northeast. At the same time, hackers are actively targeting the systems that run power plants—CISA flagged 4 new industrial exploits this month alone. When these two things happen together, the risk of longer blackouts goes up.',
  whyItMatters: "If the power goes out for more than a day, your freezer starts to go. Your generator can keep the basics running, but only for about 48 hours on a full tank. This is a good week to make sure everything's topped off and ready.",
  actions: [
    { id: 'infra-1', text: 'Fire up the generator to make sure it starts, check the fuel', estimateMinutes: 15 },
    { id: 'infra-2', text: 'Plug in all the battery packs and power stations', estimateMinutes: 5 },
    { id: 'infra-3', text: 'Download offline maps in case cell service gets spotty', estimateMinutes: 10 },
  ],
  indicatorIds: ['cyber_01_cisa_kev', 'grid_01_pjm_outages'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// OIL & ENERGY
// ═══════════════════════════════════════════════════════════════════════════
export const OIL_SECURITY_SIGNAL: SignalContent = {
  category: 'ENERGY SUPPLY',
  headline: 'Oil reserves are getting low—heating costs likely to jump',
  body: 'The Strategic Petroleum Reserve is down to 350 million barrels, which is getting close to levels that have historically spooked markets. Global oil stocks are also running about 8% below normal. Last time things looked like this, heating oil prices jumped 40% in a single quarter. Winter is about three months out.',
  whyItMatters: 'Your oil company tends to raise prices fast when reserves drop like this, and delivery schedules get less reliable. If you usually wait until fall to fill the tank, this year it might be worth calling early—before everyone else has the same idea.',
  actions: [
    { id: 'oil-1', text: 'Call your oil company and schedule an early fill', estimateMinutes: 10 },
    { id: 'oil-2', text: "Check the tank gauge and note where you're at", estimateMinutes: 5 },
    { id: 'oil-3', text: 'Think about backup heating—space heaters, propane, whatever makes sense', estimateMinutes: 20 },
  ],
  indicatorIds: ['spr_01_level', 'oil_03_jodi_inventory', 'oil_02_mbridge_settlements'],
  urgency: 'today',
};

// ═══════════════════════════════════════════════════════════════════════════
// JOBS & LABOR
// ═══════════════════════════════════════════════════════════════════════════
export const LABOR_SIGNAL: SignalContent = {
  category: 'JOBS & LABOR',
  headline: 'Layoffs picking up, especially in tech',
  body: "Tech and logistics companies have ramped up layoffs—announcements are up 45% from last month. Strike activity is also at a five-year high. Jobless claims ticked up to 245,000 last week, which isn't crisis territory, but the trend is heading the wrong direction. On top of that, pharmacy shortages are making some prescriptions harder to fill.",
  whyItMatters: "When layoffs spike in your field, job searches tend to take longer—often 5+ months instead of 3. Worth thinking about whether your emergency fund would cover that. Also a good time to make sure you've got extra refills on any medications you take regularly.",
  actions: [
    { id: 'labor-1', text: 'Dust off the resume and update LinkedIn', estimateMinutes: 45 },
    { id: 'labor-2', text: 'Ask your pharmacy for 90-day refills on essential meds', estimateMinutes: 15 },
    { id: 'labor-3', text: 'Do a quick check on your monthly expenses vs. savings', estimateMinutes: 20 },
  ],
  indicatorIds: ['job_01_strike_days', 'labor_ai_01_layoffs', 'job_01_jobless_claims', 'supply_pharmacy_shortage'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// ECONOMY & MARKETS
// ═══════════════════════════════════════════════════════════════════════════
export const FINANCIAL_SIGNAL: SignalContent = {
  category: 'ECONOMY',
  headline: 'Bond market getting shaky, groceries still climbing',
  body: "Yesterday's Treasury auction didn't go well—the weakest demand since late 2023. That matters because it affects interest rates on everything from mortgages to car loans. Meanwhile, grocery prices are still running hot: eggs up 22%, beef up 15%. The stock market has been swinging 2%+ on 8 of the last 20 trading days, which is a lot of uncertainty.",
  whyItMatters: "If you have an adjustable-rate mortgage, this could mean your payment goes up at the next reset. And if you've noticed your grocery bill creeping higher, you're not imagining it. Might be worth shifting some investments to cash until things settle down.",
  actions: [
    { id: 'fin-1', text: 'Check your mortgage terms—is it adjustable? When does it reset?', estimateMinutes: 15 },
    { id: 'fin-2', text: 'Consider moving a few months of expenses to savings', estimateMinutes: 15 },
    { id: 'fin-3', text: 'Stock up on pantry staples when they go on sale', estimateMinutes: 10 },
  ],
  indicatorIds: ['econ_01_treasury_tail', 'econ_02_grocery_cpi', 'market_01_intraday_swing'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// TRAVEL
// ═══════════════════════════════════════════════════════════════════════════
export const TRAVEL_SIGNAL: SignalContent = {
  category: 'TRAVEL',
  headline: 'Passport renewals taking longer, more travel advisories',
  body: 'Passport processing has slipped to 10-12 weeks, up from the usual 6-8. The State Department has also issued or upgraded travel advisories for 7 countries this month. Border wait times are up 23%, and there have been 4 FAA ground stops due to system issues. International travel is just getting more complicated.',
  whyItMatters: "Most countries require your passport to be valid for at least 6 months after your trip. If anyone in the family has a passport expiring in the next year, now's the time to renew—before the summer rush makes wait times even worse.",
  actions: [
    { id: 'travel-1', text: "Pull out everyone's passports and check the dates", estimateMinutes: 5 },
    { id: 'travel-2', text: 'Submit renewals now for anything expiring within 12 months', estimateMinutes: 45 },
    { id: 'travel-3', text: 'Make sure travel insurance covers trip interruption', estimateMinutes: 15 },
  ],
  indicatorIds: ['state_dept_travel', 'cbp_wait_times', 'faa_ground_stops'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL SITUATION
// ═══════════════════════════════════════════════════════════════════════════
export const GLOBAL_CONFLICT_SIGNAL: SignalContent = {
  category: 'GLOBAL SITUATION',
  headline: 'Tensions rising in Asia and the Middle East',
  body: 'Chinese military activity near Taiwan has been nearly daily for the past month—28 out of 30 days. Three carrier groups are operating in the Western Pacific. NATO has raised its readiness levels, and shipping insurance through the Strait of Hormuz has doubled. None of this means war is imminent, but it does mean the world is more on edge than usual.',
  whyItMatters: 'If something does happen in Taiwan, chip production stops—and that affects everything from your laptop to your car. Might be worth making sure your essential electronics are in good shape, and thinking about whether your investments are too concentrated in companies that depend on Asian manufacturing.',
  actions: [
    { id: 'conflict-1', text: 'Take a look at what your investments are exposed to', estimateMinutes: 30 },
    { id: 'conflict-2', text: 'Make sure your main devices are working well', estimateMinutes: 10 },
    { id: 'conflict-3', text: "Consider grabbing a spare router while they're available", estimateMinutes: 15 },
  ],
  indicatorIds: ['taiwan_pla_activity', 'nato_high_readiness', 'hormuz_war_risk', 'global_conflict_intensity'],
  urgency: 'knowing',
};

// ═══════════════════════════════════════════════════════════════════════════
// DOMESTIC POLICY
// ═══════════════════════════════════════════════════════════════════════════
export const DOMESTIC_CONTROL_SIGNAL: SignalContent = {
  category: 'DOMESTIC POLICY',
  headline: 'Immigration enforcement and processing backlogs increasing',
  body: 'ICE detention facilities are at 94% capacity—the highest since 2019. DHS has issued new enforcement directives this quarter, and National Guard deployments to cities are up 40%. Congress is also considering several bills that would expand surveillance authority. Processing times for visa renewals have gotten longer.',
  whyItMatters: "If anyone in your household is on a visa or has pending immigration paperwork, now's a good time to double-check that everything is current and to confirm timelines with an attorney. Delays and backlogs are real right now.",
  actions: [
    { id: 'domestic-1', text: 'Make sure all immigration documents are current and easy to find', estimateMinutes: 15 },
    { id: 'domestic-2', text: 'Check in with your immigration attorney about timelines', estimateMinutes: 20 },
    { id: 'domestic-3', text: "Review your family's emergency communication plan", estimateMinutes: 15 },
  ],
  indicatorIds: ['ice_detention_surge', 'dhs_removal_expansion', 'national_guard_metros', 'hill_control_legislation'],
  urgency: 'week',
};

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════════════
export const HEALTH_BIOSECURITY_SIGNAL: SignalContent = {
  category: 'HEALTH',
  headline: 'Medication shortages and disease alerts worth watching',
  body: "The FDA's drug shortage list has grown to 137 medications, including some common antibiotics and diabetes drugs. Internationally, WHO has flagged disease outbreaks in 5 countries with confirmed human-to-human transmission. Hospital capacity in 12 states is running above 85%, which doesn't leave much room for a surge.",
  whyItMatters: "If anyone in your family takes daily medication, it's worth checking if it's on the shortage list and asking for a 90-day supply. And while there's no immediate outbreak concern here, it doesn't hurt to make sure your first aid supplies are stocked.",
  actions: [
    { id: 'health-1', text: 'Ask your pharmacy for 90-day refills on critical prescriptions', estimateMinutes: 15 },
    { id: 'health-2', text: 'Restock the first aid kit and basic OTC meds', estimateMinutes: 25 },
    { id: 'health-3', text: 'Make sure your insurance covers telehealth visits', estimateMinutes: 10 },
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
