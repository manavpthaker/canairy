"""
Data service that wraps collectors with caching and maps IDs to frontend expectations.
Collectors that can fetch real data (no API key needed) are marked as 'live'.
Others gracefully fall back to mock data.
"""

import sys
import os
import logging
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

# Add src directory to Python path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from utils.config_loader import ConfigLoader

logger = logging.getLogger(__name__)

# Import individual collector files directly, bypassing collectors/__init__.py
# which imports everything and can fail due to missing optional dependencies.
import importlib.util

def _load_collector(filename: str, class_name: str):
    """Load a collector class directly from its .py file."""
    filepath = src_path / "collectors" / filename
    if not filepath.exists():
        logger.warning(f"Collector file not found: {filepath}")
        return None
    try:
        # First ensure the base module is available
        base_path = src_path / "collectors" / "base.py"
        if "collectors.base" not in sys.modules:
            spec = importlib.util.spec_from_file_location("collectors.base", str(base_path))
            mod = importlib.util.module_from_spec(spec)
            sys.modules["collectors.base"] = mod
            spec.loader.exec_module(mod)

        spec = importlib.util.spec_from_file_location(f"collectors.{filename[:-3]}", str(filepath))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return getattr(mod, class_name)
    except Exception as e:
        logger.warning(f"Cannot load {class_name} from {filename}: {e}")
        return None

# Load API keys from secrets.yaml into environment
def _load_secrets():
    """Load API keys from secrets.yaml into environment variables."""
    secrets_path = Path(__file__).parent.parent / "config" / "secrets.yaml"
    if secrets_path.exists():
        try:
            import yaml
            with open(secrets_path) as f:
                secrets = yaml.safe_load(f)
            api_keys = secrets.get('api_keys', {})
            for key, value in api_keys.items():
                if value and not os.environ.get(key):
                    os.environ[key] = str(value)
                    logger.info(f"Loaded API key: {key}")
            # Also load specific keys explicitly
            for key in ['CONGRESS_API_KEY', 'DATA_GOV_API_KEY', 'OPENSTATES_API_KEY', 'COURTLISTENER_API_KEY']:
                if key in api_keys and api_keys[key]:
                    os.environ[key] = str(api_keys[key])
        except Exception as e:
            logger.warning(f"Could not load secrets.yaml: {e}")

_load_secrets()

# These collectors have minimal dependencies (requests, feedparser)
# Core collectors (already working)
_CISACyberCollector = _load_collector("cisa_cyber.py", "CISACyberCollector")
_WHODiseaseCollector = _load_collector("who_disease.py", "WHODiseaseCollector")
_GroceryCPICollector = _load_collector("grocery_cpi.py", "GroceryCPICollector")
_TreasuryCollector = _load_collector("treasury.py", "TreasuryCollector")
_JoblessClaimsCollector = _load_collector("jobless_claims.py", "JoblessClaimsCollector")
_GDPGrowthCollector = _load_collector("gdp_growth.py", "GDPGrowthCollector")
_MarketVolatilityCollector = _load_collector("market_volatility.py", "MarketVolatilityCollector")
_TreasuryAuctionCollector = _load_collector("treasury_auctions.py", "TreasuryAuctionCollector")
_NWSAlertsCollector = _load_collector("nws_alerts.py", "NWSAlertsCollector")
_ACLEDProtestsCollector = _load_collector("acled_protests.py", "ACLEDProtestsCollector")
_EIASPRCollector = _load_collector("eia_energy.py", "EIASPRCollector")

# FAA collectors (free API)
_FAAGroundStopsCollector = _load_collector("faa_flights.py", "FAAGroundStopsCollector")
_FAAFlightDelaysCollector = _load_collector("faa_flights.py", "FAAFlightDelaysCollector")
_FAATFRCollector = _load_collector("faa_flights.py", "FAATFRCollector")

# State Dept / Travel (free)
_StateDeptAdvisoryCollector = _load_collector("state_dept_travel.py", "StateDeptAdvisoryCollector")

# CBP / TSA (free)
_CBPBorderWaitCollector = _load_collector("cbp_travel.py", "CBPBorderWaitCollector")
_TSAThroughputCollector = _load_collector("cbp_travel.py", "TSAThroughputCollector")

# Banking (free - FDIC)
_FDICBankFailuresCollector = _load_collector("fdic_banks.py", "FDICBankFailuresCollector")
_FedDiscountWindowCollector = _load_collector("fdic_banks.py", "FedDiscountWindowCollector")
_FedDepositsCollector = _load_collector("fdic_banks.py", "FedDepositsCollector")

# EIA extras (already have API key)
_EIANaturalGasCollector = _load_collector("eia_energy.py", "EIANaturalGasCollector")
_EIAGridEmergencyCollector = _load_collector("eia_energy.py", "EIAGridEmergencyCollector")

# Labor (free - Cornell ILR)
_StrikeTrackerCollector = _load_collector("strike_tracker.py", "StrikeTrackerCollector")

# Taiwan (web scraping - no API key)
_TaiwanPLACollector = _load_collector("taiwan_pla.py", "TaiwanPLACollector")

# Supply chain (free APIs)
_PortCongestionCollector = _load_collector("supply_chain.py", "PortCongestionCollector")
_FreightIndexCollector = _load_collector("supply_chain.py", "FreightIndexCollector")

