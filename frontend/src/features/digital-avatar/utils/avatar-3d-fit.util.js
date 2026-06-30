import { Box3, Vector3 } from 'three';

/**
 * Centers and scales a loaded GLB so it fills ~75–85% of the viewer height.
 * Orbit target is placed at chest height for natural framing.
 */
export function fitAvatarModelToViewer(object, options = {}) {
  const targetHeight = options.targetHeight ?? 3;
  const fillRatio = options.fillRatio ?? 0.92;

  if (!object) {
    return {
      target: [0, 1.05, 0],
      cameraPosition: [0, 1.15, 2.6],
      distance: 2.6,
    };
  }

  object.updateMatrixWorld(true);

  let box = new Box3().setFromObject(object);
  const center = box.getCenter(new Vector3());
  const min = box.min.clone();

  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= min.y;

  object.updateMatrixWorld(true);
  box = new Box3().setFromObject(object);
  const size = box.getSize(new Vector3());

  const height = size.y || 1;
  const scale = (targetHeight * fillRatio) / height;
  object.scale.setScalar(scale);

  object.updateMatrixWorld(true);
  box = new Box3().setFromObject(object);
  const fittedCenter = box.getCenter(new Vector3());
  const fittedSize = box.getSize(new Vector3());

  const chestY = fittedSize.y * 0.52;
  const target = [fittedCenter.x, chestY, fittedCenter.z];

  const distance = Math.max(
    fittedSize.y * 0.78,
    Math.max(fittedSize.x, fittedSize.z) * 1.35,
  );

  return {
    target,
    cameraPosition: [
      fittedCenter.x,
      chestY + fittedSize.y * 0.04,
      fittedCenter.z + distance,
    ],
    distance,
  };
}
