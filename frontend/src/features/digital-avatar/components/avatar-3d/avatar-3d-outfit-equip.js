'use client';

import { Suspense, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { DoubleSide } from 'three';
import { getPrimaryProductImage } from '@/features/digital-avatar/utils/outfit-builder.util';
import { resolveProductOverlayUrl } from '@/features/digital-avatar/constants/avatar-assets.constants';

const SLOT_LAYOUT = {
  tshirt: { position: [0, 1.12, 0.09], rotation: [0, 0, 0], size: [0.62, 0.72] },
  shirt: { position: [0, 1.14, 0.095], rotation: [0, 0, 0], size: [0.64, 0.74] },
  jacket: { position: [0, 1.16, 0.1], rotation: [0, 0, 0], size: [0.68, 0.82] },
  pants: { position: [0, 0.62, 0.08], rotation: [0, 0, 0], size: [0.58, 0.92] },
  shoes: { position: [0, 0.06, 0.07], rotation: [0, 0, 0], size: [0.42, 0.16] },
};

function resolveGarmentTextureUrl(item) {
  return (
    resolveProductOverlayUrl(item, item?.categoryId)
    || item?.overlayUrl
    || getPrimaryProductImage(item)
    || null
  );
}

function GarmentPlane({ item, slotKey }) {
  const layout = SLOT_LAYOUT[slotKey];
  const textureUrl = resolveGarmentTextureUrl(item);

  const texture = useTexture(textureUrl);

  return (
    <mesh position={layout.position} rotation={layout.rotation}>
      <planeGeometry args={layout.size} />
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.08}
        side={DoubleSide}
        depthWrite={false}
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  );
}

function GarmentPlaneLoader({ item, slotKey }) {
  const textureUrl = resolveGarmentTextureUrl(item);
  if (!textureUrl || !SLOT_LAYOUT[slotKey]) return null;

  return (
    <Suspense fallback={null}>
      <GarmentPlane item={item} slotKey={slotKey} />
    </Suspense>
  );
}

export function Avatar3DOutfitEquip({ outfit, heightScale = 1 }) {
  const layers = useMemo(() => {
    const entries = [];

    Object.entries(SLOT_LAYOUT).forEach(([slotKey]) => {
      const item = outfit?.[slotKey];
      if (item?.id) {
        entries.push({ slotKey, item });
      }
    });

    return entries;
  }, [outfit]);

  if (!layers.length) {
    return null;
  }

  return (
    <group scale={[heightScale, heightScale, heightScale]}>
      {layers.map(({ slotKey, item }) => (
        <GarmentPlaneLoader key={`${slotKey}-${item.id}`} slotKey={slotKey} item={item} />
      ))}
    </group>
  );
}
