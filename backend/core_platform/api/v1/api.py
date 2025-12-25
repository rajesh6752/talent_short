"""API v1 router aggregation."""
from fastapi import APIRouter
from api import auth

api_router = APIRouter()

# Core Platform - Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Add other service routers as they are created:
# from core_platform.api import tenants, users, llm_configs
# api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
# api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Hiring Pipeline routers (to be added):
# from hiring_pipeline.api import jobs, resumes, candidates
# api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])

# AI Engine routers (to be added):
# from ai_engine.api import matching, screening
# api_router.include_router(matching.router, prefix="/matching", tags=["Matching"])
