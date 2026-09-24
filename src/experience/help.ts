/**
 * Where to get real help, and what it's typically worth.
 *
 * Every dollar figure is from the program's own official source (checked
 * 2026-09-24); `money` is omitted where no official figure exists. These are
 * national averages, not a promise of what any household will get.
 */

import { Household } from './household';

export interface HelpResource {
  id: string;
  name: string;
  url: string;
  who: string;
  money?: string; // "Dollars in pockets": official average or maximum
  moneySource?: string;
}

export const HELP: Record<string, HelpResource> = {
  ui: {
    id: 'ui', name: 'Unemployment insurance',
    url: 'https://www.careeronestop.org/LocalHelp/UnemploymentBenefits/find-unemployment-benefits.aspx',
    who: 'If you lose your job, file in your state right away.',
    money: 'Averages $501 a week nationally (DOL, Q2 2026).',
    moneySource: 'https://oui.doleta.gov/unemploy/data_summary/DataSum.asp',
  },
  snap: {
    id: 'snap', name: 'SNAP food benefits',
    url: 'https://www.fna.usda.gov/snap/state-directory',
    who: 'Help buying groceries for lower-income households.',
    money: 'Averages $189 per person each month (USDA, FY2025).',
    moneySource: 'https://www.fna.usda.gov/pd/supplemental-nutrition-assistance-program-snap',
  },
  wic: {
    id: 'wic', name: 'WIC',
    url: 'https://www.fna.usda.gov/wic/apply',
    who: 'Food help for pregnant women, new moms and kids under 5.',
    money: 'Averages $65 per person each month in food (USDA, FY2025, preliminary).',
    moneySource: 'https://www.fna.usda.gov/pd/wic-program',
  },
  liheap: {
    id: 'liheap', name: 'Heating and cooling help (LIHEAP)',
    url: 'https://www.energyhelp.us/',
    who: 'Help paying energy bills. You can also call 1-866-674-6327.',
    money: 'Averaged $662 per household for heating (HHS, FY2022).',
    moneySource: 'https://acf.gov/sites/default/files/documents/ocs/RPT_LIHEAP_RTC07TblAvgBenefitsFNs_FY2022-compliant.pdf',
  },
  wap: {
    id: 'wap', name: 'Free home weatherization',
    url: 'https://www.energy.gov/cmei/scep/wap/how-apply-weatherization-assistance',
    who: 'Free insulation and energy fixes for owners and renters with lower incomes.',
    money: 'Saves $372 or more a year on energy (DOE).',
    moneySource: 'https://www.energy.gov/scep/wap/weatherization-assistance-program',
  },
  fema: {
    id: 'fema', name: 'FEMA disaster assistance',
    url: 'https://www.disasterassistance.gov/',
    who: 'If you live in a declared disaster area, apply here first.',
    money: 'Up to $43,600 for housing, plus up to $43,600 for other needs (FEMA).',
    moneySource: 'https://www.federalregister.gov/documents/2024/10/24/2024-24700/notice-of-maximum-amount-of-assistance-under-the-individuals-and-households-program',
  },
  counsel: {
    id: 'counsel', name: 'Free housing counselor',
    url: 'https://www.consumerfinance.gov/find-a-housing-counselor/',
    who: 'HUD-approved help with rent, mortgages, foreclosure or credit. Often free.',
  },
  lifeline: {
    id: 'lifeline', name: 'Lifeline phone and internet discount',
    url: 'https://www.lifelinesupport.org/',
    who: 'For households on SNAP or Medicaid, or with lower incomes.',
    money: 'Up to $9.25 off each month (FCC).',
    moneySource: 'https://www.lifelinesupport.org/',
  },
  help211: {
    id: 'help211', name: '211 local help line',
    url: 'https://www.211.org/',
    who: 'Free, confidential help with food, housing, bills or recovery. Dial 211.',
  },
  fdic: {
    id: 'fdic', name: 'Check your bank is insured',
    url: 'https://banks.data.fdic.gov/bankfind-suite/bankfind',
    who: 'Deposits are insured up to $250,000 per person, per bank, per account type.',
  },
  fdaShortage: {
    id: 'fdaShortage', name: 'FDA drug shortage lookup',
    url: 'https://www.accessdata.fda.gov/scripts/drugshortages/default.cfm',
    who: 'Search your family’s medicines by name.',
  },
  cisa: {
    id: 'cisa', name: 'Secure Our World (CISA)',
    url: 'https://www.cisa.gov/secure-our-world',
    who: 'Four simple steps to protect your accounts and devices.',
  },
  eitc: {
    id: 'eitc', name: 'Earned income tax credit and free filing',
    url: 'https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free',
    who: 'A tax credit for working people with lower or moderate incomes.',
    money: 'Averaged about $2,894 (IRS, tax year 2024).',
    moneySource: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/eitc-reports-and-statistics',
  },
  fuel: {
    id: 'fuel', name: 'Gas-saving driving tips',
    url: 'https://www.fueleconomy.gov/feg/driveHabits.jsp',
    who: 'Simple habits that stretch each tank.',
    money: 'Gentle driving saves $0.43–$1.73 per gallon (fueleconomy.gov).',
    moneySource: 'https://www.fueleconomy.gov/feg/driveHabits.jsp',
  },
};

