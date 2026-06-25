from pydantic import BaseModel, Field


class TryOnRequest(BaseModel):
    person_image_url: str = Field(
        ...,
        description="Public URL of the person / model photo",
        alias="personImageUrl",
    )
    garment_image_url: str = Field(
        ...,
        description="Public URL of the garment product image",
        alias="garmentImageUrl",
    )

    model_config = {"populate_by_name": True}


class TryOnResponse(BaseModel):
    result_image_url: str = Field(
        ...,
        description="Absolute path or URL of the generated try-on image",
        alias="resultImageUrl",
    )

    model_config = {"populate_by_name": True}
