from pydantic import BaseModel, Field





class FaceEmbedRequest(BaseModel):

    image: str = Field(..., description="Base64 or data-URL image")





class FaceEmbedResponse(BaseModel):

    embedding: list[float]

    dimensions: int

    source: str = "face_recognition"

    quality_score: float = 0.0





class FaceVerifyRequest(BaseModel):

    image: str

    stored_embedding: list[float]





class FaceVerifyResponse(BaseModel):

    match_score: float

    verified: bool

    threshold: float

    status: str





class FaceLivenessResponse(BaseModel):

    blink_detected: bool

    smile_detected: bool

    liveness_score: float


