"""
Indicators router
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import json
import os

router = APIRouter()

@router.get("/")
async def get_indicators() -> List[Dict[str, Any]]:
    """Get all indicators"""
    # For now, return mock data or read from files
    # In production, this would query the database
    mock_data_path = "src/mock/indicators.json"
    if os.path.exists(mock_data_path):
        with open(mock_data_path, 'r') as f:
            return json.load(f)
    return []

@router.get("/{indicator_id}")
async def get_indicator(indicator_id: str) -> Dict[str, Any]:
    """Get specific indicator"""
    indicators = await get_indicators()
    for indicator in indicators:
        if indicator.get("id") == indicator_id:
            return indicator
    raise HTTPException(status_code=404, detail="Indicator not found")