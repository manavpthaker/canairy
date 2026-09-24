/**
 * Household guidance for every core indicator the API serves (see api/catalog.py).
 *
 * Written to match exactly what each number measures. No invented statistics:
 * anything quantitative here is either the reading itself or a well-known,
 * checkable fact. Advice is proportionate; amber means "worth a small step",
 * red means "act this week".
 */

import type { IndicatorContextEntry } from './indicatorContext';

export const CORE_INDICATOR_CONTEXT: Record<string, IndicatorContextEntry> = {
  econ_02_grocery_cpi: {
    whatItMeans: {
      amber: 'Food-at-home prices are rising faster than the Fed’s 2% comfort zone.',
      red: 'Grocery prices are rising fast: the last 3 months are running at a high annual pace.',
    },
    familyImpact: {
      amber: 'Your weekly grocery bill is creeping up. Staples you buy every week feel it first.',
      red: 'Food is taking a noticeably bigger share of the budget, and prices rarely fall back quickly.',
    },
    whatToDo: {
      amber: 'Buy an extra week of the shelf-stable food you already eat while prices are lower.',
      red: 'Build a 2–4 week pantry of staples you actually use, and switch to store brands where you can.',
    },
    dataPointLabel: 'Grocery inflation (3-mo, annualized)',
    source: 'BLS Consumer Price Index',
    peripheralImpacts: ['Restaurant prices follow', 'Pet food and baby formula costs rise'],
  },

  energy_gas_price: {
    whatItMeans: {
      amber: 'Gas is above $4 a gallon on average nationwide.',
      red: 'Gas is near record territory; the 2022 peak was about $5.',
    },
    familyImpact: {
      amber: 'Commuting and errands cost more each week, and delivery fees tend to follow.',
      red: 'Fuel is a real budget line now. Price spikes can also bring short local shortages.',
    },
    whatToDo: {
      amber: 'Keep the tank above half and combine trips. Check if your card or grocer offers fuel discounts.',
      red: 'Keep the tank above half, store fuel only in approved cans, and ask about remote-work days.',
    },
    dataPointLabel: 'US regular gasoline',
    source: 'EIA via FRED',
    peripheralImpacts: ['Delivery and shipping fees', 'Airfares', 'Heating oil prices'],
  },

  oil_brent_price: {
    whatItMeans: {
      amber: 'Crude oil is expensive, which usually means supply is tight somewhere in the world.',
      red: 'Crude oil is at crisis-level prices, typically a sign of conflict or a supply disruption.',
    },
    familyImpact: {
      amber: 'Gas and heating oil prices tend to follow crude within a few weeks.',
      red: 'Expect higher prices for gas, heating oil, flights and shipped goods over the next 1–2 months.',
    },
    whatToDo: {
      amber: 'If you heat with oil or propane, price out a fill now rather than in winter.',
      red: 'Lock in heating fuel if you can, keep the car tank above half, and trim nonessential driving.',
    },
    dataPointLabel: 'Brent crude',
    source: 'EIA via FRED',
    peripheralImpacts: ['Gas prices', 'Heating oil', 'Airfares', 'Plastic and packaging costs'],
  },

  housing_03_rate_shock: {
    whatItMeans: {
      amber: '30-year mortgage rates are above 7%.',
      red: 'Mortgage rates are above 8.5%, higher than any time since 2000.',
    },
    familyImpact: {
      amber: 'Buying or refinancing costs more each month. Home equity lines get pricier too.',
      red: 'Moving or refinancing is very expensive, and adjustable-rate loans reset higher.',
    },
    whatToDo: {
      amber: 'If you have an adjustable-rate loan or HELOC, check when it resets.',
      red: 'Avoid new variable-rate debt. If you’re buying, get a rate lock in writing.',
    },
    dataPointLabel: '30-yr fixed mortgage',
    source: 'Freddie Mac PMMS',
    peripheralImpacts: ['Rent increases', 'Fewer homes for sale'],
  },

  housing_01_delinquency: {
    whatItMeans: {
      amber: 'More homeowners are falling behind on mortgage payments than usual.',
      red: 'Mortgage delinquencies are high, a sign of broad household financial stress.',
    },
    familyImpact: {
      amber: 'A sign that household budgets are stretched in many places.',
      red: 'Local home prices can soften and lenders get stricter with credit.',
    },
    whatToDo: {
      amber: 'Make sure you have at least a month of mortgage or rent set aside.',
      red: 'If a payment could be tight, call your lender before you miss it; options shrink after.',
    },
    dataPointLabel: 'Mortgages 30+ days late',
    source: 'Federal Reserve',
    peripheralImpacts: ['Tighter lending', 'Softer home prices'],
  },

  job_01_jobless_claims: {
    whatItMeans: {
      amber: 'New unemployment claims are rising, meaning layoffs are picking up.',
      red: 'Unemployment claims are at recession levels.',
    },
    familyImpact: {
      amber: 'Hiring slows and job security gets shakier, especially in cyclical industries.',
      red: 'Layoffs are widespread. Finding a new job may take months, not weeks.',
    },
    whatToDo: {
      amber: 'Update your resume and LinkedIn, and aim for 3 months of expenses in savings.',
      red: 'Build toward 6 months of expenses, pause big purchases, and know your state’s unemployment filing steps.',
    },
    dataPointLabel: 'Weekly jobless claims',
    source: 'Dept. of Labor via FRED',
    peripheralImpacts: ['Slower raises', 'Fewer job openings'],
  },

  green_g1_gdp_rates: {
    whatItMeans: {
      amber: 'The economy is growing slowly, below its usual 2% pace.',
      red: 'The economy shrank last quarter.',
    },
    familyImpact: {
      amber: 'Slow growth usually means slower hiring and smaller raises.',
      red: 'Recessions bring layoffs and tighter credit, usually for several quarters.',
    },
    whatToDo: {
      amber: 'Good time to build savings and pay down high-interest debt.',
      red: 'Hold off on big new debt and keep 3–6 months of expenses in cash.',
    },
    dataPointLabel: 'Real GDP growth (annualized)',
    source: 'BEA via FRED',
    peripheralImpacts: ['Hiring freezes', 'Tighter credit'],
  },

  market_01_intraday_swing: {
    whatItMeans: {
      amber: 'The 10-year Treasury yield is swinging more than usual within a day.',
      red: 'Bond markets are swinging as hard as in past crises such as March 2020 and the 2023 bank failures.',
    },
    familyImpact: {
      amber: 'Retirement balances may move more than usual. Nothing to act on by itself.',
      red: 'Loan rates can jump quickly and investment balances may drop sharply.',
    },
    whatToDo: {
      amber: 'No action needed. Avoid checking your 401k daily.',
      red: 'Don’t panic-sell. Make sure you have a few weeks of cash outside investments.',
    },
    dataPointLabel: '10-yr yield daily swing',
    source: 'Yahoo Finance',
    peripheralImpacts: ['Mortgage rate jumps', 'Retirement account swings'],
  },

  econ_01_treasury_tail: {
    whatItMeans: {
      amber: 'Demand at the latest 10-year Treasury auction was weaker than usual.',
      red: 'Demand for US government debt was very weak at the latest auction.',
    },
    familyImpact: {
      amber: 'Weak demand can nudge up rates on mortgages and car loans.',
      red: 'Borrowing costs across the economy can rise quickly after weak auctions.',
    },
    whatToDo: {
      amber: 'If you’re about to borrow, consider locking a rate sooner rather than later.',
      red: 'Avoid new variable-rate debt and keep some cash outside the market.',
    },
    dataPointLabel: '10-yr auction bid-to-cover',
    source: 'US Treasury Fiscal Data',
    peripheralImpacts: ['Mortgage rates', 'Credit card APRs'],
  },

  bank_01_failures: {
    whatItMeans: {
      amber: 'More banks than usual have failed in the past year.',
      red: 'Bank failures are running at a pace not seen since the 2008–2012 crisis.',
    },
    familyImpact: {
      amber: 'Insured deposits are safe up to $250K, but a failure can pause access for a day or two.',
      red: 'Short delays accessing money are possible if your bank is taken over.',
    },
    whatToDo: {
      amber: 'Check that your balances at each bank are under FDIC limits.',
      red: 'Keep accounts at two different banks and a few hundred dollars in cash at home.',
    },
    dataPointLabel: 'Bank failures (12 months)',
    source: 'FDIC',
    peripheralImpacts: ['Tighter small-business lending'],
  },

  bank_02_discount_window: {
    whatItMeans: {
      amber: 'Banks are borrowing more from the Fed’s emergency window than usual.',
      red: 'Banks are leaning heavily on emergency Fed loans, as they did in March 2023.',
    },
    familyImpact: {
      amber: 'An early sign some banks need cash. Deposits under $250K remain insured.',
      red: 'Some banks are under real funding stress. Access delays are possible at weak banks.',
    },
    whatToDo: {
      amber: 'Confirm your deposits are within FDIC limits.',
      red: 'Spread savings across two banks and keep a small cash reserve at home.',
    },
    dataPointLabel: 'Fed discount window loans',
    source: 'Federal Reserve via FRED',
    peripheralImpacts: ['Tighter credit'],
  },

  bank_03_deposit_flow: {
    whatItMeans: {
      amber: 'Money is flowing out of US banks faster than normal this week.',
      red: 'Deposits dropped as sharply as during the 2023 bank runs.',
    },
    familyImpact: {
      amber: 'Usually harmless on its own, but worth watching with other bank signals.',
      red: 'Banks under pressure may restrict withdrawals or tighten lending.',
    },
    whatToDo: {
      amber: 'No action needed beyond keeping deposits within FDIC limits.',
      red: 'Keep a few hundred dollars in cash and accounts at two banks.',
    },
    dataPointLabel: 'Weekly deposit change',
    source: 'Federal Reserve H.8 via FRED',
    peripheralImpacts: ['Tighter lending'],
  },

  spr_01_level: {
    whatItMeans: {
      amber: 'The national emergency oil reserve is low compared with its history.',
      red: 'The emergency oil reserve is at a multi-decade low.',
    },
    familyImpact: {
      amber: 'Less cushion if an oil shock hits, so price spikes could last longer.',
      red: 'The government has little room to calm a fuel price spike.',
    },
    whatToDo: {
      amber: 'No direct action; watch gas and crude prices.',
      red: 'Keep the car tank above half and heating fuel topped up ahead of winter.',
    },
    dataPointLabel: 'Strategic Petroleum Reserve',
    source: 'EIA',
    peripheralImpacts: ['Longer gas price spikes'],
  },

  energy_02_nat_gas_storage: {
    whatItMeans: {
      amber: 'Natural gas in storage is below the 5-year average.',
      red: 'Gas storage is well below normal going into heating season.',
    },
    familyImpact: {
      amber: 'Heating and electric bills may run higher this winter.',
      red: 'Expect noticeably higher winter heating bills; cold snaps can strain supply.',
    },
    whatToDo: {
      amber: 'Ask your utility about budget billing, and seal drafty windows and doors.',
      red: 'Get a furnace check, weatherproof now, and have warm bedding and a safe backup heat plan.',
    },
    dataPointLabel: 'Gas storage vs 5-yr avg',
    source: 'EIA',
    peripheralImpacts: ['Electric bills', 'Heating costs'],
  },

  supply_02_freight_index: {
    whatItMeans: {
      amber: 'Shipping a container across the ocean costs about twice the pre-2020 norm.',
      red: 'Container shipping costs have spiked, as in the 2021 supply crunch.',
    },
    familyImpact: {
      amber: 'Imported goods get a bit pricier over the next 2–3 months.',
      red: 'Expect higher prices and some empty shelves for imported goods in 2–3 months.',
    },
    whatToDo: {
      amber: 'Buy planned imported items (electronics, appliances) sooner rather than later.',
      red: 'Buy needed imported goods, replacement parts and gifts early.',
    },
    dataPointLabel: 'Global container rate',
    source: 'Freightos Baltic Index',
    peripheralImpacts: ['Electronics prices', 'Holiday goods availability'],
  },

  supply_pharmacy_shortage: {
    whatItMeans: {
      amber: 'More drugs than usual are on the FDA’s shortage list.',
      red: 'Drug shortages are widespread, near record levels.',
    },
    familyImpact: {
      amber: 'Some prescriptions may take longer to fill or need a substitute.',
      red: 'Common prescriptions may be hard to get for weeks at a time.',
    },
    whatToDo: {
      amber: 'Refill prescriptions a week early, and check the FDA list for your family’s medicines.',
      red: 'Ask your doctor about 90-day supplies and approved alternatives for critical medicines.',
    },
    dataPointLabel: 'Drugs in shortage (FDA)',
    source: 'FDA',
    peripheralImpacts: ['Pharmacy wait times', 'Substitute medications'],
  },

  cyber_01_cisa_kev: {
    whatItMeans: {
      amber: 'Attackers are actively using more newly found software flaws than usual.',
      red: 'An unusually high number of flaws are being exploited in the wild right now.',
    },
    familyImpact: {
      amber: 'Phones, routers and apps you use may have flaws being exploited today.',
      red: 'Higher odds of outages or breaches at banks, hospitals and utilities.',
    },
    whatToDo: {
      amber: 'Install pending updates on phones, computers and your router this week.',
      red: 'Update everything now, turn on two-factor login for email and banking, and save key documents offline.',
    },
    dataPointLabel: 'Exploited flaws per week',
    source: 'CISA',
    peripheralImpacts: ['Service outages', 'Data breaches'],
  },

  grid_01_pjm_outages: {
    whatItMeans: {
      amber: 'Several extreme weather alerts are active across the US right now.',
      red: 'Many extreme weather alerts are active at once, e.g. hurricanes or tornado outbreaks.',
    },
    familyImpact: {
      amber: 'Check whether any alert covers your area or family members.',
      red: 'Large areas may lose power or road access; supplies can sell out ahead of storms.',
    },
    whatToDo: {
      amber: 'Check weather.gov for your area and charge your power banks.',
      red: 'If you’re in an affected area, follow local officials, fill water containers and fuel the car now.',
    },
    dataPointLabel: 'Extreme weather alerts',
    source: 'National Weather Service',
    peripheralImpacts: ['Power outages', 'Road closures'],
  },

  fema_disaster_declarations: {
    whatItMeans: {
      amber: 'FEMA has declared more disasters than usual in the last 90 days.',
      red: 'An exceptionally high number of disasters have been declared recently.',
    },
    familyImpact: {
      amber: 'Federal help is spread across many places; response times can slow.',
      red: 'If disaster hits you now, expect to rely on your own supplies longer.',
    },
    whatToDo: {
      amber: 'Make sure you have 3 days of water, food and medicine at home.',
      red: 'Plan to be self-sufficient for a week: water, food, medicine, cash and a battery radio.',
    },
    dataPointLabel: 'FEMA declarations (90 days)',
    source: 'FEMA',
    peripheralImpacts: ['Slower aid', 'Insurance delays'],
  },

  travel_01_advisories: {
    whatItMeans: {
      amber: 'More countries than usual carry a “Do Not Travel” warning.',
      red: 'An unusually large number of countries are under “Do Not Travel” warnings.',
    },
    familyImpact: {
      amber: 'International trips carry more risk of disruption.',
      red: 'Global instability is widespread; trips abroad can be cut short.',
    },
    whatToDo: {
      amber: 'Check passports are valid for 6+ months and enroll trips in the State Dept’s STEP program.',
      red: 'Reconsider nonessential travel abroad and keep passports current for the whole family.',
    },
    dataPointLabel: 'Level 4 countries',
    source: 'US State Department',
    peripheralImpacts: ['Flight cancellations', 'Higher travel insurance costs'],
  },

  travel_03_tsa_throughput: {
    whatItMeans: {
      amber: 'Far fewer people are flying than normal.',
      red: 'Air travel has collapsed, as it did in spring 2020.',
    },
    familyImpact: {
      amber: 'Something is keeping people home: an outbreak, a security event or economic stress.',
      red: 'Travel is disrupted nationwide; expect wider disruption to follow.',
    },
    whatToDo: {
      amber: 'Look at the other signals to see what’s driving it.',
      red: 'Postpone nonessential travel and check that home supplies cover 2 weeks.',
    },
    dataPointLabel: 'Daily TSA travelers (7-day avg)',
    source: 'TSA',
    peripheralImpacts: ['Airline cutbacks'],
  },
};