# Pharmacy shortages (FDA - free)
_PharmacyShortageCollector = _load_collector("pharmacy_shortage.py", "PharmacyShortageCollector")

# Global conflict (ACLED - have key)
_GlobalConflictCollector = _load_collector("global_conflict.py", "GlobalConflictCollector")

# Congress.gov (free - LegiScan workaround)
_CongressBillsCollector = _load_collector("congress_bills.py", "CongressBillsCollector")

# USDA collectors (Data.gov API key)
_USDACropConditionCollector = _load_collector("usda_crops.py", "USDACropConditionCollector")
_USDALivestockDiseaseCollector = _load_collector("usda_crops.py", "USDALivestockDiseaseCollector")
_USDAMeatProcessingCollector = _load_collector("usda_crops.py", "USDAMeatProcessingCollector")
_FertilizerPriceCollector = _load_collector("fertilizer_price.py", "FertilizerPriceCollector")

# Water infrastructure collectors
_ReservoirLevelCollector = _load_collector("water_infra.py", "ReservoirLevelCollector")
_EPAWaterAlertsCollector = _load_collector("water_infra.py", "EPAWaterAlertsCollector")
_DroughtMonitorCollector = _load_collector("water_infra.py", "DroughtMonitorCollector")

# Treasury/OFAC collector
_OFACSanctionsCollector = _load_collector("ofac_sanctions.py", "OFACSanctionsCollector")

# Telecom infrastructure collectors
_BGPAnomaliesCollector = _load_collector("telecom_infra.py", "BGPAnomaliesCollector")
_CellOutagesCollector = _load_collector("telecom_infra.py", "CellOutagesCollector")
_UnderseaCableCollector = _load_collector("telecom_infra.py", "UnderseaCableCollector")

# RSS feed collectors (free alternatives to paid APIs)
_ProtestNewsCollector = _load_collector("rss_feeds.py", "ProtestNewsCollector")
_GlobalConflictNewsCollector = _load_collector("rss_feeds.py", "GlobalConflictNewsCollector")
_NATONewsCollector = _load_collector("rss_feeds.py", "NATONewsCollector")
_DefenseSpendingCollector = _load_collector("rss_feeds.py", "DefenseSpendingCollector")
_AILayoffsCollector = _load_collector("rss_feeds.py", "AILayoffsCollector")
_NuclearTestsCollector = _load_collector("rss_feeds.py", "NuclearTestsCollector")

# Free alternatives to paid APIs
_YahooLuxuryIndexCollector = _load_collector("free_alternatives.py", "YahooLuxuryIndexCollector")
_EIAOilInventoryCollector = _load_collector("free_alternatives.py", "EIAOilInventoryCollector")
_SemiconductorLeadTimeCollector = _load_collector("free_alternatives.py", "SemiconductorLeadTimeCollector")
_ICEDetentionCollector = _load_collector("free_alternatives.py", "ICEDetentionCollector")
_HormuzRiskCollector = _load_collector("free_alternatives.py", "HormuzRiskCollector")
_MortgageDelinquencyCollector = _load_collector("free_alternatives.py", "MortgageDelinquencyCollector")
_GoogleTrendsCollector = _load_collector("free_alternatives.py", "GoogleTrendsCollector")

# OpenStates (state legislation tracking)
_OpenStatesAISurveillanceCollector = _load_collector("openstates.py", "OpenStatesAISurveillanceCollector")

# CourtListener (civil liberties cases)
_CourtListenerLibertyCollector = _load_collector("courtlistener.py", "CourtListenerLibertyCollector")

# Government RSS feeds (no auth required)
_SECFilingsCollector = _load_collector("gov_rss_feeds.py", "SECFilingsCollector")
_FederalRegisterCollector = _load_collector("gov_rss_feeds.py", "FederalRegisterCollector")
_FEMADisasterCollector = _load_collector("gov_rss_feeds.py", "FEMADisasterCollector")
_CDCHealthAlertsCollector = _load_collector("gov_rss_feeds.py", "CDCHealthAlertsCollector")
_FDAShortagesCollector = _load_collector("gov_rss_feeds.py", "FDAShortagesCollector")
_GovTrackBillsCollector = _load_collector("gov_rss_feeds.py", "GovTrackBillsCollector")

# Freddie Mac (mortgage rates)
_FreddieMacPMMSCollector = _load_collector("freddie_mac.py", "FreddieMacPMMSCollector")

