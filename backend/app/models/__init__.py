from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
import uuid

class ImageData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    file_path: str
    thumbnail_path: Optional[str] = None
    session_id: str
    size_bytes: int
    width: int
    height: int
    format: str

class OperationParam(BaseModel):
    name: str
    value: Union[int, float, str, bool]

class PipelineStep(BaseModel):
    name: str
    params: Dict[str, Union[int, float, str, bool]] = Field(default_factory=dict)

class ProcessRequest(BaseModel):
    image_ids: List[str]
    pipeline: List[PipelineStep]
    session_id: str

class LiveProcessRequest(BaseModel):
    image_id: str
    pipeline: List[PipelineStep]
    session_id: str

class ProcessResponse(BaseModel):
    success: bool
    processed_images: List[str] = Field(default_factory=list)
    intermediate_results: Optional[List[List[str]]] = None
    message: str = "Processing completed successfully"

class LiveProcessResponse(BaseModel):
    success: bool
    results: List[str] = Field(default_factory=list)  # Base64 encoded images for each step
    message: str = "Live processing completed successfully"

class UploadResponse(BaseModel):
    success: bool
    image: Optional[ImageData] = None
    thumbnail: Optional[str] = None  # Base64 encoded thumbnail for UI
    message: str = "Upload successful"

class SessionCleanupRequest(BaseModel):
    session_id: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    message: str