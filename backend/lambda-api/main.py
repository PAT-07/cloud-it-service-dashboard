# backend/lambda-api/main.py
# FastAPI application entry point + Mangum Lambda wrapper
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from config import get_settings
from routes import auth, tickets, analytics, users

settings = get_settings()

app = FastAPI(
    title="Cloud IT Service Dashboard API",
    version="1.0.0",
    description="IT support ticket management system.",
    docs_url="/docs" if settings.app_env != "production" else None,
)

# CORS — allow the React front-end origins defined in env
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://cloud-it-service-dashboard.vercel.app",
        "https://cloud-it-service-dashboard-cmpb2bzse-pat-07s-projects.vercel.app",
        "https://cloud-it-service-dashboard-5r768sjj0-pat-07s-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route modules
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(analytics.router)
app.include_router(users.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "env": settings.app_env}


# Mangum translates API Gateway events into ASGI calls
# This is the entry point set in the Lambda configuration:
#   Handler = main.handler
handler = Mangum(app, lifespan="off")
