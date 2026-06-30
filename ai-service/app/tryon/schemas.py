from typing import Literal

from pydantic import BaseModel, Field, model_validator


GarmentRegion = Literal["upper", "lower", "dress"]


class GarmentLayer(BaseModel):
    garment_image_url: str = Field(
        ...,
        description="Public URL of a garment product image",
        alias="garmentImageUrl",
    )
    garment_region: GarmentRegion = Field(
        default="upper",
        description="CatVTON region: upper, lower, or dress",
        alias="garmentRegion",
    )

    model_config = {"populate_by_name": True}


class TryOnRequest(BaseModel):
    person_image_url: str = Field(
        ...,
        description="Public URL of the person / model photo",
        alias="personImageUrl",
    )
    garment_image_url: str | None = Field(
        default=None,
        description="Public URL of the garment product image (single-garment mode)",
        alias="garmentImageUrl",
    )
    garment_region: GarmentRegion = Field(
        default="upper",
        description="CatVTON garment region for single-garment mode",
        alias="garmentRegion",
    )
    garments: list[GarmentLayer] | None = Field(
        default=None,
        description="Ordered garment layers for full-outfit sequential try-on",
    )

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def validate_garment_inputs(self) -> "TryOnRequest":
        if self.garments:
            if not self.garments:
                raise ValueError("At least one garment layer is required.")
            return self

        if not self.garment_image_url:
            raise ValueError("garmentImageUrl is required when garments is not provided.")

        return self


class TryOnResponse(BaseModel):
    result_image_url: str = Field(
        ...,
        description="Absolute path or URL of the generated try-on image",
        alias="resultImageUrl",
    )
    try_on_mode: str | None = Field(
        default=None,
        description="upper, lower, or full",
        alias="tryOnMode",
    )
    garments_applied: int | None = Field(
        default=None,
        description="Number of garment layers applied",
        alias="garmentsApplied",
    )

    model_config = {"populate_by_name": True}
