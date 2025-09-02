"""
Simplified FastAPI Backend for Canairy - Deployment Test Version
This version uses minimal dependencies and static data to ensure deployment works
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import json
from datetime import datetime

# Create FastAPI app
app = FastAPI(
    title="Canairy",
    version="2.1.0",
    description="Early Warning System for Global Disruptions",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3003",
        "http://localhost:3004", 
        "http://localhost:5173",
        "https://canairy.onrender.com",
        "https://brown-man-bunker.onrender.com",
        "https://bunker-frontend.onrender.com",
        "https://canairy.xyz",
        "https://www.canairy.xyz",
        "https://canairy-dashboard.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for 26 indicators
def get_mock_indicators():
    return {
        "indicators": [
            {
                "id": "Treasury",
                "name": "Treasury Volatility",
                "domain": "economy",
                "description": "10-year Treasury yield volatility",
                "unit": "basis_points",
                "status": {
                    "level": "green",
                    "value": 2.5,
                    "trend": "stable",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "FRED_API"
                },
                "thresholds": {
                    "threshold_amber": 3.0,
                    "threshold_red": 7.0
                },
                "critical": True,
                "dataSource": "FRED_API",
                "updateFrequency": "60m"
            },
            {
                "id": "ICEDetention",
                "name": "ICE Detention Capacity",
                "domain": "domestic_control",
                "description": "ICE detention facility capacity utilization",
                "unit": "percent",
                "status": {
                    "level": "amber",
                    "value": 85.2,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "ICE_REPORTS"
                },
                "thresholds": {
                    "threshold_amber": 80,
                    "threshold_red": 90
                },
                "critical": True,
                "dataSource": "ICE_REPORTS",
                "updateFrequency": "60m"
            },
            {
                "id": "TaiwanZone",
                "name": "Taiwan Exclusion Zone",
                "domain": "global_conflict", 
                "description": "PLA exclusion zone incursions",
                "unit": "incursions_per_week",
                "status": {
                    "level": "red",
                    "value": 25,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "NEWS_MONITORING"
                },
                "thresholds": {
                    "threshold_amber": 10,
                    "threshold_red": 20
                },
                "critical": True,
                "dataSource": "NEWS_MONITORING", 
                "updateFrequency": "60m"
            },
            {
                "id": "HormuzRisk",
                "name": "Strait of Hormuz Risk",
                "domain": "global_conflict",
                "description": "War risk insurance premium for Hormuz transit",
                "unit": "percent",
                "status": {
                    "level": "amber",
                    "value": 2.1,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "INSURANCE_DATA"
                },
                "thresholds": {
                    "threshold_amber": 1.5,
                    "threshold_red": 3.0
                },
                "critical": True,
                "dataSource": "INSURANCE_DATA",
                "updateFrequency": "60m"
            },
            {
                "id": "DoDAutonomy",
                "name": "DoD AI Autonomy",
                "domain": "domestic_control",
                "description": "Autonomous weapon systems deployment",
                "unit": "systems",
                "status": {
                    "level": "amber",
                    "value": 750,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "DOD_SOLICITATIONS"
                },
                "thresholds": {
                    "threshold_amber": 500,
                    "threshold_red": 1000
                },
                "critical": True,
                "dataSource": "DOD_SOLICITATIONS",
                "updateFrequency": "60m"
            },
            {
                "id": "JoblessClaims",
                "name": "Jobless Claims",
                "domain": "jobs_labor",
                "description": "Weekly unemployment claims",
                "unit": "thousands",
                "status": {
                    "level": "green",
                    "value": 230,
                    "trend": "stable",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "FRED_API"
                },
                "thresholds": {
                    "threshold_amber": 275,
                    "threshold_red": 350
                },
                "critical": False,
                "dataSource": "FRED_API",
                "updateFrequency": "60m"
            },
            {
                "id": "LuxuryCollapse", 
                "name": "Luxury Goods Collapse",
                "domain": "economy",
                "description": "High-end consumer spending index",
                "unit": "index",
                "status": {
                    "level": "amber",
                    "value": 32,
                    "trend": "down",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "ALPHA_VANTAGE"
                },
                "thresholds": {
                    "threshold_amber": 25,
                    "threshold_red": 40
                },
                "critical": False,
                "dataSource": "ALPHA_VANTAGE",
                "updateFrequency": "60m"
            },
            {
                "id": "PharmacyShortage",
                "name": "Pharmacy Drug Shortages",
                "domain": "security_infrastructure",
                "description": "Critical medication shortages",
                "unit": "drugs",
                "status": {
                    "level": "amber",
                    "value": 12,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "FDA_DATABASE"
                },
                "thresholds": {
                    "threshold_amber": 8,
                    "threshold_red": 15
                },
                "critical": False,
                "dataSource": "FDA_DATABASE",
                "updateFrequency": "60m"
            },
            {
                "id": "SchoolClosures",
                "name": "School Closures",
                "domain": "security_infrastructure", 
                "description": "Non-weather school district closures",
                "unit": "district_days",
                "status": {
                    "level": "green",
                    "value": 2,
                    "trend": "stable",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "NEWS_MONITORING"
                },
                "thresholds": {
                    "threshold_amber": 3,
                    "threshold_red": 10
                },
                "critical": False,
                "dataSource": "NEWS_MONITORING",
                "updateFrequency": "60m"
            },
            {
                "id": "AGIMilestones",
                "name": "AGI Capability Milestones", 
                "domain": "ai_window",
                "description": "Artificial general intelligence progress",
                "unit": "milestone_score",
                "status": {
                    "level": "amber",
                    "value": 45,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "AI_BENCHMARKS"
                },
                "thresholds": {
                    "threshold_amber": 40,
                    "threshold_red": 70
                },
                "critical": True,
                "dataSource": "AI_BENCHMARKS",
                "updateFrequency": "60m"
            },
            {
                "id": "LaborDisplacement",
                "name": "AI Labor Displacement",
                "domain": "jobs_labor",
                "description": "AI-driven job displacement index",
                "unit": "displacement_index", 
                "status": {
                    "level": "amber",
                    "value": 25,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "FRED_API"
                },
                "thresholds": {
                    "threshold_amber": 20,
                    "threshold_red": 35
                },
                "critical": False,
                "dataSource": "FRED_API",
                "updateFrequency": "60m"
            },
            {
                "id": "GroceryCPI",
                "name": "Grocery Inflation",
                "domain": "economy",
                "description": "Food at home consumer price index",
                "unit": "percent",
                "status": {
                    "level": "green",
                    "value": 2.1,
                    "trend": "stable",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "BLS_API"
                },
                "thresholds": {
                    "threshold_amber": 4.0,
                    "threshold_red": 8.0
                },
                "critical": False,
                "dataSource": "BLS_API",
                "updateFrequency": "60m"
            },
            {
                "id": "CISACyber",
                "name": "CISA Cyber Threats",
                "domain": "security_infrastructure",
                "description": "Critical infrastructure vulnerabilities",
                "unit": "vulnerabilities",
                "status": {
                    "level": "red",
                    "value": 52,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "CISA_KEV"
                },
                "thresholds": {
                    "threshold_amber": 30,
                    "threshold_red": 45
                },
                "critical": True,
                "dataSource": "CISA_KEV",
                "updateFrequency": "60m"
            },
            {
                "id": "GridOutages",
                "name": "Power Grid Outages", 
                "domain": "security_infrastructure",
                "description": "Major electrical grid disruptions",
                "unit": "outages",
                "status": {
                    "level": "green",
                    "value": 1,
                    "trend": "stable",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "DOE_OE417"
                },
                "thresholds": {
                    "threshold_amber": 2,
                    "threshold_red": 5
                },
                "critical": False,
                "dataSource": "DOE_OE417", 
                "updateFrequency": "60m"
            },
            {
                "id": "GDPGrowth",
                "name": "GDP Growth Trajectory",
                "domain": "economy",
                "description": "Quarterly GDP growth rate",
                "unit": "percent",
                "status": {
                    "level": "green",
                    "value": 2.8,
                    "trend": "stable",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "FRED_API"
                },
                "thresholds": {
                    "threshold_amber": 1.0,
                    "threshold_red": 0.0
                },
                "critical": False,
                "dataSource": "FRED_API",
                "updateFrequency": "60m"
            },
            {
                "id": "StrikeTracker",
                "name": "Labor Strike Activity",
                "domain": "jobs_labor", 
                "description": "Strike days and worker involvement",
                "unit": "strike_days",
                "status": {
                    "level": "amber",
                    "value": 450000,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "CORNELL_ILR"
                },
                "thresholds": {
                    "threshold_amber": 300000,
                    "threshold_red": 750000
                },
                "critical": False,
                "dataSource": "CORNELL_ILR",
                "updateFrequency": "60m"
            },
            {
                "id": "LegiScan", 
                "name": "AI Surveillance Legislation",
                "domain": "rights_governance",
                "description": "AI surveillance bills in state/federal legislature",
                "unit": "bills",
                "status": {
                    "level": "amber",
                    "value": 15,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "LEGISCAN_API"
                },
                "thresholds": {
                    "threshold_amber": 10,
                    "threshold_red": 25
                },
                "critical": False,
                "dataSource": "LEGISCAN_API",
                "updateFrequency": "60m"
            },
            {
                "id": "ACLEDProtests",
                "name": "Global Protest Activity",
                "domain": "global_conflict",
                "description": "Political violence and protest events",
                "unit": "protests_per_day",
                "status": {
                    "level": "amber",
                    "value": 18.5,
                    "trend": "up", 
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "ACLED_API"
                },
                "thresholds": {
                    "threshold_amber": 15,
                    "threshold_red": 25
                },
                "critical": False,
                "dataSource": "ACLED_API",
                "updateFrequency": "60m"
            },
            {
                "id": "MarketVolatility",
                "name": "Market Volatility Index",
                "domain": "economy",
                "description": "Treasury and equity market volatility",
                "unit": "basis_points",
                "status": {
                    "level": "green",
                    "value": 3.2,
                    "trend": "stable",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "YAHOO_FINANCE"
                },
                "thresholds": {
                    "threshold_amber": 5.0,
                    "threshold_red": 10.0
                },
                "critical": False,
                "dataSource": "YAHOO_FINANCE",
                "updateFrequency": "60m"
            },
            {
                "id": "CREAOil",
                "name": "Russian Oil to BRICS",
                "domain": "oil_axis", 
                "description": "Russian crude exports to BRICS nations",
                "unit": "percent",
                "status": {
                    "level": "amber",
                    "value": 65.3,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "CREA_TRACKER"
                },
                "thresholds": {
                    "threshold_amber": 60,
                    "threshold_red": 75
                },
                "critical": False,
                "dataSource": "CREA_TRACKER",
                "updateFrequency": "60m"
            },
            {
                "id": "OFACDesignations",
                "name": "OFAC Oil Sanctions",
                "domain": "oil_axis",
                "description": "New oil-related sanctions designations",
                "unit": "designations",
                "status": {
                    "level": "green",
                    "value": 0,
                    "trend": "stable",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "OFAC_SDN"
                },
                "thresholds": {
                    "threshold_amber": 1,
                    "threshold_red": 3
                },
                "critical": False,
                "dataSource": "OFAC_SDN",
                "updateFrequency": "60m"
            },
            {
                "id": "AILayoffs",
                "name": "AI-Related Layoffs",
                "domain": "ai_window",
                "description": "Technology sector layoffs citing AI/automation",
                "unit": "workers",
                "status": {
                    "level": "red",
                    "value": 12500,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "LAYOFFS_TRACKER"
                },
                "thresholds": {
                    "threshold_amber": 5000,
                    "threshold_red": 10000
                },
                "critical": False,
                "dataSource": "LAYOFFS_TRACKER",
                "updateFrequency": "60m"
            },
            {
                "id": "MBridgeSettlements",
                "name": "mBridge Energy Settlements", 
                "domain": "oil_axis",
                "description": "Daily energy trade settlements on mBridge CBDC",
                "unit": "million_usd_per_day",
                "status": {
                    "level": "amber",
                    "value": 125.4,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "BIS_MBRIDGE"
                },
                "thresholds": {
                    "threshold_amber": 100,
                    "threshold_red": 300
                },
                "critical": False,
                "dataSource": "BIS_MBRIDGE",
                "updateFrequency": "60m"
            },
            {
                "id": "JODIOil",
                "name": "BRICS vs OECD Oil Refining",
                "domain": "oil_axis",
                "description": "BRICS to OECD refinery capacity ratio",
                "unit": "ratio",
                "status": {
                    "level": "amber", 
                    "value": 1.15,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "JODI_API"
                },
                "thresholds": {
                    "threshold_amber": 1.1,
                    "threshold_red": 1.5
                },
                "critical": False,
                "dataSource": "JODI_API",
                "updateFrequency": "60m"
            },
            {
                "id": "AIRansomware",
                "name": "AI-Assisted Ransomware",
                "domain": "ai_window",
                "description": "Ransomware incidents with AI components",
                "unit": "incidents",
                "status": {
                    "level": "amber",
                    "value": 3,
                    "trend": "up",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "CISA_ICS"
                },
                "thresholds": {
                    "threshold_amber": 2,
                    "threshold_red": 6
                },
                "critical": True,
                "dataSource": "CISA_ICS",
                "updateFrequency": "60m"
            },
            {
                "id": "DeepfakeShocks",
                "name": "Market-Moving Deepfakes",
                "domain": "ai_window", 
                "description": "Deepfake incidents causing market disruption",
                "unit": "events",
                "status": {
                    "level": "green",
                    "value": 0,
                    "trend": "stable",
                    "lastUpdate": datetime.utcnow().isoformat(),
                    "dataSource": "COMPOSITE"
                },
                "thresholds": {
                    "threshold_amber": 1,
                    "threshold_red": 2
                },
                "critical": True,
                "dataSource": "COMPOSITE",
                "updateFrequency": "60m"
            }
        ],
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Canairy",
        "version": "2.1.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/api/v1/indicators/")
async def get_indicators():
    """Get all indicators with current data"""
    return get_mock_indicators()

@app.get("/api/v1/hopi")
async def get_hopi_score():
    return {
        "score": 75.5,
        "confidence": 0.85,
        "phase": 3,
        "targetPhase": 4,
        "domains": {
            "economy": {"score": 80, "weight": 0.3, "indicators": ["Treasury"], "criticalAlerts": []},
            "global_conflict": {"score": 70, "weight": 0.2, "indicators": ["TaiwanZone"], "criticalAlerts": ["TaiwanZone"]},
            "energy": {"score": 60, "weight": 0.2, "indicators": ["CREAOil"], "criticalAlerts": []},
            "ai_tech": {"score": 90, "weight": 0.15, "indicators": ["AILayoffs"], "criticalAlerts": []},
            "domestic_control": {"score": 50, "weight": 0.15, "indicators": ["ICEDetention"], "criticalAlerts": []}
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/status")
async def get_system_status():
    return {
        "operational": True,
        "lastUpdate": datetime.utcnow().isoformat(),
        "activeAlerts": 5,
        "dataQuality": 0.95,
        "message": "All systems nominal, 5 active alerts."
    }

@app.get("/api/v1/phase") 
async def get_current_phase():
    return {
        "number": 3,
        "name": "Air, health, mobile",
        "description": "Focus on immediate personal and family safety measures.",
        "triggers": ["1 red anywhere or 2 ambers sustained 7 days"],
        "actions": ["HEPA on", "N95 cache verified", "C1000 moved to shelter as UPS"],
        "color": "#FFC107"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("simple_main:app", host="0.0.0.0", port=8000, reload=True)