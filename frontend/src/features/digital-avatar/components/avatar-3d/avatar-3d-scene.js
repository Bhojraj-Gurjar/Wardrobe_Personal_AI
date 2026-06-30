'use client';

import {
  forwardRef,
  Suspense,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Html,
} from '@react-three/drei';
import { cn } from '@/utils/cn';
import { Avatar3DModel } from './avatar-3d-model';
import { Avatar3DCameraRig } from './avatar-3d-camera-rig';
import { Avatar3DOutfitEquip } from './avatar-3d-outfit-equip';
import { resolveAvatar3dModelUrl } from '../../constants/avatar-3d.constants';
import { AVATAR_3D_PRESETS } from '../../constants/avatar-3d.constants';
import { useGLTF } from '@react-three/drei';

for (const preset of AVATAR_3D_PRESETS) {
  if (preset.modelUrl) {
    useGLTF.preload(preset.modelUrl);
  }
}

function SceneLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="h-32 w-24 animate-pulse rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5" />
        <div className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur">
          Loading Avatar…
        </div>
      </div>
    </Html>
  );
}

function SceneContentWithFit({
  modelUrl,
  bodyType,
  skinTone,
  hairColor,
  outfit,
  heightScale,
  rigRef,
  fitState,
  setFitState,
  cameraPreset,
  autoSpin,
}) {
  const handleFitComputed = useCallback((fit) => {
    setFitState(fit);
  }, [setFitState]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={1.35}
        position={[4, 8, 4]}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight intensity={0.35} position={[-3, 5, -2]} />
      <pointLight intensity={0.25} position={[0, 2.2, 2]} color="#c4b5fd" />

      <Suspense fallback={<SceneLoader />}>
        <Avatar3DModel
          url={modelUrl}
          bodyType={bodyType}
          skinTone={skinTone}
          hairColor={hairColor}
          heightScale={heightScale}
          onFitComputed={handleFitComputed}
        />
        <Avatar3DOutfitEquip outfit={outfit} heightScale={heightScale} />
        <Environment preset="city" />
      </Suspense>

      <ContactShadows
        blur={2.5}
        far={4.5}
        opacity={0.72}
        position={[0, 0, 0]}
        scale={12}
      />

      <Avatar3DCameraRig
        rigRef={rigRef}
        fitState={fitState}
        cameraPreset={cameraPreset}
        autoSpin={autoSpin}
      />
    </>
  );
}

function Avatar3DCanvasShell({ className, onDoubleClick, children }) {
  return (
    <div
      onDoubleClick={onDoubleClick}
      className={cn(
        'relative isolate h-full w-full touch-none overscroll-contain',
        className,
      )}
    >
      {children}
    </div>
  );
}

export const Avatar3DScene = forwardRef(function Avatar3DScene({
  modelUrl,
  bodyType,
  skinTone,
  hairColor,
  outfit,
  heightScale = 1,
  cameraPreset = 'fullBody',
  autoSpin = false,
  className,
}, ref) {
  const rigRef = useRef(null);
  const [fitState, setFitState] = useState(null);
  const resolvedUrl = resolveAvatar3dModelUrl({ model3dUrl: modelUrl, bodyType });

  useImperativeHandle(ref, () => ({
    zoomIn: () => rigRef.current?.zoomIn(),
    zoomOut: () => rigRef.current?.zoomOut(),
    resetView: () => rigRef.current?.resetView(),
    setCameraPreset: (presetId) => rigRef.current?.setCameraPreset?.(presetId),
  }), []);

  const handleDoubleClick = useCallback(() => {
    rigRef.current?.resetView();
  }, []);

  return (
    <Avatar3DCanvasShell className={className} onDoubleClick={handleDoubleClick}>
      <Canvas
        className="!h-full !w-full"
        style={{ width: '100%', height: '100%' }}
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 1.5, 3] }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        shadows
      >
        <SceneContentWithFit
          modelUrl={resolvedUrl}
          bodyType={bodyType}
          skinTone={skinTone}
          hairColor={hairColor}
          outfit={outfit}
          heightScale={heightScale}
          rigRef={rigRef}
          fitState={fitState}
          setFitState={setFitState}
          cameraPreset={cameraPreset}
          autoSpin={autoSpin}
        />
      </Canvas>
    </Avatar3DCanvasShell>
  );
});