# ─── ID mapping: collector key → frontend indicator ID ───
COLLECTOR_TO_FRONTEND_ID = {
    # Core
    'cisa_cyber':         'cyber_01_cisa_kev',
    'who_disease':        'bio_01_h2h_countries',
    'grocery_cpi':        'econ_02_grocery_cpi',
    'treasury':           'econ_01_treasury_tail',
    'treasury_auctions':  'econ_01_treasury_tail',
    'jobless_claims':     'job_01_jobless_claims',
    'gdp_growth':         'green_g1_gdp_rates',
    'market_volatility':  'market_01_intraday_swing',
    'nws_alerts':         'grid_01_pjm_outages',
    'acled_protests':     'civil_01_acled_protests',
    'eia_spr':            'spr_01_level',
    # FAA - fixed IDs to match mock data
    'faa_ground_stops':   'flight_01_ground_stops',
    'faa_delays':         'flight_02_delay_pct',
    'faa_tfr':            'flight_03_tfr_count',
    # Travel
    'state_dept':         'travel_01_advisories',
    'cbp_border':         'travel_02_border_wait',
    'tsa_throughput':     'travel_03_tsa_throughput',
    # Banking
    'fdic_failures':      'bank_01_failures',
    'fed_discount':       'bank_02_discount_window',
    'fed_deposits':       'bank_03_deposit_flow',
    # EIA extras
    'eia_natgas':         'energy_02_nat_gas_storage',
    'eia_grid':           'energy_03_grid_emergency',
    # Labor
    'strike_tracker':     'job_01_strike_days',
    # Taiwan
    'taiwan_pla':         'taiwan_pla_activity',
    # Supply chain
    'port_congestion':    'supply_01_port_congestion',
    'freight_index':      'supply_02_freight_index',
    # Pharmacy
    'pharmacy_shortage':  'supply_pharmacy_shortage',
    # Global conflict
    'global_conflict':    'global_conflict_intensity',
    # Congress
    'congress_bills':     'hill_control_legislation',
    # Water infrastructure (food removed - no working sources)
    'epa_water':          'water_02_treatment_alerts',
    # Treasury/OFAC
    'ofac_sanctions':     'oil_03_ofac_designations',
    # Telecom infrastructure
    'bgp_anomalies':      'telecom_01_bgp_anomalies',
    'cell_outages':       'telecom_02_cell_outages',
    'undersea_cable':     'telecom_03_undersea_cable',
    # RSS alternatives (ACLED replacement)
    'protest_news':       'civil_01_acled_protests',
    'conflict_news':      'global_conflict_intensity',
    # More RSS collectors
    'nato_news':          'nato_high_readiness',
    'defense_spending':   'defense_spending_growth',
    'ai_layoffs':         'labor_ai_01_layoffs',
    'nuclear_tests':      'nuclear_test_activity',
    # Free alternatives to paid APIs
    'luxury_index':       'luxury_01_collapse',
    # 'oil_inventory' - no matching frontend indicator
    'chip_lead_time':     'supply_03_chip_lead_time',
    'ice_detention':      'ice_detention_surge',
    'hormuz_risk':        'hormuz_war_risk',
    'mortgage_delinq':    'housing_01_delinquency',
    'ai_religion':        'cult_media_01_trends',
    # New collectors
    'openstates':         'power_01_ai_surveillance',
    'courtlistener':      'liberty_litigation_count',
    'sec_filings':        'sec_8k_filings',
    'federal_register':   'federal_regulations',
    'fema_disasters':     'fema_disaster_declarations',
    'cdc_alerts':         'cdc_health_alerts',
    'fda_shortages':      'fda_drug_shortages',
    'govtrack':           'congress_activity',
    'freddie_mac':        'housing_03_rate_shock',
}

