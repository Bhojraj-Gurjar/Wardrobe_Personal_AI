import {
  HAIR_COLOR_OPTIONS,
  SKIN_TONE_OPTIONS,
} from '../constants/outfit-builder.constants';

export function resolveSkinToneHex(skinToneId) {
  return SKIN_TONE_OPTIONS.find((option) => option.id === skinToneId)?.color
    || SKIN_TONE_OPTIONS.find((option) => option.id === 'medium')?.color
    || '#C68658';
}

export function resolveHairColorHex(hairColorId) {
  return HAIR_COLOR_OPTIONS.find((option) => option.id === hairColorId)?.color
    || HAIR_COLOR_OPTIONS.find((option) => option.id === 'black')?.color
    || '#1A1412';
}

const SKIN_MESH_HINTS = ['skin', 'body', 'face', 'head', 'arm', 'leg', 'hand', 'torso', 'neck'];
const HAIR_MESH_HINTS = ['hair', 'beard', 'brow'];
const SKIP_MESH_HINTS = ['eye', 'teeth', 'cloth', 'shirt', 'pant', 'shoe', 'glass'];

function meshName(value) {
  return String(value || '').toLowerCase();
}

function matchesHint(name, hints) {
  return hints.some((hint) => name.includes(hint));
}

function shouldSkipMesh(name) {
  return SKIP_MESH_HINTS.some((hint) => name.includes(hint));
}

function tintMaterial(material, hexColor, intensity = 0.55) {
  if (!material?.color) {
    return material;
  }

  const tinted = material.clone();
  tinted.color.set(hexColor);
  tinted.emissive?.set(hexColor);
  tinted.emissiveIntensity = intensity * 0.15;

  return tinted;
}

export function applyAvatarMaterialColors(object, { skinColor, hairColor }) {
  if (!object) {
    return;
  }

  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    const name = meshName(child.name);
    const materials = Array.isArray(child.material) ? child.material : [child.material];

    if (shouldSkipMesh(name)) {
      return;
    }

    const nextMaterials = materials.map((material) => {
      if (matchesHint(name, HAIR_MESH_HINTS)) {
        return tintMaterial(material, hairColor, 0.75);
      }

      if (matchesHint(name, SKIN_MESH_HINTS)) {
        return tintMaterial(material, skinColor, 0.65);
      }

      return material;
    });

    child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
  });
}
