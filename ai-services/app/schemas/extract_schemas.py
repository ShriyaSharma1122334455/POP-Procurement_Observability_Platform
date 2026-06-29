from pydantic import BaseModel
from typing import Optional, Literal


class ExtractSupplierDocRequest(BaseModel):
    file_base64: str
    mime_type: str  # e.g. "image/jpeg", "image/png"


class ExtractSupplierTextRequest(BaseModel):
    text: str  # full extracted text from all PDF pages


class ExtractSupplierDocResponse(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    contractExpiry: Optional[str] = None
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = "LOW"
