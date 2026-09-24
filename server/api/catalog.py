"""
The indicators Canairy serves: one entry per indicator, with its collector,
units, thresholds and how old a reading may get before it stops counting.

Every entry here was checked against its live source. Tiers:
  core          structured data from an official or market source; drives alerts
  experimental  real data, but a loose proxy for household risk; shown, never alerts

Thresholds: when `red` > `amber`, higher is worse; otherwise lower is worse.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Tuple


@dataclass(frozen=True)
class IndicatorDef:
    id: str
    name: str
    domain: str
    description: str
    unit: str
    amber: float
    red: float
    collector_file: str
    collector_class: str
    source_name: str
    source_url: str
    update_frequency: str
    max_age_hours: float
    tier: str = "core"
    critical: bool = False
    green_flag: bool = False
    transform: Optional[Callable[[float], float]] = None
    valid_range: Optional[Tuple[float, float]] = None

    @property
    def higher_is_worse(self) -> bool:
        return self.red > self.amber

    def thresholds(self) -> Dict[str, object]:
        if self.higher_is_worse:
            bands = {"green": {"max": self.amber}, "amber": {"min": self.amber, "max": self.red}, "red": {"min": self.red}}
        else:
            bands = {"green": {"min": self.amber}, "amber": {"min": self.red, "max": self.amber}, "red": {"max": self.red}}
        return {**bands, "threshold_amber": self.amber, "threshold_red": self.red}


def determine_level(value: float, defn: IndicatorDef) -> str:
    if defn.higher_is_worse:
        return "red" if value >= defn.red else "amber" if value >= defn.amber else "green"
    return "red" if value <= defn.red else "amber" if value <= defn.amber else "green"


DAY = 24
WEEK = 7 * DAY
V = "verified.py"

CATALOG: List[IndicatorDef] = [
    # ── Household costs ──
    IndicatorDef(
        "econ_02_grocery_cpi", "Grocery Prices", "economy",
        "Food-at-home prices, 3-month change annualized. Hits the weekly grocery bill directly.",
        "%", 3.5, 6,  # Fed target is 2%; 2022 peak ran above 13%
        V, "GroceryInflationCollector", "BLS CPI (via FRED)",
        "https://fred.stlouisfed.org/series/CUSR0000SAF11", "Monthly", 45 * DAY,
        valid_range=(-30, 60),
    ),
    IndicatorDef(
        "energy_gas_price", "Gas Prices", "energy",
        "US average price of regular gasoline. Moves your commute and delivery costs within weeks.",
        "$/gal", 4.00, 4.75,  # 2022 record was $5.02
        V, "GasolinePriceCollector", "EIA (via FRED)",
        "https://fred.stlouisfed.org/series/GASREGW", "Weekly", 14 * DAY,
        valid_range=(1, 10),
    ),
    IndicatorDef(
        "oil_brent_price", "Crude Oil Price", "oil_axis",
        "Brent crude spot price. Spikes on Middle East or shipping disruption and feeds into gas and heating oil.",
        "$/bbl", 90, 110,  # 2022 spike peaked near $128
        V, "BrentCrudeCollector", "EIA (via FRED)",
        "https://fred.stlouisfed.org/series/DCOILBRENTEU", "Daily", 5 * DAY,
        valid_range=(5, 300),
    ),
    IndicatorDef(
        "housing_03_rate_shock", "Mortgage Rates", "housing_mortgage",
        "30-year fixed mortgage rate. High rates freeze moving and refinancing options.",
        "%", 7, 8.5,  # 2023 peak 7.79%
        V, "MortgageRateCollector", "Freddie Mac (via FRED)",
        "https://fred.stlouisfed.org/series/MORTGAGE30US", "Weekly", 14 * DAY,
        valid_range=(1, 20),
    ),
    IndicatorDef(
        "housing_01_delinquency", "Mortgage Delinquency", "housing_mortgage",
        "Single-family mortgages 30+ days past due at commercial banks. Rising means households are stretched.",
        "%", 3, 5,  # normal 1.5–2.5%; 2010 peak 11.5%
        V, "MortgageDelinquencyCollector", "Federal Reserve (via FRED)",
        "https://fred.stlouisfed.org/series/DRSFRMACBS", "Quarterly", 200 * DAY,
        valid_range=(0, 30),
    ),

    # ── Jobs & growth ──
    IndicatorDef(
        "job_01_jobless_claims", "Jobless Claims", "jobs_labor",
        "New unemployment claims each week. A sustained rise means layoffs are spreading.",
        "K/week", 250, 350,
        V, "JoblessClaimsCollector", "Dept. of Labor (via FRED)",
        "https://fred.stlouisfed.org/series/ICSA", "Weekly", 14 * DAY,
        transform=lambda v: v / 1000, valid_range=(50, 7000),
    ),
    IndicatorDef(
        "green_g1_gdp_rates", "Economic Growth", "economy",
        "Real GDP growth, annualized. Below zero means the economy is shrinking.",
        "%", 2, 0,
        V, "GDPGrowthCollector", "BEA (via FRED)",
        "https://fred.stlouisfed.org/series/A191RL1Q225SBEA", "Quarterly", 200 * DAY,
        green_flag=True, valid_range=(-40, 40),
    ),

    # ── Markets & banks ──
    IndicatorDef(
        "market_01_intraday_swing", "Bond Market Volatility", "economy",
        "Daily high-low swing in the 10-year Treasury yield. Wild swings mean big institutions are scrambling.",
        "bps", 15, 30,  # SVB (2023) and March 2020 ran 30+
        V, "TreasuryVolatilityCollector", "Yahoo Finance (^TNX)",
        "https://finance.yahoo.com/quote/%5ETNX/", "Daily", 4 * DAY,
        critical=True, valid_range=(0, 200),
    ),
    IndicatorDef(
        "econ_01_treasury_tail", "Demand for US Debt", "economy",
        "Bid-to-cover at the latest 10-year Treasury auction. Weak demand pushes up rates on everything.",
        "ratio", 2.35, 2.15,  # recent auctions run 2.4–2.6
        V, "TreasuryAuctionDemandCollector", "US Treasury Fiscal Data",
        "https://fiscaldata.treasury.gov/datasets/treasury-securities-auctions-data/", "Per auction", 45 * DAY,
        valid_range=(1, 5),
    ),
    IndicatorDef(
        "bank_01_failures", "Bank Failures", "economy",
        "FDIC-insured banks that failed in the last 12 months. Deposits are insured, but access can pause.",
        "banks", 5, 10,  # 2023 had 5; 2010 had 157
        V, "FDICFailuresCollector", "FDIC",
        "https://www.fdic.gov/bank-failures/failed-bank-list", "Weekly", 14 * DAY,
        valid_range=(0, 500),
    ),
    IndicatorDef(
        "bank_02_discount_window", "Emergency Bank Borrowing", "economy",
        "Banks borrowing from the Fed's discount window. The banking system's check-engine light.",
        "$B", 10, 50,  # normal since 2023 is $2–7B; March 2023 peak $153B
        V, "DiscountWindowCollector", "Federal Reserve (via FRED)",
        "https://fred.stlouisfed.org/series/WPC", "Weekly", 14 * DAY,
        transform=lambda v: v / 1000, valid_range=(0, 1000),
    ),
    IndicatorDef(
        "bank_03_deposit_flow", "Bank Deposit Flows", "economy",
        "Week-over-week change in deposits at US banks. Sharp outflows mean people are pulling money.",
        "%", -0.5, -1.0,  # the SVB week was about -0.6% across all banks
        V, "BankDepositsCollector", "Federal Reserve H.8 (via FRED)",
        "https://fred.stlouisfed.org/series/DPSACBW027SBOG", "Weekly", 14 * DAY,
        valid_range=(-20, 20),
    ),

    # ── Energy & supply ──
    IndicatorDef(
        "spr_01_level", "Strategic Oil Reserve", "energy",
        "Crude in the US Strategic Petroleum Reserve. The cushion against a supply shock.",
        "M bbl", 350, 250,  # 2023 low ~347M; capacity ~714M
        V, "SPRLevelCollector", "EIA",
        "https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCSSTUS1&f=W", "Weekly", 14 * DAY,
        valid_range=(0, 800),
    ),
    IndicatorDef(
        "energy_02_nat_gas_storage", "Natural Gas Storage", "energy",
        "Gas in storage vs the 5-year average. Low storage heading into winter means heating bills spike.",
        "% vs avg", -10, -20,
        V, "NatGasStorageCollector", "EIA",
        "https://ir.eia.gov/ngs/ngs.html", "Weekly", 14 * DAY,
        valid_range=(-80, 80),
    ),
    IndicatorDef(
        "supply_02_freight_index", "Shipping Costs", "supply_chain",
        "Global container shipping rate. High freight costs show up as shelf prices 2–3 months later.",
        "$/FEU", 3000, 6000,  # pre-2020 ~$1,500; 2021 peak ~$11,000
        V, "FreightosFBXCollector", "Freightos Baltic Index",
        "https://www.freightos.com/enterprise/terminal/freightos-baltic-index-global-container-pricing-index/",
        "Daily", 4 * DAY, valid_range=(300, 30000),
    ),
    IndicatorDef(
        "supply_pharmacy_shortage", "Drug Shortages", "supply_chain",
        "Drugs on FDA's current shortage list. When prescriptions run short, a 90-day supply matters.",
        "drugs", 90, 120,
        V, "FDADrugShortagesCollector", "FDA (openFDA)",
        "https://www.accessdata.fda.gov/scripts/drugshortages/", "Daily", 3 * DAY,
        valid_range=(1, 1000),
    ),

    # ── Safety & infrastructure ──
    IndicatorDef(
        "cyber_01_cisa_kev", "Cyber Threats", "security_infrastructure",
        "Newly confirmed, actively exploited software flaws per week. Spikes precede outages at banks and utilities.",
        "vulns/wk", 5, 15,  # 2024 pace was ~3.6/week
        V, "CISAKEVWeeklyCollector", "CISA",
        "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", "Daily", 3 * DAY,
        valid_range=(0, 500),
    ),
    IndicatorDef(
        "grid_01_pjm_outages", "Extreme Weather Alerts", "security_infrastructure",
        "Active National Weather Service alerts rated Extreme (e.g. hurricane or tornado emergencies).",
        "alerts", 5, 20,
        V, "NWSExtremeAlertsCollector", "National Weather Service",
        "https://www.weather.gov/alerts", "Hourly", 3,
        valid_range=(0, 2000),
    ),
    IndicatorDef(
        "fema_disaster_declarations", "Disaster Declarations", "security_infrastructure",
        "FEMA major-disaster and emergency declarations in the last 90 days. High counts stretch federal help thin.",
        "per 90d", 30, 50,
        V, "FEMADeclarationsCollector", "FEMA",
        "https://www.fema.gov/disaster/declarations", "Daily", 3 * DAY,
        valid_range=(0, 1000),
    ),
    IndicatorDef(
        "travel_01_advisories", "Do-Not-Travel Countries", "global_conflict",
        "Countries under a State Department Level 4 'Do Not Travel' advisory.",
        "countries", 26, 32,  # has run ~19–25 in recent years
        "state_dept_travel.py", "StateDeptAdvisoryCollector", "US State Department",
        "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html", "Daily", 3 * DAY,
        valid_range=(0, 200),
    ),
    IndicatorDef(
        "travel_03_tsa_throughput", "Air Travel Volume", "travel_mobility",
        "Travelers through TSA checkpoints per day (7-day average). A sudden drop means something is wrong.",
        "K/day", 1500, 800,  # 2019 averaged ~2,300K
        V, "TSAThroughputCollector", "TSA",
        "https://www.tsa.gov/travel/passenger-volumes", "Daily", 4 * DAY,
        valid_range=(50, 5000),
    ),

    # ── Context only ──
    IndicatorDef(
        "bio_01_h2h_countries", "Disease Outbreak Notices", "security_infrastructure",
        "WHO Disease Outbreak News posts in the last 60 days. Context for what's spreading worldwide.",
        "posts", 8, 15,
        V, "WHOOutbreakNewsCollector", "World Health Organization",
        "https://www.who.int/emergencies/disease-outbreak-news", "Daily", 3 * DAY,
        tier="experimental", valid_range=(0, 200),
    ),
    IndicatorDef(
        "luxury_01_collapse", "Luxury Stocks", "economy",
        "LVMH, Hermès and Kering shares vs their 1-year highs. Sometimes falls months ahead of wider slowdowns.",
        "% from peak", -10, -25,
        V, "LuxuryDrawdownCollector", "Yahoo Finance",
        "https://finance.yahoo.com/quote/MC.PA/", "Daily", 4 * DAY,
        tier="experimental", valid_range=(-100, 5),
    ),
]

BY_ID: Dict[str, IndicatorDef] = {d.id: d for d in CATALOG}
assert len(BY_ID) == len(CATALOG), "duplicate indicator id in catalog"
