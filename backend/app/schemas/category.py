from typing import Optional

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    category_name: str
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    description: Optional[str] = None


class CategoryOut(BaseModel):
    category_id: int
    category_name: str
    description: Optional[str]

    model_config = {"from_attributes": True}
