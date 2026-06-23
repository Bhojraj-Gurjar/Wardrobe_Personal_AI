from pydantic import BaseModel, Field


class DigitalAvatarGenerateRequest(BaseModel):
    avatar_type: str = Field(default="BASIC", alias="avatarType")
    face_traits: dict | None = Field(default=None, alias="faceTraits")
    body_traits: dict | None = Field(default=None, alias="bodyTraits")
    profile: dict | None = None

    model_config = {"populate_by_name": True}


class DigitalAvatarGenerateResponse(BaseModel):
    avatar_type: str = Field(alias="avatarType")
    avatar_image: str = Field(alias="avatarImage")
    metadata: dict | None = None

    model_config = {"populate_by_name": True}

    def model_dump_public(self) -> dict:
        return self.model_dump(by_alias=True, exclude_none=False)