/** Help that fits each indicator, most useful first. */
const HELP_FOR: Record<string, string[]> = {
  job_01_jobless_claims: ['ui', 'snap', 'help211'],
  job_02_continuing_claims: ['ui', 'snap', 'help211'],
  job_04_sahm_rule: ['ui', 'snap'],
  job_03_real_wages: ['eitc', 'snap', 'lifeline'],
  green_g1_gdp_rates: ['eitc', 'ui'],
  econ_02_grocery_cpi: ['snap', 'wic'],
  cost_beef: ['snap', 'wic'],
  energy_gas_price: ['fuel'],
  oil_brent_price: ['fuel', 'liheap'],
  spr_01_level: ['liheap'],
  energy_03_electricity_cpi: ['liheap', 'wap'],
  energy_02_nat_gas_storage: ['liheap', 'wap'],
  housing_04_rent_cpi: ['counsel', 'help211'],
  housing_01_delinquency: ['counsel', 'help211'],
  housing_03_rate_shock: ['counsel'],
  debt_01_card_delinquency: ['counsel', 'help211'],
  bank_01_failures: ['fdic'],
  bank_02_discount_window: ['fdic'],
  bank_03_deposit_flow: ['fdic'],
  supply_pharmacy_shortage: ['fdaShortage'],
  fema_disaster_declarations: ['fema', 'help211'],
  grid_01_pjm_outages: ['fema', 'help211'],
  cyber_01_cisa_kev: ['cisa'],
};

export function helpFor(indicatorId: string, household: Household): HelpResource[] {
  let ids = HELP_FOR[indicatorId] ?? [];
  if (!household.kids) ids = ids.filter((id) => id !== 'wic');
  if (household.benefits) ids = [...ids].sort((a, b) => Number(b === 'snap') - Number(a === 'snap'));
  return ids.map((id) => HELP[id]);
}

/**
 * How much an indicator matters to this household: 2 = directly, 1 = normal, 0 = not much.
 * Used to order actions; nothing is hidden, only ranked.
 */
export function relevance(indicatorId: string, h: Household): number {
  switch (indicatorId) {
    case 'energy_gas_price':
    case 'cost_auto_insurance':
      return h.drives === false ? 0 : h.drives ? 2 : 1;
    case 'housing_04_rent_cpi':
      return h.housing === 'rent' ? 2 : h.housing === 'own' ? 0 : 1;
    case 'housing_03_rate_shock':
    case 'housing_01_delinquency':
      return h.housing === 'own' ? 2 : h.housing === 'rent' ? 0 : 1;
    case 'energy_02_nat_gas_storage':
      return h.heat === 'gas' ? 2 : h.heat && h.heat !== 'unsure' ? 0 : 1;
    case 'energy_03_electricity_cpi':
      return h.heat === 'electric' ? 2 : 1;
    case 'oil_brent_price':
    case 'spr_01_level':
      return h.heat === 'oil' ? 2 : 1;
    case 'supply_pharmacy_shortage':
      return h.prescriptions ? 2 : h.prescriptions === false ? 0 : 1;
    case 'cost_childcare':
    case 'bio_03_measles':
      return h.kids ? 2 : h.kids === false ? 0 : 1;
    default:
      return 1;
  }
}
