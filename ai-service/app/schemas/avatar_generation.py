from pydantic import BaseModel, Field

from app.constants.avatar_types import AvatarRenderMode


class FaceAnalysisInput(BaseModel):
    face_shape: str | None = Field(default=None, alias="faceShape")
    skin_tone: str | None = Field(default=None, alias="skinTone")

    model_config = {"populate_by_name": True}


class HairAnalysisInput(BaseModel):
    hair_length: str | None = Field(default=None, alias="hairLength")
    hair_color: str | None = Field(default=None, alias="hairColor")
    hair_style: str | None = Field(default=None, alias="hairStyle")

    model_config = {"populate_by_name": True}


class BeardAnalysisInput(BaseModel):
    beard_type: str | None = Field(default=None, alias="beardType")

    model_config = {"populate_by_name": True}


class AvatarGenerateRequest(BaseModel):
    avatar_type: str = Field(
        default=AvatarRenderMode.BASIC_2D.value,
        alias="avatarType",
    )
    face_analysis: FaceAnalysisInput | dict | None = Field(default=None, alias="faceAnalysis")
    body_analysis: dict | None = Field(default=None, alias="bodyAnalysis")
    skin_tone: str | None = Field(default=None, alias="skinTone")
    hair_analysis: HairAnalysisInput | dict | None = Field(default=None, alias="hairAnalysis")
    beard_analysis: BeardAnalysisInput | dict | None = Field(default=None, alias="beardAnalysis")
    profile: dict | None = None

    model_config = {"populate_by_name": True}


class AvatarGenerateResponse(BaseModel):
    avatar_type: str = Field(alias="avatarType")
    avatar_image_url: str = Field(alias="avatarImageUrl")
    confidence: float
    metadata: dict | None = None

    model_config = {"populate_by_name": True}

    def model_dump_public(self) -> dict:
        return self.model_dump(by_alias=True, exclude_none=False)
