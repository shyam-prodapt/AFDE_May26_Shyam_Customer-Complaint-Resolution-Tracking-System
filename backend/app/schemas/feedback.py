from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class FeedbackCreate(BaseModel):
    rating: int
    comments: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not (1 <= v <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return v


class FeedbackOut(BaseModel):
    feedback_id: int
    complaint_id: str
    rating: int
    comments: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
