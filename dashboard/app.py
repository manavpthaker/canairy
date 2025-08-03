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
    GDPGrowthCollector
)
from processors.threat_analyzer import ThreatAnalyzer
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
    'GDPGrowth': GDPGrowthCollector
}

# Only initialize enabled collectors
collectors = {}
trip_wire_config = config.config.get('trip_wires', {})

# Map config names to collector names
config_to_collector = {
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
    'gdp_growth': 'GDPGrowth'
}

for config_name, collector_name in config_to_collector.items():
    if config_name in trip_wire_config and trip_wire_config[config_name].get('enabled', True):
        if collector_name in all_collectors:
            collectors[collector_name] = all_collectors[collector_name](config)
threat_analyzer = ThreatAnalyzer(config)

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
            current_readings[name] = reading
            # Save to history
            if reading:
                save_to_history(name, reading.get('value'), reading.get('metadata', {}))
        except Exception as e:
            app.logger.error(f"Failed to collect {name}: {e}")
            current_readings[name] = None
    
    # Analyze threat levels
    threat_levels = threat_analyzer.analyze(current_readings)
    
    # Check for TIGHTEN-UP condition
    red_count = sum(1 for level in threat_levels.values() if level == "red")
    tighten_up = red_count >= config.get_alert_config().get('tighten_up_threshold', 5)
    
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
        'indicators': indicators
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