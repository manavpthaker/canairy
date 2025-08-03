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
]