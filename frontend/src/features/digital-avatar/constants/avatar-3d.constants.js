import {

  DEFAULT_HAIR_COLOR,

  DEFAULT_SKIN_TONE,

} from './outfit-builder.constants';



/** Rigged GLB presets — hosted on threejs.org (CORS-friendly). */

export const AVATAR_3D_PRESETS = [

  {

    id: 'athletic',

    label: 'Athletic',

    description: 'Balanced athletic build',

    bodyType: 'athletic',

    modelUrl: 'https://threejs.org/examples/models/gltf/Xbot.glb',

    rotationY: Math.PI,

  },

  {

    id: 'slim',

    label: 'Slim',

    description: 'Lean silhouette',

    bodyType: 'slim',

    modelUrl: 'https://threejs.org/examples/models/gltf/Michelle.glb',

    rotationY: Math.PI,

  },

  {

    id: 'average',

    label: 'Average',

    description: 'Everyday proportions',

    bodyType: 'average',

    modelUrl: 'https://threejs.org/examples/models/gltf/Soldier.glb',

    rotationY: Math.PI,

  },

  {

    id: 'muscular',

    label: 'Muscular',

    description: 'Broad, strong frame',

    bodyType: 'muscular',

    modelUrl: 'https://threejs.org/examples/models/gltf/Xbot.glb',

    rotationY: Math.PI,

  },

];



export const DEFAULT_AVATAR_3D_PRESET = AVATAR_3D_PRESETS[0];



export const DEFAULT_AVATAR_3D_URL = DEFAULT_AVATAR_3D_PRESET.modelUrl;



export const AVATAR_VIEW_MODES = {

  TWO_D: '2d',

  THREE_D: '3d',

};



export function findAvatar3dPresetByUrl(modelUrl) {

  if (!modelUrl) {

    return null;

  }



  return AVATAR_3D_PRESETS.find((preset) => preset.modelUrl === modelUrl) || null;

}



export function findAvatar3dPresetByBodyType(bodyType) {

  if (!bodyType) {

    return null;

  }



  const normalized = String(bodyType).trim().toLowerCase().replace(/_/g, '-');



  return AVATAR_3D_PRESETS.find((preset) => preset.bodyType === normalized) || null;

}



export function resolveAvatar3dPreset({

  model3dUrl,

  bodyType,

} = {}) {

  return (

    findAvatar3dPresetByUrl(model3dUrl)

    || findAvatar3dPresetByBodyType(bodyType)

    || DEFAULT_AVATAR_3D_PRESET

  );

}



export function resolveAvatar3dModelUrl({

  model3dUrl,

  bodyType,

} = {}) {

  if (model3dUrl) {

    return model3dUrl;

  }



  return resolveAvatar3dPreset({ bodyType }).modelUrl;

}



export function resolveAvatarAppearanceDefaults(avatar) {

  return {

    skinTone: avatar?.skinTone || DEFAULT_SKIN_TONE,

    hairColor: avatar?.hairColor || DEFAULT_HAIR_COLOR,

    bodyType: avatar?.bodyType || DEFAULT_AVATAR_3D_PRESET.bodyType,

  };

}


