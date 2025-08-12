"""
Data collectors for various trip-wire indicators.

Each collector implements the BaseCollector interface and is responsible
for gathering data from specific sources.
"""

from .base import BaseCollector
from .treasury import TreasuryCollector
from .ice_detention import ICEDetentionCollector
from .taiwan_zone import TaiwanZoneCollector
from .hormuz_risk import HormuzRiskCollector
from .dod_autonomy import DoDAutonomyCollector
from .mbridge import MBridgeCollector
from .jobless_claims import JoblessClaimsCollector
from .luxury_collapse import LuxuryCollapseCollector
from .pharmacy_shortage import PharmacyShortageCollector
from .school_closures import SchoolClosureCollector
from .agi_milestones import AGIMilestoneCollector
from .labor_displacement import LaborDisplacementCollector
from .grocery_cpi import GroceryCPICollector
from .cisa_cyber import CISACyberCollector
from .grid_outage import GridOutageCollector
from .gdp_growth import GDPGrowthCollector
from .strike_tracker import StrikeTrackerCollector
from .legiscan import LegiScanCollector
from .acled_protests import ACLEDProtestsCollector
from .market_volatility import MarketVolatilityCollector
from .who_disease import WHODiseaseCollector
from .crea_oil import CREAOilCollector
from .ofac_designations import OFACDesignationsCollector
from .ai_layoffs import AILayoffsCollector

__all__ = [
    'BaseCollector',
    'TreasuryCollector',
    'ICEDetentionCollector',
    'TaiwanZoneCollector',
    'HormuzRiskCollector',
    'DoDAutonomyCollector',
    'MBridgeCollector',
    'JoblessClaimsCollector',
    'LuxuryCollapseCollector',
    'PharmacyShortageCollector',
    'SchoolClosureCollector',
    'AGIMilestoneCollector',
    'LaborDisplacementCollector',
    'GroceryCPICollector',
    'CISACyberCollector',
    'GridOutageCollector',
    'GDPGrowthCollector',
    'StrikeTrackerCollector',
    'LegiScanCollector',
    'ACLEDProtestsCollector',
    'MarketVolatilityCollector',
    'WHODiseaseCollector',
    'CREAOilCollector',
    'OFACDesignationsCollector',
    'AILayoffsCollector',
]