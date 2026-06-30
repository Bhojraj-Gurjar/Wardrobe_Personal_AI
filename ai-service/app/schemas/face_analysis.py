from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

FaceShape = Literal["Oval", "Round", "Square", "Diamond", "Heart"]
SkinTone = Literal["Fair", "Light", "Medium", "Wheatish", "Deep"]
HairLength = Literal["Bald", "Short", "Medium", "Long"]
HairColor = Literal["Black", "Brown", "Blonde", "Grey", "Red"]
HairStyle = Literal[
    "Side Part",
    "Curly",
    "Straight",
    "Buzz Cut",
    "Wavy",
    "Undercut",
    "Crew Cut",
]
BeardType = Literal["Clean Shave", "Light Beard", "Full Beard"]


class FaceTraitAnalysisResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    face_shape: FaceShape = Field(alias="faceShape")
    face_shape_confidence: float = Field(alias="faceShapeConfidence", ge=0, le=100)
    face_shape_metrics: dict[str, float] = Field(default_factory=dict, alias="faceShapeMetrics")
    skin_tone: SkinTone = Field(alias="skinTone")
    skin_tone_confidence: float = Field(alias="skinToneConfidence", ge=0, le=100)
    skin_tone_metrics: dict[str, float | int] = Field(
        default_factory=dict,
        alias="skinToneMetrics",
    )
    hair_length: HairLength = Field(alias="hairLength")
    hair_length_confidence: float = Field(alias="hairLengthConfidence", ge=0, le=100)
    hair_color: HairColor = Field(alias="hairColor")
    hair_color_confidence: float = Field(alias="hairColorConfidence", ge=0, le=100)
    hair_style: HairStyle = Field(alias="hairStyle")
    hair_style_confidence: float = Field(alias="hairStyleConfidence", ge=0, le=100)
    hair_metrics: dict[str, float | int] = Field(default_factory=dict, alias="hairMetrics")
    beard_type: BeardType = Field(alias="beardType")
    beard_type_confidence: float = Field(alias="beardTypeConfidence", ge=0, le=100)
    beard_metrics: dict[str, float | int] = Field(default_factory=dict, alias="beardMetrics")

    def model_dump_public(self) -> dict[str, Any]:
        return {
            "faceShape": self.face_shape,
            "faceShapeConfidence": round(self.face_shape_confidence, 2),
            "faceShapeMetrics": self.face_shape_metrics,
            "skinTone": self.skin_tone,
            "skinToneConfidence": round(self.skin_tone_confidence, 2),
            "skinToneMetrics": self.skin_tone_metrics,
            "hairLength": self.hair_length,
            "hairLengthConfidence": round(self.hair_length_confidence, 2),
            "hairColor": self.hair_color,
            "hairColorConfidence": round(self.hair_color_confidence, 2),
            "hairStyle": self.hair_style,
            "hairStyleConfidence": round(self.hair_style_confidence, 2),
            "hairMetrics": self.hair_metrics,
            "beardType": self.beard_type,
            "beardTypeConfidence": round(self.beard_type_confidence, 2),
            "beardMetrics": self.beard_metrics,
        }
