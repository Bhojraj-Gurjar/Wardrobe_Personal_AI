'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { resolveAvatar3dPreset } from '../../constants/avatar-3d.constants';
import { isAvaturnModelUrl } from '../../utils/avatar-creator.util';
import { fitAvatarModelToViewer } from '../../utils/avatar-3d-fit.util';
import {
  applyAvatarMaterialColors,
  resolveHairColorHex,
  resolveSkinToneHex,
} from '../../utils/avatar-3d-material.util';

function findIdleAction(actions) {
  if (!actions) {
    return null;
  }

  return (
    actions.idle
    || actions.Idle
    || actions['mixamo.com']
    || Object.values(actions).find(Boolean)
    || null
  );
}

export function Avatar3DModel({
  url,
  bodyType,
  skinTone,
  hairColor,
  heightScale = 1,
  onFitComputed,
}) {
  const groupRef = useRef();
  const contentRef = useRef();
  const fitKeyRef = useRef(null);
  const { scene, animations } = useGLTF(url);
  const modelScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const preset = useMemo(
    () => resolveAvatar3dPreset({ model3dUrl: url, bodyType }),
    [bodyType, url],
  );
  const { actions } = useAnimations(animations, groupRef);
  const [isReady, setIsReady] = useState(false);
  const skinColor = resolveSkinToneHex(skinTone);
  const hairColorHex = resolveHairColorHex(hairColor);

  const rotationY = useMemo(() => {
    if (url?.includes('readyplayer.me') || url?.includes('avaturn')) {
      return 0;
    }

    return preset.rotationY ?? Math.PI;
  }, [preset.rotationY, url]);

  useEffect(() => {
    if (isAvaturnModelUrl(url)) {
      return;
    }

    applyAvatarMaterialColors(modelScene, {
      skinColor,
      hairColor: hairColorHex,
    });
  }, [hairColorHex, modelScene, skinColor, url]);

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    const fitKey = `${url}:${bodyType}`;
    if (fitKeyRef.current === fitKey) {
      return;
    }

    content.position.set(0, 0, 0);
    content.scale.setScalar(1);
    content.rotation.set(0, rotationY, 0);

    const fit = fitAvatarModelToViewer(content);
    content.scale.multiplyScalar(heightScale);
    fitKeyRef.current = fitKey;
    onFitComputed?.({
      ...fit,
      target: fit.target.map((value, index) => (
        index === 1 ? value * heightScale : value
      )),
    });
    setIsReady(true);
  }, [bodyType, heightScale, onFitComputed, rotationY, url]);

  useEffect(() => {
    const idle = findIdleAction(actions);

    if (!idle) {
      return undefined;
    }

    idle.reset().fadeIn(0.25).play();

    return () => {
      idle.fadeOut(0.25);
    };
  }, [actions, url]);

  useEffect(() => () => {
    modelScene.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material];

      for (const material of materials) {
        if (!material) {
          continue;
        }

        for (const key of Object.keys(material)) {
          const value = material[key];

          if (value?.isTexture) {
            value.dispose();
          }
        }

        material.dispose();
      }
    });
  }, [modelScene]);

  return (
    <group ref={groupRef} dispose={null} visible={isReady}>
      <group ref={contentRef}>
        <primitive object={modelScene} />
      </group>
    </group>
  );
}