# ─── Frontend indicator metadata (matches mockData.ts shape) ───
INDICATOR_META: Dict[str, Dict[str, Any]] = {
    'cyber_01_cisa_kev': {
        'name': 'CISA KEV + ICS',
        'domain': 'security_infrastructure',
        'description': 'CISA Known Exploited Vulnerabilities + ICS advisories (90-day count)',
        'unit': 'vulns',
        'thresholds': {'green': {'max': 2}, 'amber': {'min': 2, 'max': 5}, 'red': {'min': 5}, 'threshold_amber': 2, 'threshold_red': 5},
        'critical': False,
        'dataSource': 'CISA JSON Feed',
        'updateFrequency': 'Daily',
    },
    'bio_01_h2h_countries': {
        'name': 'Novel H2H Pathogen',
        'domain': 'security_infrastructure',
        'description': 'Countries with novel human-to-human transmission events (14-day count)',
        'unit': 'countries',
        'thresholds': {'green': {'max': 0}, 'amber': {'min': 0, 'max': 2}, 'red': {'min': 3}, 'threshold_amber': 1, 'threshold_red': 3},
        'critical': False,
        'dataSource': 'WHO DON RSS',
        'updateFrequency': 'Daily',
    },
    'econ_02_grocery_cpi': {
        'name': 'Grocery CPI',
        'domain': 'economy',
        'description': 'Grocery CPI 3-month annualized — tracks food price inflation',
        'unit': '%',
        'thresholds': {'green': {'max': 4}, 'amber': {'min': 4, 'max': 8}, 'red': {'min': 8}, 'threshold_amber': 4, 'threshold_red': 8},
        'critical': False,
        'dataSource': 'BLS API',
        'updateFrequency': 'Monthly',
    },
    'econ_01_treasury_tail': {
        'name': '10Y Auction Tail',
        'domain': 'economy',
        'description': '10-year Treasury yield volatility in basis points',
        'unit': 'bps',
        'thresholds': {'green': {'max': 3}, 'amber': {'min': 3, 'max': 7}, 'red': {'min': 7}, 'threshold_amber': 3, 'threshold_red': 7},
        'critical': False,
        'dataSource': 'FRED API',
        'updateFrequency': 'Per auction',
    },
    'green_g1_gdp_rates': {
        'name': 'GDP Green Flag',
        'domain': 'economy',
        'description': 'US real GDP growth rate — positive signal when ≥4% with low rates',
        'unit': '%',
        'thresholds': {'green': {'min': 2}, 'amber': {'min': 0, 'max': 2}, 'red': {'max': 0}, 'threshold_amber': 2, 'threshold_red': 0},
        'greenFlag': True,
        'dataSource': 'FRED API',
        'updateFrequency': 'Quarterly',
    },
    'market_01_intraday_swing': {
        'name': '10Y Intraday Swing',
        'domain': 'economy',
        'description': '10-year Treasury intraday swing in basis points',
        'unit': 'bps',
        'thresholds': {'green': {'max': 20}, 'amber': {'min': 20, 'max': 30}, 'red': {'min': 30}, 'threshold_amber': 20, 'threshold_red': 30},
        'critical': True,
        'dataSource': 'Yahoo Finance',
        'updateFrequency': 'Real-time',
    },
    'job_01_strike_days': {
        'name': 'Initial Jobless Claims',
        'domain': 'jobs_labor',
        'description': 'Weekly initial unemployment claims (thousands)',
        'unit': 'thousands',
        'thresholds': {'green': {'max': 275}, 'amber': {'min': 275, 'max': 350}, 'red': {'min': 350}, 'threshold_amber': 275, 'threshold_red': 350},
        'critical': False,
        'dataSource': 'FRED API',
        'updateFrequency': 'Weekly',
    },
    'grid_01_pjm_outages': {
        'name': 'Severe Weather Alerts',
        'domain': 'security_infrastructure',
        'description': 'Active extreme + severe weather alerts nationwide (NWS)',
        'unit': 'alerts',
        'thresholds': {'green': {'max': 2}, 'amber': {'min': 3, 'max': 8}, 'red': {'min': 8}, 'threshold_amber': 3, 'threshold_red': 8},
        'critical': False,
        'dataSource': 'NWS API',
        'updateFrequency': 'Real-time',
    },
    'civil_01_acled_protests': {
        'name': 'Civil Unrest Events',
        'domain': 'security_infrastructure',
        'description': 'US protest and civil unrest events (30-day count from ACLED)',
        'unit': 'events',
        'thresholds': {'green': {'max': 50}, 'amber': {'min': 50, 'max': 150}, 'red': {'min': 150}, 'threshold_amber': 50, 'threshold_red': 150},
        'critical': False,
        'dataSource': 'ACLED API',
        'updateFrequency': 'Weekly',
    },
    'spr_01_level': {
        'name': 'Strategic Petroleum Reserve',
        'domain': 'energy',
        'description': 'US Strategic Petroleum Reserve level in millions of barrels',
        'unit': 'M bbl',
        'thresholds': {'green': {'max': 500}, 'amber': {'min': 400, 'max': 500}, 'red': {'min': 400}, 'threshold_amber': 500, 'threshold_red': 400},
        'critical': True,
        'dataSource': 'EIA API',
        'updateFrequency': 'Weekly',
    },
    'job_01_jobless_claims': {
        'name': 'Initial Jobless Claims',
        'domain': 'jobs_labor',
        'description': 'Weekly initial unemployment claims (thousands)',
        'unit': 'thousands',
        'thresholds': {'green': {'max': 275}, 'amber': {'min': 275, 'max': 350}, 'red': {'min': 350}, 'threshold_amber': 275, 'threshold_red': 350},
        'critical': False,
        'dataSource': 'FRED API',
        'updateFrequency': 'Weekly',
    },
    # FAA
    'faa_01_ground_stops': {
        'name': 'FAA Ground Stops',
        'domain': 'security_infrastructure',
        'description': 'Active FAA ground stop programs at major airports',
        'unit': 'stops',
        'thresholds': {'green': {'max': 0}, 'amber': {'min': 1, 'max': 3}, 'red': {'min': 3}, 'threshold_amber': 1, 'threshold_red': 3},
        'critical': True,
        'dataSource': 'FAA API',
        'updateFrequency': 'Real-time',
    },
    'faa_02_delays': {
        'name': 'Flight Delays',
        'domain': 'security_infrastructure',
        'description': 'Airports with significant arrival/departure delays',
        'unit': 'airports',
        'thresholds': {'green': {'max': 5}, 'amber': {'min': 5, 'max': 15}, 'red': {'min': 15}, 'threshold_amber': 5, 'threshold_red': 15},
        'critical': False,
        'dataSource': 'FAA API',
        'updateFrequency': 'Real-time',
    },
    'faa_03_tfr': {
        'name': 'Temporary Flight Restrictions',
        'domain': 'security_infrastructure',
        'description': 'Active TFRs (security, VIP, disasters)',
        'unit': 'TFRs',
        'thresholds': {'green': {'max': 20}, 'amber': {'min': 20, 'max': 50}, 'red': {'min': 50}, 'threshold_amber': 20, 'threshold_red': 50},
        'critical': False,
        'dataSource': 'FAA API',
        'updateFrequency': 'Real-time',
    },
    # Travel
    'travel_01_advisories': {
        'name': 'Travel Advisories',
        'domain': 'global_conflict',
        'description': 'Countries with Level 4 (Do Not Travel) advisories',
        'unit': 'countries',
        'thresholds': {'green': {'max': 15}, 'amber': {'min': 15, 'max': 25}, 'red': {'min': 25}, 'threshold_amber': 15, 'threshold_red': 25},
        'critical': False,
        'dataSource': 'State Dept',
        'updateFrequency': 'Daily',
    },
    'travel_02_border_wait': {
        'name': 'Border Wait Times',
        'domain': 'domestic_control',
        'description': 'Average wait time at major border crossings (minutes)',
        'unit': 'min',
        'thresholds': {'green': {'max': 30}, 'amber': {'min': 30, 'max': 90}, 'red': {'min': 90}, 'threshold_amber': 30, 'threshold_red': 90},
        'critical': False,
        'dataSource': 'CBP',
        'updateFrequency': 'Real-time',
    },
    'travel_03_tsa': {
        'name': 'TSA Throughput',
        'domain': 'security_infrastructure',
        'description': 'Daily TSA checkpoint throughput vs 2019 baseline (%)',
        'unit': '%',
        'thresholds': {'green': {'min': 90}, 'amber': {'min': 70, 'max': 90}, 'red': {'max': 70}, 'threshold_amber': 90, 'threshold_red': 70},
        'critical': False,
        'dataSource': 'TSA',
        'updateFrequency': 'Daily',
    },
    # Banking
    'bank_01_failures': {
        'name': 'Bank Failures',
        'domain': 'economy',
        'description': 'FDIC-insured bank failures (YTD)',
        'unit': 'banks',
        'thresholds': {'green': {'max': 2}, 'amber': {'min': 2, 'max': 5}, 'red': {'min': 5}, 'threshold_amber': 2, 'threshold_red': 5},
        'critical': True,
        'dataSource': 'FDIC',
        'updateFrequency': 'Weekly',
    },
    'bank_02_discount_window': {
        'name': 'Fed Discount Window',
        'domain': 'economy',
        'description': 'Fed discount window borrowing ($B)',
        'unit': '$B',
        'thresholds': {'green': {'max': 5}, 'amber': {'min': 5, 'max': 50}, 'red': {'min': 50}, 'threshold_amber': 5, 'threshold_red': 50},
        'critical': True,
        'dataSource': 'Federal Reserve',
        'updateFrequency': 'Weekly',
    },
    'bank_03_deposits': {
        'name': 'Bank Deposit Flows',
        'domain': 'economy',
        'description': 'Weekly change in commercial bank deposits ($B)',
        'unit': '$B',
        'thresholds': {'green': {'min': -20}, 'amber': {'min': -50, 'max': -20}, 'red': {'max': -50}, 'threshold_amber': -20, 'threshold_red': -50},
        'critical': False,
        'dataSource': 'Federal Reserve H.8',
        'updateFrequency': 'Weekly',
    },
    # Energy extras
    'energy_02_natgas': {
        'name': 'Natural Gas Storage',
        'domain': 'security_infrastructure',
        'description': 'Natural gas storage vs 5-year average (%)',
        'unit': '%',
        'thresholds': {'green': {'min': 95}, 'amber': {'min': 80, 'max': 95}, 'red': {'max': 80}, 'threshold_amber': 95, 'threshold_red': 80},
        'critical': False,
        'dataSource': 'EIA',
        'updateFrequency': 'Weekly',
    },
    'grid_02_emergencies': {
        'name': 'Grid Emergencies',
        'domain': 'security_infrastructure',
        'description': 'Active NERC grid emergency alerts',
        'unit': 'alerts',
        'thresholds': {'green': {'max': 0}, 'amber': {'min': 1, 'max': 2}, 'red': {'min': 2}, 'threshold_amber': 1, 'threshold_red': 2},
        'critical': True,
        'dataSource': 'EIA',
        'updateFrequency': 'Real-time',
    },
    # Labor
    'job_02_strikes': {
        'name': 'US Strike Days',
        'domain': 'jobs_labor',
        'description': 'Active major work stoppages (1000+ workers)',
        'unit': 'strikes',
        'thresholds': {'green': {'max': 1}, 'amber': {'min': 1, 'max': 3}, 'red': {'min': 3}, 'threshold_amber': 1, 'threshold_red': 3},
        'critical': False,
        'dataSource': 'Cornell ILR',
        'updateFrequency': 'Daily',
    },
    # Geopolitical
    'geo_01_taiwan': {
        'name': 'Taiwan PLA Incursions',
        'domain': 'global_conflict',
        'description': 'PLA aircraft/vessels in Taiwan ADIZ (7-day count)',
        'unit': 'incursions',
        'thresholds': {'green': {'max': 20}, 'amber': {'min': 20, 'max': 50}, 'red': {'min': 50}, 'threshold_amber': 20, 'threshold_red': 50},
        'critical': True,
        'dataSource': 'Taiwan MND',
        'updateFrequency': 'Daily',
    },
    'geo_02_conflict': {
        'name': 'Global Battle Intensity',
        'domain': 'global_conflict',
        'description': 'Global armed conflict events (30-day rolling)',
        'unit': 'events',
        'thresholds': {'green': {'max': 500}, 'amber': {'min': 500, 'max': 1000}, 'red': {'min': 1000}, 'threshold_amber': 500, 'threshold_red': 1000},
        'critical': False,
        'dataSource': 'ACLED API',
        'updateFrequency': 'Weekly',
    },
    # Supply chain
    'supply_01_ports': {
        'name': 'Port Congestion',
        'domain': 'security_infrastructure',
        'description': 'Ships waiting at major US ports',
        'unit': 'ships',
        'thresholds': {'green': {'max': 10}, 'amber': {'min': 10, 'max': 30}, 'red': {'min': 30}, 'threshold_amber': 10, 'threshold_red': 30},
        'critical': False,
        'dataSource': 'Marine Exchange',
        'updateFrequency': 'Daily',
    },
    'supply_02_freight': {
        'name': 'Freight Index',
        'domain': 'security_infrastructure',
        'description': 'Global container freight index (FBX)',
        'unit': '$/FEU',
        'thresholds': {'green': {'max': 2000}, 'amber': {'min': 2000, 'max': 5000}, 'red': {'min': 5000}, 'threshold_amber': 2000, 'threshold_red': 5000},
        'critical': False,
        'dataSource': 'Freightos',
        'updateFrequency': 'Daily',
    },
    # Health
    'health_01_pharmacy': {
        'name': 'Pharmacy Shortages',
        'domain': 'security_infrastructure',
        'description': 'Critical drug shortages on FDA list',
        'unit': 'drugs',
        'thresholds': {'green': {'max': 100}, 'amber': {'min': 100, 'max': 150}, 'red': {'min': 150}, 'threshold_amber': 100, 'threshold_red': 150},
        'critical': False,
        'dataSource': 'FDA',
        'updateFrequency': 'Weekly',
    },
    # Congress
    'hill_control_legislation': {
        'name': 'Control Bills Advancing',
        'domain': 'domestic_control',
        'description': 'Bills related to AI, surveillance, emergency powers advancing in Congress',
        'unit': 'bills',
        'thresholds': {'green': {'max': 3}, 'amber': {'min': 3, 'max': 8}, 'red': {'min': 8}, 'threshold_amber': 3, 'threshold_red': 8},
        'critical': False,
        'dataSource': 'Congress.gov',
        'updateFrequency': 'Daily',
    },
    # Food Production
    'food_01_crop_condition': {
        'name': 'Crop Conditions',
        'domain': 'food_production',
        'description': 'Major crops rated Good/Excellent — domestic food supply health',
        'unit': '%',
        'thresholds': {'green': {'min': 60}, 'amber': {'min': 40, 'max': 60}, 'red': {'max': 40}, 'threshold_amber': 60, 'threshold_red': 40},
        'critical': False,
        'dataSource': 'USDA NASS',
        'updateFrequency': 'Weekly',
    },
    'food_02_livestock_disease': {
        'name': 'Livestock Disease Alerts',
        'domain': 'food_production',
        'description': 'Active USDA animal disease emergencies — meat supply and zoonotic risk',
        'unit': 'alerts',
        'thresholds': {'green': {'max': 1}, 'amber': {'min': 1, 'max': 3}, 'red': {'min': 3}, 'threshold_amber': 1, 'threshold_red': 3},
        'critical': False,
        'dataSource': 'USDA APHIS',
        'updateFrequency': 'Daily',
    },
    'food_03_fertilizer_price': {
        'name': 'Fertilizer Price Index',
        'domain': 'food_production',
        'description': 'DAP/Urea price vs 5-year average — food price leading indicator',
        'unit': '% of avg',
        'thresholds': {'green': {'max': 120}, 'amber': {'min': 120, 'max': 180}, 'red': {'min': 180}, 'threshold_amber': 120, 'threshold_red': 180},
        'critical': False,
        'dataSource': 'World Bank',
        'updateFrequency': 'Monthly',
    },
    'food_04_processing_capacity': {
        'name': 'Meat Processing Capacity',
        'domain': 'food_production',
        'description': 'Slaughter capacity utilization — supply chain health',
        'unit': '%',
        'thresholds': {'green': {'min': 85}, 'amber': {'min': 70, 'max': 85}, 'red': {'max': 70}, 'threshold_amber': 85, 'threshold_red': 70},
        'critical': False,
        'dataSource': 'USDA AMS',
        'updateFrequency': 'Daily',
    },
    # Water Infrastructure
    'water_01_reservoir_level': {
        'name': 'Major Reservoir Levels',
        'domain': 'water_infrastructure',
        'description': 'Average capacity of top 25 US reservoirs — drought and water supply indicator',
        'unit': '%',
        'thresholds': {'green': {'min': 70}, 'amber': {'min': 50, 'max': 70}, 'red': {'max': 50}, 'threshold_amber': 70, 'threshold_red': 50},
        'critical': False,
        'dataSource': 'USBR',
        'updateFrequency': 'Weekly',
    },
    'water_02_treatment_alerts': {
        'name': 'Water Treatment Alerts',
        'domain': 'water_infrastructure',
        'description': 'EPA drinking water advisories and boil notices — water safety signal',
        'unit': 'alerts',
        'thresholds': {'green': {'max': 5}, 'amber': {'min': 5, 'max': 15}, 'red': {'min': 15}, 'threshold_amber': 5, 'threshold_red': 15},
        'critical': False,
        'dataSource': 'EPA SDWIS',
        'updateFrequency': 'Daily',
    },
    'water_03_drought_monitor': {
        'name': 'Drought Severity',
        'domain': 'water_infrastructure',
        'description': 'US area in D3+ (extreme/exceptional drought) — agricultural and water crisis indicator',
        'unit': '%',
        'thresholds': {'green': {'max': 10}, 'amber': {'min': 10, 'max': 25}, 'red': {'min': 25}, 'threshold_amber': 10, 'threshold_red': 25},
        'critical': False,
        'dataSource': 'US Drought Monitor',
        'updateFrequency': 'Weekly',
    },
    # OFAC/Treasury
    'ofac_01_designations': {
        'name': 'OFAC Sanctions (Oil)',
        'domain': 'oil_dollar',
        'description': 'OFAC sanctions designations targeting oil trade entities (30-day count)',
        'unit': 'designations',
        'thresholds': {'green': {'max': 5}, 'amber': {'min': 5, 'max': 15}, 'red': {'min': 15}, 'threshold_amber': 5, 'threshold_red': 15},
        'critical': False,
        'dataSource': 'OFAC Treasury',
        'updateFrequency': 'Daily',
    },
    # Telecom Infrastructure
    'telecom_01_bgp_anomalies': {
        'name': 'BGP Routing Anomalies',
        'domain': 'telecommunications',
        'description': 'Major internet routing anomalies detected — potential outages or attacks',
        'unit': 'anomalies',
        'thresholds': {'green': {'max': 2}, 'amber': {'min': 2, 'max': 5}, 'red': {'min': 5}, 'threshold_amber': 2, 'threshold_red': 5},
        'critical': True,
        'dataSource': 'CAIDA BGP Stream',
        'updateFrequency': 'Real-time',
    },
    'telecom_02_cell_outages': {
        'name': 'Cell Network Outages',
        'domain': 'telecommunications',
        'description': 'Major carrier cellular network outages affecting 10k+ users',
        'unit': 'outages',
        'thresholds': {'green': {'max': 3}, 'amber': {'min': 3, 'max': 8}, 'red': {'min': 8}, 'threshold_amber': 3, 'threshold_red': 8},
        'critical': False,
        'dataSource': 'FCC NORS',
        'updateFrequency': 'Real-time',
    },
    'telecom_03_undersea_cable': {
        'name': 'Undersea Cable Incidents',
        'domain': 'telecommunications',
        'description': 'Undersea cable cuts or repair events — global connectivity risk',
        'unit': 'incidents',
        'thresholds': {'green': {'max': 0}, 'amber': {'min': 1, 'max': 2}, 'red': {'min': 2}, 'threshold_amber': 1, 'threshold_red': 2},
        'critical': True,
        'dataSource': 'Submarine Cable Map',
        'updateFrequency': 'Daily',
    },
}


