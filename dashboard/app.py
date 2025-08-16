#!/usr/bin/env python3
"""
Web dashboard for Household Resilience Monitoring System.
Provides family-friendly interface to view status and emergency procedures.
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from flask import Flask, render_template, jsonify, request
from datetime import datetime
import json
import logging
import os
import pickle
from typing import Dict, Any

from collectors import (
    TreasuryCollector,
    ICEDetentionCollector, 
    TaiwanZoneCollector,
    HormuzRiskCollector,
    DoDAutonomyCollector,
    MBridgeCollector,
    JoblessClaimsCollector,
    LuxuryCollapseCollector,
    PharmacyShortageCollector,
    SchoolClosureCollector,
    AGIMilestoneCollector,
    LaborDisplacementCollector,
    GroceryCPICollector,
    CISACyberCollector,
    GridOutageCollector,
    GDPGrowthCollector,
    StrikeTrackerCollector,
    LegiScanCollector,
    ACLEDProtestsCollector,
    MarketVolatilityCollector,
    WHODiseaseCollector,
    CREAOilCollector,
    OFACDesignationsCollector,
    AILayoffsCollector,
    MBridgeSettlementsCollector,
    JODIOilCollector,
    AIRansomwareCollector,
    DeepfakeShocksCollector,
    GlobalConflictCollector,
    TaiwanPLACollector,
    NATOReadinessCollector,
    NuclearTestsCollector,
    RussiaNATOCollector,
    DefenseSpendingCollector,
    DCControlCollector,
    GuardMetrosCollector,
    ICEDetentionsCollector,
    DHSRemovalCollector,
    HillLegislationCollector,
    LibertyLitigationCollector
)
from processors.threat_analyzer import ThreatAnalyzer
from processors.phase_manager import PhaseManager
from processors.stale_handler import StaleDataHandler
from utils.config_loader import ConfigLoader

app = Flask(__name__)
app.config['SECRET_KEY'] = 'household-resilience-2024'

# Initialize components
import os
config_path = os.path.join(os.path.dirname(__file__), "..", "config", "config.yaml")
config = ConfigLoader(config_path)
# Initialize collectors based on enabled status in config
all_collectors = {
    'Treasury': TreasuryCollector,
    'ICEDetention': ICEDetentionCollector,
    'TaiwanZone': TaiwanZoneCollector,
    'HormuzRisk': HormuzRiskCollector,
    'DoDAutonomy': DoDAutonomyCollector,
    'MBridge': MBridgeCollector,
    'JoblessClaims': JoblessClaimsCollector,
    'LuxuryCollapse': LuxuryCollapseCollector,
    'PharmacyShortage': PharmacyShortageCollector,
    'SchoolClosures': SchoolClosureCollector,
    'AGIMilestones': AGIMilestoneCollector,
    'LaborDisplacement': LaborDisplacementCollector,
    'GroceryCPI': GroceryCPICollector,
    'CISACyber': CISACyberCollector,
    'GridOutages': GridOutageCollector,
    'GDPGrowth': GDPGrowthCollector,
    'StrikeTracker': StrikeTrackerCollector,
    'LegiScan': LegiScanCollector,
    'ACLEDProtests': ACLEDProtestsCollector,
    'MarketVolatility': MarketVolatilityCollector,
    'WHODisease': WHODiseaseCollector,
    'CREAOil': CREAOilCollector,
    'OFACDesignations': OFACDesignationsCollector,
    'AILayoffs': AILayoffsCollector,
    'MBridgeSettlements': MBridgeSettlementsCollector,
    'JODIOil': JODIOilCollector,
    'AIRansomware': AIRansomwareCollector,
    'DeepfakeShocks': DeepfakeShocksCollector,
    'GlobalConflict': GlobalConflictCollector,
    'TaiwanPLA': TaiwanPLACollector,
    'NATOReadiness': NATOReadinessCollector,
    'NuclearTests': NuclearTestsCollector,
    'RussiaNATO': RussiaNATOCollector,
    'DefenseSpending': DefenseSpendingCollector,
    'DCControl': DCControlCollector,
    'GuardMetros': GuardMetrosCollector,
    'ICEDetentions': ICEDetentionsCollector,
    'DHSRemoval': DHSRemovalCollector,
    'HillLegislation': HillLegislationCollector,
    'LibertyLitigation': LibertyLitigationCollector
}

# Only initialize enabled collectors
collectors = {}
trip_wire_config = config.config.get('trip_wires', {})

# Map config names to collector names
config_to_collector = {
    # Original indicators
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
    'labor_displacement': 'LaborDisplacement',
    'grocery_cpi': 'GroceryCPI',
    'cisa_cyber': 'CISACyber',
    'grid_outages': 'GridOutages',
    'gdp_growth': 'GDPGrowth',
    # New phase-based indicators
    'econ_01_treasury_tail': 'Treasury',
    'econ_02_grocery_cpi': 'GroceryCPI',
    'job_01_strike_days': 'StrikeTracker',
    'power_01_ai_surveillance': 'LegiScan',
    'cyber_01_cisa_kev': 'CISACyber',
    'civil_01_acled_protests': 'ACLEDProtests',
    'grid_01_pjm_outages': 'GridOutages',
    'market_01_intraday_swing': 'MarketVolatility',
    'bio_01_h2h_countries': 'WHODisease',
    'oil_01_russian_brics': 'CREAOil',
    'oil_02_mbridge_settlements': 'MBridgeSettlements',
    'oil_03_ofac_designations': 'OFACDesignations',
    'oil_04_refinery_ratio': 'JODIOil',
    'labor_ai_01_layoffs': 'AILayoffs',
    'cyber_02_ai_ransomware': 'AIRansomware',
    'info_02_deepfake_shocks': 'DeepfakeShocks',
    'green_g1_gdp_rates': 'GDPGrowth',  # Green flag indicator using GDP collector
    # New global conflict indicators
    'global_conflict_intensity': 'GlobalConflict',
    'taiwan_pla_activity': 'TaiwanPLA',
    'nato_high_readiness': 'NATOReadiness',
    'nuclear_test_activity': 'NuclearTests',
    'russia_nato_escalation': 'RussiaNATO',
    'defense_spending_growth': 'DefenseSpending',
    # New domestic control indicators
    'dc_control_countdown': 'DCControl',
    'national_guard_metros': 'GuardMetros',
    'ice_detention_surge': 'ICEDetentions',
    'dhs_removal_expansion': 'DHSRemoval',
    'hill_control_legislation': 'HillLegislation',
    'liberty_litigation_count': 'LibertyLitigation'
}

for config_name, collector_name in config_to_collector.items():
    if config_name in trip_wire_config and trip_wire_config[config_name].get('enabled', True):
        if collector_name in all_collectors:
            collectors[collector_name] = all_collectors[collector_name](config)
threat_analyzer = ThreatAnalyzer(config)
phase_manager = PhaseManager(config)
stale_handler = StaleDataHandler(config)

# Cache for latest readings
latest_data = {
    'readings': {},
    'threat_levels': {},
    'last_update': None,
    'tighten_up': False
}

# Manual data overrides
data_dir = Path(__file__).parent.parent / 'data'
data_dir.mkdir(exist_ok=True)
manual_data_file = data_dir / 'manual_overrides.pkl'
manual_overrides = {}

# Load manual overrides if they exist
if manual_data_file.exists():
    try:
        with open(manual_data_file, 'rb') as f:
            manual_overrides = pickle.load(f)
    except:
        manual_overrides = {}

@app.route('/')
def index():
    """Main dashboard page."""
    return render_template('index.html')

@app.route('/api/status')
def get_status():
    """Get current system status."""
    global latest_data
    
    # Collect fresh data
    current_readings = {}
    for name, collector in collectors.items():
        # Check for manual override first
        if name in manual_overrides:
            # Use manual data if it's less than 24 hours old
            override = manual_overrides[name]
            override_time = datetime.fromisoformat(override['timestamp'].replace('Z', '+00:00'))
            if (datetime.utcnow() - override_time.replace(tzinfo=None)).total_seconds() < 86400:
                current_readings[name] = override
                continue
        
        # Otherwise collect fresh data
        try:
            reading = collector.collect()
            # Check for staleness
            if reading:
                reading = stale_handler.check_staleness(reading)
            current_readings[name] = reading
            # Save to history
            if reading:
                save_to_history(name, reading.get('value'), reading.get('metadata', {}))
        except Exception as e:
            app.logger.error(f"Failed to collect {name}: {e}")
            current_readings[name] = None
    
    # Analyze threat levels
    threat_levels = threat_analyzer.analyze(current_readings)
    
    # Apply stale data forced levels
    for name, reading in current_readings.items():
        if reading and reading.get('metadata', {}).get('stale'):
            original_level = threat_levels.get(name, 'unknown')
            threat_levels[name] = stale_handler.apply_stale_level(
                original_level, reading.get('metadata', {})
            )
    
    # Check for TIGHTEN-UP condition
    red_count = sum(1 for level in threat_levels.values() if level == "red")
    tighten_up = red_count >= config.get_alert_config().get('tighten_up_threshold', 2)
    
    # Evaluate current phase
    current_phase, phase_info = phase_manager.evaluate_phase(current_readings, threat_levels)
    
    # Update cache
    latest_data = {
        'readings': current_readings,
        'threat_levels': threat_levels,
        'last_update': datetime.now().isoformat(),
        'tighten_up': tighten_up,
        'red_count': red_count
    }
    
    # Format for frontend
    indicators = []
    for name, reading in current_readings.items():
        if reading:
            value = reading.get('value', 'N/A')
            unit = reading.get('metadata', {}).get('unit', '')
            
            # Format value based on unit
            if unit == 'billions_usd':
                formatted_value = f"${value}B"
            elif unit == 'percent':
                formatted_value = f"{value}%"
            elif unit == 'basis_points':
                formatted_value = f"{value} bp"
            elif unit == 'incursions_per_week':
                formatted_value = f"{value}/week"
            elif unit == 'systems':
                formatted_value = f"{value} systems"
            else:
                formatted_value = str(value)
            
            indicators.append({
                'name': name,
                'value': formatted_value,
                'raw_value': value,
                'level': threat_levels.get(name, 'unknown'),
                'timestamp': reading.get('timestamp', ''),
                'unit': unit,
                'metadata': reading.get('metadata', {})
            })
        else:
            indicators.append({
                'name': name,
                'value': 'No Data',
                'raw_value': None,
                'level': 'unknown',
                'timestamp': '',
                'unit': ''
            })
    
    return jsonify({
        'status': 'ok',
        'timestamp': latest_data['last_update'],
        'tighten_up': tighten_up,
        'red_count': red_count,
        'indicators': indicators,
        'current_phase': current_phase,
        'phase_info': phase_info
    })

@app.route('/api/history')
def get_history():
    """Get historical data from log files."""
    # Load historical data
    history_file = Path(__file__).parent.parent / 'data' / 'history.json'
    if history_file.exists():
        with open(history_file, 'r') as f:
            history = json.load(f)
    else:
        history = []
    
    return jsonify({
        'status': 'ok',
        'history': history[-100:]  # Last 100 entries
    })

@app.route('/emergency')
def emergency():
    """Emergency procedures page."""
    return render_template('emergency.html')

@app.route('/procedures')
def procedures():
    """Emergency procedures page (alias)."""
    return render_template('emergency.html')

@app.route('/framework')
def framework():
    """H1-H6 Risk Analysis Framework page."""
    return render_template('framework.html')

@app.route('/executive')
def executive():
    """Executive summary dashboard."""
    return render_template('executive.html')

@app.route('/manual-input')
def manual_input():
    """Manual data input page."""
    return render_template('manual_input.html')

@app.route('/api/manual-update', methods=['POST'])
def manual_update():
    """Update manual data override."""
    global manual_overrides
    
    data = request.json
    indicator = data.get('indicator')
    value = data.get('value')
    metadata = data.get('metadata', {})
    
    # Store manual override
    manual_overrides[indicator] = {
        'value': value,
        'metadata': metadata,
        'timestamp': datetime.utcnow().isoformat(),
        'collector': indicator
    }
    
    # Save to file
    manual_data_file.parent.mkdir(exist_ok=True)
    with open(manual_data_file, 'wb') as f:
        pickle.dump(manual_overrides, f)
    
    # Also save to history
    save_to_history(indicator, value, metadata)
    
    return jsonify({'status': 'ok', 'message': f'{indicator} updated'})

@app.route('/api/scrape-fda')
def scrape_fda():
    """Scrape FDA drug shortage data."""
    try:
        # In production, would actually scrape FDA site
        # For now, return mock data
        import random
        
        # Simulate scraping delay
        import time
        time.sleep(1)
        
        data = {
            'success': True,
            'total_shortages': random.randint(8, 15),
            'mental_health': random.randint(2, 5),
            'adhd': random.randint(3, 5),
            'antibiotics': random.randint(1, 3)
        }
        
        return jsonify(data)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

def save_to_history(indicator, value, metadata):
    """Save data point to history."""
    history_file = Path(__file__).parent.parent / 'data' / 'history.json'
    
    # Load existing history
    if history_file.exists():
        with open(history_file, 'r') as f:
            history = json.load(f)
    else:
        history = []
    
    # Add new entry
    history.append({
        'timestamp': datetime.utcnow().isoformat(),
        'indicator': indicator,
        'value': value,
        'metadata': metadata
    })
    
    # Keep last 10000 entries
    history = history[-10000:]
    
    # Save
    history_file.parent.mkdir(exist_ok=True)
    with open(history_file, 'w') as f:
        json.dump(history, f)

@app.route('/api/config')
def get_config():
    """Get configuration info for display."""
    trip_wires = config.config.get('trip_wires', {})
    
    thresholds = {}
    for key, value in trip_wires.items():
        name = {
            'treasury_tail': 'Treasury',
            'ice_detention': 'ICEDetention',
            'taiwan_exclusion': 'TaiwanZone',
            'hormuz_risk': 'HormuzRisk',
            'dod_autonomy': 'DoDAutonomy',
            'mbridge_crude': 'MBridge'
        }.get(key, key)
        
        thresholds[name] = {
            'name': value.get('name', ''),
            'thresholds': value.get('thresholds', {}),
            'unit': value.get('unit', '')
        }
    
    return jsonify({
        'status': 'ok',
        'thresholds': thresholds,
        'tighten_up_threshold': config.get_alert_config().get('tighten_up_threshold', 2)
    })

if __name__ == '__main__':
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    print("🌐 Starting Household Resilience Dashboard...")
    print("📍 Access at: http://localhost:5555")
    print("Press Ctrl+C to stop")
    
    app.run(debug=True, host='0.0.0.0', port=5555)