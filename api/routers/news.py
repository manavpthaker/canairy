"""
News router
"""

from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

@router.get("/")
async def get_news() -> List[Dict[str, Any]]:
    """Get news articles"""
    return []

@router.get("/intelligence")
async def get_news_intelligence() -> Dict[str, Any]:
    """Get news intelligence analysis"""
    return {
        "summary": "No current threats detected",
        "threat_level": "green",
        "articles": []
    }