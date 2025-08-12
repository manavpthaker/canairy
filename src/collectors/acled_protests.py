"""
ACLED (Armed Conflict Location & Event Data) collector for US protests.
Tracks 7-day average of protest events as civil unrest indicator.
"""

import requests
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from .base import BaseCollector


class ACLEDProtestsCollector(BaseCollector):
    """Collects US protest data from ACLED API."""
    
    def __init__(self, config):
        super().__init__(config)
        self._name = "ACLEDProtests"
        self.api_key = os.getenv('ACLED_API_KEY', '')
        self.email = os.getenv('ACLED_EMAIL', '')
        self.base_url = "https://api.acleddata.com/acled/read"
        
    def collect(self) -> Optional[Dict[str, Any]]:
        """
        Collect US protest data from ACLED.
        
        Returns:
            Dict with 7-day average protest count or None if collection fails
        """
        try:
            if not self.api_key or not self.email:
                self.logger.warning("No ACLED credentials found, using mock data")
                return self._get_mock_data()
            
            avg_protests = self._fetch_protest_data()
            
            if avg_protests is None:
                return None
            
            return {
                'value': round(avg_protests, 1),
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'collector': self.name,
                'metadata': {
                    'unit': 'protests_per_day',
                    'period': '7_day_avg',
                    'source': 'ACLED_API',
                    'description': f'{avg_protests:.1f} protests/day (7-day avg)',
                    'country': 'United States'
                }
            }
            
        except Exception as e:
            self.logger.error(f"Failed to collect ACLED data: {e}")
            return None
    
    def _fetch_protest_data(self) -> Optional[float]:
        """Fetch protest data from ACLED API."""
        try:
            # Get data for last 7 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            
            params = {
                'key': self.api_key,
                'email': self.email,
                'event_type': 'Protests',
                'country': 'United States',
                'event_date': f"{start_date.strftime('%Y-%m-%d')}|{end_date.strftime('%Y-%m-%d')}",
                'fields': 'event_date|event_type|sub_event_type|actor1|location|notes'
            }
            
            response = requests.get(
                self.base_url,
                params=params,
                timeout=30,
                headers={'User-Agent': 'Brown-Man-Bunker-Monitor/1.0'}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and 'data' in data:
                    protest_count = len(data['data'])
                    avg_per_day = protest_count / 7.0
                    
                    self.logger.info(f"Found {protest_count} protests in 7 days, "
                                   f"avg {avg_per_day:.1f}/day")
                    
                    return avg_per_day
                else:
                    self.logger.error(f"API error: {data.get('error')}")
                    return None
            else:
                self.logger.error(f"API returned status {response.status_code}")
                return None
                
        except Exception as e:
            self.logger.error(f"Failed to fetch ACLED data: {e}")
            return None
    
    def _get_mock_data(self) -> Dict[str, Any]:
        """Return mock data when API credentials are not available."""
        import random
        
        # Simulate realistic protest counts (15-45 per day avg)
        avg_protests = round(random.uniform(15, 45), 1)
        
        return {
            'value': avg_protests,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'collector': self.name,
            'metadata': {
                'unit': 'protests_per_day',
                'period': '7_day_avg',
                'source': 'mock_data',
                'description': f'{avg_protests} protests/day (7-day avg) (mock)',
                'note': 'Using mock data - set ACLED_API_KEY and ACLED_EMAIL for real data'
            }
        }