def _determine_level(value: float, thresholds: Dict[str, Any]) -> str:
    """Determine green/amber/red level from value and thresholds."""
    amber = thresholds.get('threshold_amber')
    red = thresholds.get('threshold_red')

    if amber is None or red is None:
        return 'unknown'

    # Standard: higher is worse
    if red > amber:
        if value >= red:
            return 'red'
        elif value >= amber:
            return 'amber'
        return 'green'
    # Inverted: lower is worse (e.g. GDP)
    else:
        if value <= red:
            return 'red'
        elif value <= amber:
            return 'amber'
        return 'green'


class DataService:
    """Cached data service that collects from real APIs where possible."""

    def __init__(self):
        config_path = Path(__file__).parent.parent / "config" / "config.yaml"
        self.config = ConfigLoader(str(config_path))

        # Initialize collectors that can work without API keys
        self._collectors: Dict[str, Any] = {}
        self._init_collectors()

        # Cache
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl: Dict[str, float] = {}
        self._default_ttl = 300  # 5 minutes

    def _init_collectors(self):
        """Initialize collectors. Only include ones that imported successfully."""
        candidate_collectors = {
            # Core
            'cisa_cyber': _CISACyberCollector,
            'who_disease': _WHODiseaseCollector,
            'grocery_cpi': _GroceryCPICollector,
            'treasury': _TreasuryCollector,
            'jobless_claims': _JoblessClaimsCollector,
            'gdp_growth': _GDPGrowthCollector,
            'market_volatility': _MarketVolatilityCollector,
            'treasury_auctions': _TreasuryAuctionCollector,
            'nws_alerts': _NWSAlertsCollector,
            'acled_protests': _ACLEDProtestsCollector,
            'eia_spr': _EIASPRCollector,
            # FAA
            'faa_ground_stops': _FAAGroundStopsCollector,
            'faa_delays': _FAAFlightDelaysCollector,
            'faa_tfr': _FAATFRCollector,
            # Travel
            'state_dept': _StateDeptAdvisoryCollector,
            'cbp_border': _CBPBorderWaitCollector,
            'tsa_throughput': _TSAThroughputCollector,
            # Banking
            'fdic_failures': _FDICBankFailuresCollector,
            'fed_discount': _FedDiscountWindowCollector,
            'fed_deposits': _FedDepositsCollector,
            # EIA extras
            'eia_natgas': _EIANaturalGasCollector,
            'eia_grid': _EIAGridEmergencyCollector,
            # Labor
            'strike_tracker': _StrikeTrackerCollector,
            # Taiwan
            'taiwan_pla': _TaiwanPLACollector,
            # Supply chain
            'port_congestion': _PortCongestionCollector,
            'freight_index': _FreightIndexCollector,
            # Pharmacy
            'pharmacy_shortage': _PharmacyShortageCollector,
            # Global conflict
            'global_conflict': _GlobalConflictCollector,
            # Congress
            'congress_bills': _CongressBillsCollector,
            # USDA / Food
            'usda_crops': _USDACropConditionCollector,
            'usda_livestock': _USDALivestockDiseaseCollector,
            'fertilizer_price': _FertilizerPriceCollector,
            'usda_processing': _USDAMeatProcessingCollector,
            # Water Infrastructure
            # 'reservoir_level': _ReservoirLevelCollector,  # UNAVAILABLE - data source parsing issue
            'epa_water': _EPAWaterAlertsCollector,
            # 'drought_monitor': _DroughtMonitorCollector,  # REMOVED from frontend - no working API
            # Treasury/OFAC
            'ofac_sanctions': _OFACSanctionsCollector,
            # Telecom Infrastructure
            'bgp_anomalies': _BGPAnomaliesCollector,
            # 'cell_outages': _CellOutagesCollector,  # UNAVAILABLE - DownDetector scraping unreliable
            'undersea_cable': _UnderseaCableCollector,
            # RSS alternatives
            'protest_news': _ProtestNewsCollector,
            'conflict_news': _GlobalConflictNewsCollector,
            'nato_news': _NATONewsCollector,
            'defense_spending': _DefenseSpendingCollector,
            'ai_layoffs': _AILayoffsCollector,
            'nuclear_tests': _NuclearTestsCollector,
            # Free alternatives
            'luxury_index': _YahooLuxuryIndexCollector,
            'oil_inventory': _EIAOilInventoryCollector,
            'chip_lead_time': _SemiconductorLeadTimeCollector,
            # 'ice_detention': _ICEDetentionCollector,  # UNAVAILABLE - ICE data not publicly accessible
            'hormuz_risk': _HormuzRiskCollector,
            'mortgage_delinq': _MortgageDelinquencyCollector,
            'ai_religion': _GoogleTrendsCollector,
            # OpenStates (state legislation)
            'openstates': _OpenStatesAISurveillanceCollector,
            # CourtListener (civil liberties cases)
            'courtlistener': _CourtListenerLibertyCollector,
            # Government RSS feeds
            # 'sec_filings': _SECFilingsCollector,  # RSS parsing unreliable
            'federal_register': _FederalRegisterCollector,
            'fema_disasters': _FEMADisasterCollector,
            'cdc_alerts': _CDCHealthAlertsCollector,
            'fda_shortages': _FDAShortagesCollector,
            'govtrack': _GovTrackBillsCollector,
            # Freddie Mac mortgage rates
            'freddie_mac': _FreddieMacPMMSCollector,
        }

        for key, cls in candidate_collectors.items():
            if cls is None:
                continue
            try:
                self._collectors[key] = cls(self.config)
                logger.info(f"Initialized collector: {key}")
            except Exception as e:
                logger.warning(f"Failed to init {key}: {e}")

    def collect_indicator(self, collector_key: str) -> Optional[Dict[str, Any]]:
        """Collect a single indicator, with caching."""
        # Check cache
        now = time.time()
        if collector_key in self._cache:
            if now < self._cache_ttl.get(collector_key, 0):
                return self._cache[collector_key]

        collector = self._collectors.get(collector_key)
        if not collector:
            return None

        try:
            raw = collector.collect()
            if raw is None:
                return None

            frontend_id = COLLECTOR_TO_FRONTEND_ID.get(collector_key, collector_key)
            meta = INDICATOR_META.get(frontend_id, {})
            thresholds = meta.get('thresholds', {})

            value = raw.get('value', 0)
            source_type = raw.get('metadata', {}).get('data_source', raw.get('metadata', {}).get('source', 'LIVE'))
            is_live = source_type not in ('mock_data', 'MOCK', 'Mock data')

            level = _determine_level(value, thresholds) if thresholds else 'unknown'

            indicator = {
                'id': frontend_id,
                'name': meta.get('name', collector_key),
                'domain': meta.get('domain', 'economy'),
                'description': meta.get('description', ''),
                'unit': meta.get('unit', ''),
                'thresholds': thresholds,
                'critical': meta.get('critical', False),
                'greenFlag': meta.get('greenFlag', False),
                'enabled': True,
                'dataSource': meta.get('dataSource', 'Unknown'),
                'updateFrequency': meta.get('updateFrequency', '60m'),
                'status': {
                    'level': level,
                    'value': value,
                    'trend': 'stable',
                    'lastUpdate': raw.get('timestamp', datetime.utcnow().isoformat()),
                    'dataSource': 'LIVE' if is_live else 'MOCK',
                },
            }

            # Cache it
            self._cache[collector_key] = indicator
            self._cache_ttl[collector_key] = now + self._default_ttl

            return indicator

        except Exception as e:
            logger.error(f"Error collecting {collector_key}: {e}")
            return None

    def collect_all(self) -> List[Dict[str, Any]]:
        """Collect all indicators that have registered collectors.

        When multiple collectors map to the same frontend ID,
        the last one wins (allows treasury_auctions to override treasury).
        """
        seen: Dict[str, Dict[str, Any]] = {}
        for key in self._collectors:
            indicator = self.collect_indicator(key)
            if indicator:
                seen[indicator['id']] = indicator
        return list(seen.values())

    def get_live_ids(self) -> List[str]:
        """Return frontend IDs that have live collectors."""
        return [
            COLLECTOR_TO_FRONTEND_ID[k]
            for k in self._collectors
            if k in COLLECTOR_TO_FRONTEND_ID
        ]

    def invalidate_cache(self):
        """Clear all cached data."""
        self._cache.clear()
        self._cache_ttl.clear()


# Singleton
_service: Optional[DataService] = None


def get_data_service() -> DataService:
    global _service
    if _service is None:
        _service = DataService()
    return _service
