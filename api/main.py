"""
FastAPI Backend for Canairy Early Warning System
Enhanced version with proper architecture
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import redis.asyncio as redis
import logging
from typing import Optional

from api.core.config import settings
from api.core.logging import setup_logging
from api.routers import indicators, alerts, news, analytics, health
from api.middleware.rate_limit import RateLimitMiddleware
from api.middleware.cache import CacheMiddleware
from api.core.cache import cache_manager

# Setup logging
logger = setup_logging(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle
    """
    # Startup
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    
    # Initialize cache
    await cache_manager.initialize()
    
    # Initialize other services
    logger.info("All services initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    await cache_manager.close()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Early Warning System for Global Disruptions",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(RateLimitMiddleware, calls=100, period=60)
app.add_middleware(CacheMiddleware)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(indicators.router, prefix="/api/v1/indicators", tags=["indicators"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(news.router, prefix="/api/v1/news", tags=["news"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred",
            "request_id": request.state.request_id if hasattr(request.state, 'request_id') else None
        }
    )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/api/docs" if settings.DEBUG else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )