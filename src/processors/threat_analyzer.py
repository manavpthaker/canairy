"""
Threat level analyzer for trip-wire indicators.

Analyzes collected data against thresholds to determine threat levels
(green, amber, red) for each indicator.
"""

from typing import Dict, Any, Optional
import logging
from datetime import datetime


class ThreatAnalyzer:
    """Analyzes threat levels based on collected data."""
    
    def __init__(self, config):
        """
        Initialize the threat analyzer.
        
        Args:
            config: Configuration object
        """
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Load thresholds from configuration
        self.thresholds = self._load_thresholds_from_config()
        self.tighten_up_threshold = config.get_alert_config().get('tighten_up_threshold', 2)
    
    def _load_thresholds_from_config(self) -> Dict[str, Dict[str, float]]:
        """Load thresholds from configuration file."""
        thresholds = {}
        
        # Get trip wire configurations
        trip_wires = self.config.config.get('trip_wires', {})
        
        # Map config names to collector names
        name_mapping = {
            'treasury_tail': 'Treasury',
            'ice_detention': 'ICEDetention',
            'taiwan_exclusion': 'TaiwanZone',
            'hormuz_risk': 'HormuzRisk',
            'dod_autonomy': 'DoDAutonomy',
            'mbridge_crude': 'MBridge',
            'jobless_claims': 'JoblessClaims',
            'luxury_collapse': 'LuxuryCollapse',
            'pharmacy_shortage': 'PharmacyShortage',
            'school_closures': 'SchoolClosures',
            'agi_milestones': 'AGIMilestones',
            'labor_displacement': 'LaborDisplacement'
        }
        
        for config_name, collector_name in name_mapping.items():
            if config_name in trip_wires:
                trip_wire = trip_wires[config_name]
                trip_thresholds = trip_wire.get('thresholds', {})
                
                # Convert percentage thresholds to decimal if needed
                if trip_wire.get('unit') == 'percentage' and config_name in ['ice_detention', 'hormuz_risk']:
                    thresholds[collector_name] = {
                        'amber': trip_thresholds.get('amber', 0) * 100,  # Convert to percentage
                        'red': trip_thresholds.get('red', 999) * 100
                    }
                else:
                    thresholds[collector_name] = {
                        'amber': trip_thresholds.get('amber', 0),
                        'red': trip_thresholds.get('red', 999)
                    }
                
                self.logger.debug(f"Loaded thresholds for {collector_name}: {thresholds[collector_name]}")
        
        return thresholds
        
    def analyze(self, readings: Dict[str, Any]) -> Dict[str, str]:
        """
        Analyze readings to determine threat levels.
        
        Args:
            readings: Dictionary of collector readings
            
        Returns:
            Dictionary mapping collector names to threat levels
        """
        threat_levels = {}
        
        for collector_name, reading in readings.items():
            if reading is None:
                threat_levels[collector_name] = "unknown"
                continue
                
            threat_level = self._calculate_threat_level(collector_name, reading)
            threat_levels[collector_name] = threat_level
            
            self.logger.info(f"{collector_name}: {threat_level} "
                           f"(value: {reading.get('value', 'N/A')})")
            
        return threat_levels
        
    def _calculate_threat_level(self, collector_name: str, reading: Dict[str, Any]) -> str:
        """
        Calculate threat level for a specific reading.
        
        Args:
            collector_name: Name of the collector
            reading: The reading data
            
        Returns:
            Threat level: 'green', 'amber', or 'red'
        """
        if collector_name not in self.thresholds:
            self.logger.warning(f"No thresholds defined for {collector_name}")
            return "unknown"
            
        try:
            value = reading.get('value')
            if value is None:
                return "unknown"
                
            thresholds = self.thresholds[collector_name]
            
            # For string status values (Taiwan, DoD), handle differently
            if collector_name in ['TaiwanZone', 'DoDAutonomy']:
                # Get string thresholds from config
                trip_wire_config = self.config.get_trip_wire_config({
                    'TaiwanZone': 'taiwan_exclusion',
                    'DoDAutonomy': 'dod_autonomy'
                }.get(collector_name, ''))
                
                if trip_wire_config:
                    string_thresholds = trip_wire_config.get('thresholds', {})
                    # For mock data using numeric values, map to threat levels
                    if isinstance(value, (int, float)):
                        # Mock data mapping: higher values = worse
                        if collector_name == 'TaiwanZone':
                            if value >= 20:  # Would be "BLOCKADE"
                                return "red"
                            elif value >= 10:  # Would be "TEMP"
                                return "amber"
                            else:  # Would be "NONE"
                                return "green"
                        elif collector_name == 'DoDAutonomy':
                            if value >= 1000:  # Would be "REMOVED"
                                return "red"
                            elif value >= 500:  # Would be "PILOT"
                                return "amber"
                            else:  # Would be "HUMAN VETO"
                                return "green"
                    else:
                        # Real data with string values
                        if value == string_thresholds.get('red'):
                            return "red"
                        elif value == string_thresholds.get('amber'):
                            return "amber"
                        elif value == string_thresholds.get('green'):
                            return "green"
                        else:
                            return "unknown"
                else:
                    # Fallback to numeric comparison
                    if value >= thresholds['red']:
                        return "red"
                    elif value >= thresholds['amber']:
                        return "amber"
                    else:
                        return "green"
            else:
                # Numeric comparison for other indicators
                if value >= thresholds['red']:
                    return "red"
                elif value >= thresholds['amber']:
                    return "amber"
                else:
                    return "green"
                
        except Exception as e:
            self.logger.error(f"Error calculating threat level for {collector_name}: {e}")
            return "unknown"
            
    def get_overall_status(self, threat_levels: Dict[str, str]) -> Dict[str, Any]:
        """
        Calculate overall system status.
        
        Args:
            threat_levels: Dictionary of threat levels by collector
            
        Returns:
            Overall status information
        """
        red_count = sum(1 for level in threat_levels.values() if level == "red")
        amber_count = sum(1 for level in threat_levels.values() if level == "amber")
        green_count = sum(1 for level in threat_levels.values() if level == "green")
        unknown_count = sum(1 for level in threat_levels.values() if level == "unknown")
        
        # Determine if TIGHTEN-UP condition is met
        tighten_up = red_count >= self.tighten_up_threshold
        
        return {
            'red_count': red_count,
            'amber_count': amber_count,
            'green_count': green_count,
            'unknown_count': unknown_count,
            'tighten_up': tighten_up,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    def format_threat_summary(self, threat_levels: Dict[str, str], 
                            readings: Dict[str, Any]) -> str:
        """
        Format a human-readable threat summary.
        
        Args:
            threat_levels: Dictionary of threat levels
            readings: Original readings data
            
        Returns:
            Formatted summary string
        """
        status = self.get_overall_status(threat_levels)
        
        summary = [
            f"Threat Analysis Summary - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "=" * 60,
            f"Red Alerts: {status['red_count']}",
            f"Amber Alerts: {status['amber_count']}",
            f"Green Status: {status['green_count']}",
            f"Unknown: {status['unknown_count']}",
            "",
        ]
        
        if status['tighten_up']:
            summary.extend([
                "*** TIGHTEN-UP CONDITION ACTIVE ***",
                "Two or more red alerts detected!",
                ""
            ])
            
        # Add details for each indicator
        for name, level in sorted(threat_levels.items()):
            reading = readings.get(name, {})
            value = reading.get('value', 'N/A') if reading else 'N/A'
            summary.append(f"- {name}: {level.upper()} (Value: {value})")
            
        return "\n".join(summary)