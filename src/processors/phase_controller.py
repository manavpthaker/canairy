"""
Phase Controller with hysteresis and critical jump rules.
Manages phase transitions based on HOPI scores and critical events.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import deque
import logging


class PhaseController:
    """Controls phase transitions with hysteresis and critical rules."""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Current phase
        self.current_phase = 0
        
        # Phase history for hysteresis
        self.phase_history = deque(maxlen=100)  # Keep last 100 transitions
        self.poll_history = deque(maxlen=10)   # Keep last 10 polls
        
        # Last phase change time for cooldown
        self.last_phase_change = datetime.utcnow()
        
        # Phase definitions
        self.phases = {
            0: {
                'name': 'Normal Operations',
                'headline': 'Normal routines; skills & fitness',
                'hopi_range': (0.0, 0.10),
                'condition': 'HOPI < 0.10 & no ambers'
            },
            1: {
                'name': '72-Hour Ready',
                'headline': '72-h bin verified; contact sheet',
                'hopi_range': (0.10, 0.20),
                'condition': 'HOPI 0.10-0.19 or 1 amber'
            },
            2: {
                'name': 'Digital & Comms',
                'headline': 'Digital hygiene & comms live',
                'hopi_range': (0.20, 0.30),
                'condition': 'HOPI 0.20-0.29 or ≥2 ambers'
            },
            2.5: {
                'name': 'Liquidity Buffer',
                'headline': 'Liquidity/docs buffer; passports on person',
                'hopi_range': (0.30, 0.35),
                'condition': 'HOPI 0.30-0.34'
            },
            3: {
                'name': 'Health Prep',
                'headline': 'HEPA/N95 ready; avoid hotspots',
                'hopi_range': (0.35, 0.45),
                'condition': 'HOPI 0.35-0.44 or any red'
            },
            4: {
                'name': 'Light Restrictions',
                'headline': 'Light curfew; top off cash/fuel',
                'hopi_range': (0.45, 0.55),
                'condition': 'HOPI 0.45-0.54 and ≥1 domain ≥0.60'
            },
            5: {
                'name': 'Generator Prep',
                'headline': 'Generator prep/day-tank; meds 60-90d',
                'hopi_range': (0.55, 0.65),
                'condition': 'HOPI 0.55-0.64 and ≥2 domains ≥0.60'
            },
            6: {
                'name': 'Shelter Active',
                'headline': 'Shelter nook active; roles matrix',
                'hopi_range': (0.65, 0.75),
                'condition': 'HOPI 0.65-0.74 and ≥2 domains ≥0.60'
            },
            7: {
                'name': 'Hardened Operations',
                'headline': 'Harden nook; genset/ATS live; WFH',
                'hopi_range': (0.75, 0.85),
                'condition': 'HOPI 0.75-0.84 and ≥3 domains ≥0.60 or critical+red'
            },
            8: {
                'name': 'Water & Movement',
                'headline': 'Water totes/filters; limited movement',
                'hopi_range': (0.85, 0.95),
                'condition': 'HOPI 0.85-0.94 and ≥4 domains ≥0.60'
            },
            9: {
                'name': 'Full Emergency',
                'headline': 'Full emergency posture',
                'hopi_range': (0.95, 1.0),
                'condition': 'HOPI ≥0.95 or DEFCON ≤2'
            }
        }
        
        # Critical jump rules
        self.critical_rules = [
            {
                'conditions': ['MarketVolatility:red', 'DeepfakeShocks:red'],
                'min_phase': 7,
                'window_hours': 3,
                'description': 'Market+Deepfake crisis'
            },
            {
                'conditions': ['NATOReadiness:red'],
                'min_phase': 6,
                'extra_condition': lambda ind: ind.get('RussiaNATO', {}).get('value', 0) >= 75,
                'extra_phase': 1,
                'description': 'NATO activation'
            },
            {
                'conditions': ['GuardMetros:red'],
                'min_phase': 5,
                'description': 'National Guard deployment'
            },
            {
                'conditions': ['DHSRemoval:red'],
                'min_phase': 5,
                'description': 'DHS powers expansion'
            }
        ]
    
    def update(self, hopi_result: Dict, indicators: Dict[str, Dict]) -> Dict:
        """
        Update phase based on HOPI results and indicators.
        
        Args:
            hopi_result: Output from HOPICalculator
            indicators: Current indicator states
            
        Returns:
            Dict with phase, actions, reasons
        """
        # Store current poll
        self.poll_history.append({
            'timestamp': datetime.utcnow(),
            'hopi': hopi_result['hopi'],
            'domain_scores': hopi_result['domain_scores'],
            'indicators': indicators.copy()
        })
        
        # Determine target phase
        target_phase = self._determine_target_phase(hopi_result, indicators)
        
        # Apply hysteresis
        new_phase = self._apply_hysteresis(target_phase, hopi_result)
        
        # Check critical jump rules
        critical_phase = self._check_critical_jumps(indicators)
        if critical_phase > new_phase:
            new_phase = critical_phase
            self.logger.warning(f"Critical jump to phase {critical_phase}")
        
        # Apply confidence gating
        if hopi_result['confidence'] < 0.60 and new_phase > 3:
            if hopi_result['critical_reds'] == 0:
                self.logger.info(f"Low confidence ({hopi_result['confidence']:.2f}), "
                               f"capping at phase 3")
                new_phase = min(new_phase, 3)
        
        # Update phase if changed
        phase_changed = False
        if new_phase != self.current_phase:
            self._record_phase_change(self.current_phase, new_phase)
            self.current_phase = new_phase
            phase_changed = True
        
        # Get phase info and actions
        phase_info = self.phases.get(self.current_phase, self.phases[0])
        
        return {
            'phase': self.current_phase,
            'phase_name': phase_info['name'],
            'headline': phase_info['headline'],
            'changed': phase_changed,
            'hopi': hopi_result['hopi'],
            'confidence': hopi_result['confidence'],
            'target_phase': target_phase,
            'hysteresis_active': target_phase != new_phase,
            'critical_active': critical_phase > 0,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    
    def _determine_target_phase(self, hopi_result: Dict, indicators: Dict[str, Dict]) -> float:
        """Determine target phase based on HOPI and conditions."""
        hopi = hopi_result['hopi']
        domain_scores = hopi_result['domain_scores']
        
        # Count high domains (≥0.60)
        high_domains = sum(1 for score in domain_scores.values() if score >= 0.60)
        
        # Count ambers and reds
        amber_count = sum(1 for ind in indicators.values() if ind.get('color') == 1)
        red_count = sum(1 for ind in indicators.values() if ind.get('color') == 2)
        
        # Determine phase based on conditions
        target = 0
        
        # Check each phase condition
        if hopi < 0.10 and amber_count == 0:
            target = 0
        elif hopi < 0.20 or amber_count >= 1:
            target = 1
        elif hopi < 0.30 or amber_count >= 2:
            target = 2
        elif hopi < 0.35:
            target = 2.5
        elif hopi < 0.45 or red_count >= 1:
            target = 3
        elif hopi < 0.55 and high_domains >= 1:
            target = 4
        elif hopi < 0.65 and high_domains >= 2:
            target = 5
        elif hopi < 0.75 and high_domains >= 2:
            target = 6
        elif hopi < 0.85 and high_domains >= 3:
            target = 7
        elif hopi < 0.95 and high_domains >= 4:
            target = 8
        else:
            target = 9
        
        return target
    
    def _apply_hysteresis(self, target_phase: float, hopi_result: Dict) -> float:
        """Apply hysteresis rules to prevent yo-yo effect."""
        current = self.current_phase
        
        # Moving up: need 2 consecutive polls at higher level
        if target_phase > current:
            # Check if we had same target in previous poll
            if len(self.poll_history) >= 2:
                prev_poll = self.poll_history[-2]
                prev_target = self._determine_target_phase(
                    {'hopi': prev_poll['hopi'], 'domain_scores': prev_poll['domain_scores']},
                    prev_poll['indicators']
                )
                
                if prev_target >= target_phase:
                    # Two consecutive polls at higher level
                    return target_phase
            
            # Not enough history or not consistent
            return current
        
        # Moving down: need 72h below lower band and no reds
        elif target_phase < current:
            time_since_change = datetime.utcnow() - self.last_phase_change
            
            if time_since_change < timedelta(hours=72):
                return current  # Too soon
            
            # Check for any reds
            if hopi_result['total_reds'] > 0:
                return current  # Can't decrease with active reds
            
            # Check if we've been consistently below target
            if len(self.poll_history) >= 3:
                recent_hopis = [p['hopi'] for p in list(self.poll_history)[-3:]]
                target_range = self.phases[target_phase]['hopi_range']
                
                if all(h <= target_range[1] for h in recent_hopis):
                    return target_phase
            
            return current
        
        # No change
        return current
    
    def _check_critical_jumps(self, indicators: Dict[str, Dict]) -> float:
        """Check critical jump rules and return minimum required phase."""
        max_critical_phase = 0
        
        for rule in self.critical_rules:
            # Check if all conditions are met
            conditions_met = True
            
            for condition in rule['conditions']:
                indicator, state = condition.split(':')
                
                if indicator not in indicators:
                    conditions_met = False
                    break
                
                ind_data = indicators[indicator]
                if state == 'red' and ind_data.get('color') != 2:
                    conditions_met = False
                    break
            
            if conditions_met:
                # Check window if specified
                if 'window_hours' in rule:
                    # For simplicity, assume conditions are current
                    # In production, would check timing
                    pass
                
                # Apply minimum phase
                min_phase = rule['min_phase']
                
                # Check extra conditions
                if 'extra_condition' in rule and rule['extra_condition'](indicators):
                    min_phase += rule.get('extra_phase', 0)
                
                max_critical_phase = max(max_critical_phase, min_phase)
                self.logger.warning(f"Critical rule triggered: {rule['description']} "
                                  f"-> min phase {min_phase}")
        
        return max_critical_phase
    
    def _record_phase_change(self, old_phase: float, new_phase: float):
        """Record phase transition."""
        self.phase_history.append({
            'timestamp': datetime.utcnow(),
            'from_phase': old_phase,
            'to_phase': new_phase,
            'direction': 'up' if new_phase > old_phase else 'down'
        })
        
        self.last_phase_change = datetime.utcnow()
        
        self.logger.info(f"Phase change: {old_phase} -> {new_phase}")
    
    def get_phase_history(self, hours: int = 24) -> List[Dict]:
        """Get recent phase transitions."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        return [
            transition for transition in self.phase_history
            if transition['timestamp'] >= cutoff
        ]