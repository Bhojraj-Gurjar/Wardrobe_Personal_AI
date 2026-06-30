'use client';

import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { AVATAR_CAMERA_PRESETS } from '@/features/digital-avatar/constants/rpm.constants';

const ZOOM_FACTOR = 0.82;
const DEFAULT_FOV = 45;

function toVector3(values) {
  return new Vector3(values[0], values[1], values[2]);
}

export function Avatar3DCameraRig({
  rigRef,
  fitState,
  cameraPreset = 'fullBody',
  autoSpin = false,
  onFitApplied,
}) {
  const controlsRef = useRef(null);
  const { camera } = useThree();
  const appliedFitKeyRef = useRef(null);
  const spinEnabledRef = useRef(autoSpin);

  useEffect(() => {
    spinEnabledRef.current = autoSpin;
  }, [autoSpin]);

  const applyPreset = useCallback((presetId, { animate = true } = {}) => {
    const controls = controlsRef.current;
    const preset = AVATAR_CAMERA_PRESETS[presetId] || AVATAR_CAMERA_PRESETS.fullBody;

    if (!controls || !preset) {
      return;
    }

    const target = toVector3(preset.target);
    const position = toVector3(preset.position);

    controls.target.copy(target);

    if (animate) {
      camera.position.lerp(position, 0.35);
    } else {
      camera.position.copy(position);
    }

    if (camera.fov !== (preset.fov || DEFAULT_FOV)) {
      camera.fov = preset.fov || DEFAULT_FOV;
      camera.updateProjectionMatrix();
    }

    controls.minDistance = 0.8;
    controls.maxDistance = 8;
    controls.update();
    onFitApplied?.(preset);
  }, [camera, onFitApplied]);

  const applyFit = useCallback((fit, { animate = false } = {}) => {
    const controls = controlsRef.current;

    if (!fit || !controls) {
      return;
    }

    const target = toVector3(fit.target);
    const position = toVector3(fit.cameraPosition);

    controls.target.copy(target);

    if (animate) {
      camera.position.lerp(position, 0.35);
    } else {
      camera.position.copy(position);
    }

    if (camera.fov !== DEFAULT_FOV) {
      camera.fov = DEFAULT_FOV;
      camera.updateProjectionMatrix();
    }

    controls.minDistance = Math.max(0.8, fit.distance * 0.55);
    controls.maxDistance = Math.max(8, fit.distance * 2.4);
    controls.update();
    onFitApplied?.(fit);
  }, [camera, onFitApplied]);

  useImperativeHandle(rigRef, () => ({
    zoomIn: () => {
      const controls = controlsRef.current;
      if (!controls) return;

      const offset = new Vector3().subVectors(camera.position, controls.target);
      offset.multiplyScalar(ZOOM_FACTOR);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    },
    zoomOut: () => {
      const controls = controlsRef.current;
      if (!controls) return;

      const offset = new Vector3().subVectors(camera.position, controls.target);
      offset.multiplyScalar(1 / ZOOM_FACTOR);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    },
    resetView: () => {
      applyPreset('fullBody', { animate: true });
    },
    setCameraPreset: (presetId) => {
      applyPreset(presetId, { animate: true });
    },
  }), [applyFit, applyPreset, camera, fitState]);

  useEffect(() => {
    if (!fitState) {
      return undefined;
    }

    let frameId = 0;

    const applyWhenReady = () => {
      if (!controlsRef.current) {
        frameId = requestAnimationFrame(applyWhenReady);
        return;
      }

      const fitKey = JSON.stringify(fitState);
      if (appliedFitKeyRef.current === fitKey) {
        return;
      }

      appliedFitKeyRef.current = fitKey;
      applyFit(fitState);
      applyPreset(cameraPreset, { animate: false });
    };

    applyWhenReady();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [applyFit, applyPreset, cameraPreset, fitState]);

  useEffect(() => {
    applyPreset(cameraPreset, { animate: true });
  }, [applyPreset, cameraPreset]);

  useFrame((_, delta) => {
    if (spinEnabledRef.current && controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.8;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }

    controlsRef.current?.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.08}
      zoomSpeed={0.85}
      rotateSpeed={0.7}
      minDistance={0.8}
      maxDistance={8}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 1.85}
      target={fitState?.target ?? [0, 0.95, 0]}
    />
  );
}
