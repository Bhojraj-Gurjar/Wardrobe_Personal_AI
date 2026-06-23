from pydantic import BaseModel, Field


class FitProfileRequest(BaseModel):
    body_type: str = Field(alias="bodyType")
    body_shape: str = Field(alias="bodyShape")
    body_type_code: str | None = Field(default=None, alias="bodyTypeCode")
    body_shape_code: str | None = Field(default=None, alias="bodyShapeCode")

    model_config = {"populate_by_name": True}


class MeasurementField(BaseModel):
    value: float | None = None
    normalized: float | None = None
    confidence: float | None = None


class BodyMeasurements(BaseModel):
    height: MeasurementField
    shoulder_width: MeasurementField = Field(alias="shoulderWidth")
    chest: MeasurementField
    waist: MeasurementField
    hip: MeasurementField
    arm_length: MeasurementField = Field(alias="armLength")
    leg_length: MeasurementField = Field(alias="legLength")

    model_config = {"populate_by_name": True}


class BodyAnalysisResult(BaseModel):
    body_type: str | None = Field(default=None, alias="bodyType")
    body_type_code: str | None = Field(default=None, alias="bodyTypeCode")
    body_type_confidence: float | None = Field(default=None, alias="bodyTypeConfidence")
    body_type_ratios: dict | None = Field(default=None, alias="bodyTypeRatios")
    body_shape: str | None = Field(default=None, alias="bodyShape")
    body_shape_code: str | None = Field(default=None, alias="bodyShapeCode")
    body_shape_confidence: float | None = Field(default=None, alias="bodyShapeConfidence")
    body_shape_ratios: dict | None = Field(default=None, alias="bodyShapeRatios")
    body_shape_widths: dict | None = Field(default=None, alias="bodyShapeWidths")
    height: float | None = None
    shoulder_width: float | None = Field(default=None, alias="shoulderWidth")
    chest: float | None = None
    waist: float | None = None
    hip: float | None = Field(default=None, alias="hip")
    arm_length: float | None = Field(default=None, alias="armLength")
    leg_length: float | None = Field(default=None, alias="legLength")
    measurements: BodyMeasurements | dict | None = None
    analysis_mode: str | None = Field(default=None, alias="analysisMode")
    frames_extracted: int | None = Field(default=None, alias="framesExtracted")
    frames_analyzed: int | None = Field(default=None, alias="framesAnalyzed")
    frames_used: int | None = Field(default=None, alias="framesUsed")
    overall_confidence: float | None = Field(default=None, alias="overallConfidence")
    fit_profile: dict | None = Field(default=None, alias="fitProfile")

    model_config = {"populate_by_name": True}

    def model_dump_public(self) -> dict:
        return self.model_dump(by_alias=True, exclude_none=False)
