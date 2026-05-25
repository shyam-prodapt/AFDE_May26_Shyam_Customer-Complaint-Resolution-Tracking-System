from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine

# Import models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401
import app.models.analytics  # noqa: F401

from app.routers import auth, users, complaints, categories, feedback, notifications, dashboard
from app.routers import analytics

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Complaint & Resolution Tracking System",
    version="1.0.0",
    description="REST API for managing customer complaints end-to-end",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(complaints.router)
app.include_router(categories.router)
app.include_router(feedback.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Complaint Tracking API is running"}
