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

# These collectors have minimal dependencies (requests, feedparser)
_CISACyberCollector = _load_collector("cisa_cyber.py", "CISACyberCollector")
_WHODiseaseCollector = _load_collector("who_disease.py", "WHODiseaseCollector")
_GroceryCPICollector = _load_collector("grocery_cpi.py", "GroceryCPICollector")
_TreasuryCollector = _load_collector("treasury.py", "TreasuryCollector")
_JoblessClaimsCollector = _load_collector("jobless_claims.py", "JoblessClaimsCollector")
_GDPGrowthCollector = _load_collector("gdp_growth.py", "GDPGrowthCollector")
_MarketVolatilityCollector = _load_collector("market_volatility.py", "MarketVolatilityCollector")

# ─── ID mapping: collector key → frontend indicator ID ───
COLLECTOR_TO_FRONTEND_ID = {
    'cisa_cyber':        'cyber_01_cisa_kev',
    'who_disease':       'bio_01_h2h_countries',
    'grocery_cpi':       'econ_02_grocery_cpi',
    'treasury':          'econ_01_treasury_tail',
    'jobless_claims':    'job_01_strike_days',  # reuse slot for now
    'gdp_growth':        'green_g1_gdp_rates',
    'market_volatility': 'market_01_intraday_swing',
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
        'thresholds': {'green': {'max': 1}, 'amber': {'min': 0, 'max': 1}, 'red': {'min': 0}},
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
            'cisa_cyber': _CISACyberCollector,
            'who_disease': _WHODiseaseCollector,
            'grocery_cpi': _GroceryCPICollector,
            'treasury': _TreasuryCollector,
            'jobless_claims': _JoblessClaimsCollector,
            'gdp_growth': _GDPGrowthCollector,
            'market_volatility': _MarketVolatilityCollector,
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
        """Collect all indicators that have registered collectors."""
        results = []
        for key in self._collectors:
            indicator = self.collect_indicator(key)
            if indicator:
                results.append(indicator)
        return results

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
