"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get buildProfileContext () {
        return buildProfileContext;
    },
    get buildTraitFingerprint () {
        return buildTraitFingerprint;
    },
    get enrichBodyTraits () {
        return enrichBodyTraits;
    },
    get enrichFaceTraits () {
        return enrichFaceTraits;
    },
    get hasBasicAvatarTraits () {
        return hasBasicAvatarTraits;
    },
    get hasDigitalTwin3DTraits () {
        return hasDigitalTwin3DTraits;
    },
    get hasPremiumAvatarTraits () {
        return hasPremiumAvatarTraits;
    }
});
function buildProfileContext(profile) {
    if (!profile) {
        return null;
    }
    return {
        gender: profile.gender,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        skin_tone: profile.skin_tone,
        body_type: profile.body_type
    };
}
function enrichFaceTraits(storedTraits, fullFaceAnalysis) {
    if (!fullFaceAnalysis) {
        return storedTraits;
    }
    return {
        ...storedTraits,
        face_shape: fullFaceAnalysis.faceShape ?? storedTraits?.face_shape,
        faceShape: fullFaceAnalysis.faceShape,
        skin_tone: fullFaceAnalysis.skinTone ?? storedTraits?.skin_tone,
        skinTone: fullFaceAnalysis.skinTone,
        hair_length: fullFaceAnalysis.hairLength ?? storedTraits?.hair_length,
        hairLength: fullFaceAnalysis.hairLength,
        hair_color: fullFaceAnalysis.hairColor ?? storedTraits?.hair_color,
        hairColor: fullFaceAnalysis.hairColor,
        hair_style: fullFaceAnalysis.hairStyle ?? storedTraits?.hair_style,
        hairStyle: fullFaceAnalysis.hairStyle,
        beard_type: fullFaceAnalysis.beardType ?? storedTraits?.beard_type,
        beardType: fullFaceAnalysis.beardType
    };
}
function enrichBodyTraits(storedTraits, fullBodyAnalysis, profile) {
    const merged = {
        ...storedTraits
    };
    if (fullBodyAnalysis) {
        Object.assign(merged, {
            bodyType: fullBodyAnalysis.bodyType,
            body_type: fullBodyAnalysis.bodyType,
            bodyShape: fullBodyAnalysis.bodyShape,
            body_shape: fullBodyAnalysis.bodyShape,
            bodyShapeWidths: fullBodyAnalysis.bodyShapeWidths,
            height: fullBodyAnalysis.height,
            shoulder_width: fullBodyAnalysis.shoulderWidth,
            chest: fullBodyAnalysis.chest,
            waist: fullBodyAnalysis.waist,
            hip: fullBodyAnalysis.hip,
            measurements: fullBodyAnalysis.measurements
        });
    }
    if (profile?.body_type) {
        merged.body_type = profile.body_type;
        merged.bodyType = profile.body_type;
    }
    return merged;
}
function hasBasicAvatarTraits(context) {
    return Boolean(context.profile?.gender || context.profile?.age || context.profile?.body_type || context.profile?.skin_tone || context.faceTraits?.face_shape || context.faceTraits?.faceShape || context.faceTraits?.hair_color || context.faceTraits?.hairColor || context.bodyTraits?.body_type || context.bodyTraits?.bodyType || context.bodyTraits?.body_shape || context.bodyTraits?.bodyShape);
}
function hasPremiumAvatarTraits(context) {
    const face = context.faceTraits || {};
    const body = context.bodyTraits || {};
    const skinTone = face.skin_tone || face.skinTone || context.profile?.skin_tone;
    const hasFaceAnalysis = Boolean(face.face_shape || face.faceShape);
    const hasBodyAnalysis = Boolean(body.body_type || body.bodyType || body.body_shape || body.bodyShape || body.measurements);
    const hasHairAnalysis = Boolean(face.hair_color || face.hairColor || face.hair_style || face.hairStyle || face.hair_length || face.hairLength);
    const hasBeardAnalysis = face.beard_type !== undefined && face.beard_type !== null || face.beardType !== undefined && face.beardType !== null;
    return Boolean(hasFaceAnalysis && hasBodyAnalysis && skinTone && hasHairAnalysis && hasBeardAnalysis);
}
function hasDigitalTwin3DTraits(context) {
    return hasPremiumAvatarTraits(context);
}
function buildTraitFingerprint(context) {
    const payload = {
        face: {
            faceShape: context.faceTraits?.face_shape || context.faceTraits?.faceShape,
            skinTone: context.faceTraits?.skin_tone || context.faceTraits?.skinTone,
            hairLength: context.faceTraits?.hair_length || context.faceTraits?.hairLength,
            hairColor: context.faceTraits?.hair_color || context.faceTraits?.hairColor,
            hairStyle: context.faceTraits?.hair_style || context.faceTraits?.hairStyle,
            beardType: context.faceTraits?.beard_type || context.faceTraits?.beardType
        },
        body: {
            bodyType: context.bodyTraits?.body_type || context.bodyTraits?.bodyType,
            bodyShape: context.bodyTraits?.body_shape || context.bodyTraits?.bodyShape
        }
    };
    return JSON.stringify(payload);
}

//# sourceMappingURL=digital-avatar-context.util.js.map