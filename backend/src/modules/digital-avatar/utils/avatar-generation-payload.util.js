export function buildAvatarGenerationPayload(context, avatarType) {
  const face = context.faceTraits || {};
  const body = context.bodyTraits || {};
  const profile = context.profile || null;

  const skinTone =
    face.skin_tone
    || face.skinTone
    || profile?.skin_tone
    || null;

  return {
    avatarType,
    faceAnalysis: {
      faceShape: face.face_shape || face.faceShape || null,
      skinTone,
    },
    bodyAnalysis: {
      bodyType: body.body_type || body.bodyType || profile?.body_type || null,
      bodyShape: body.body_shape || body.bodyShape || null,
      bodyShapeWidths: body.bodyShapeWidths || body.body_shape_widths || null,
      height: body.height || profile?.height || null,
      shoulder_width: body.shoulder_width || null,
      chest: body.chest || null,
      waist: body.waist || null,
      hip: body.hip || null,
      measurements: body.measurements || null,
    },
    skinTone,
    hairAnalysis: {
      hairLength: face.hair_length || face.hairLength || null,
      hairColor: face.hair_color || face.hairColor || null,
      hairStyle: face.hair_style || face.hairStyle || null,
    },
    beardAnalysis: {
      beardType: face.beard_type ?? face.beardType ?? null,
    },
    profile,
  };
}
