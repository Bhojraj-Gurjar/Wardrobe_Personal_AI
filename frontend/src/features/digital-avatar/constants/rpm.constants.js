export const AVATAR_CAMERA_PRESETS = {
  front: {
    id: 'front',
    label: 'Front',
    position: [0, 1.05, 2.8],
    target: [0, 0.95, 0],
    fov: 42,
  },
  left: {
    id: 'left',
    label: 'Left',
    position: [2.4, 1.05, 0.4],
    target: [0, 0.95, 0],
    fov: 42,
  },
  right: {
    id: 'right',
    label: 'Right',
    position: [-2.4, 1.05, 0.4],
    target: [0, 0.95, 0],
    fov: 42,
  },
  back: {
    id: 'back',
    label: 'Back',
    position: [0, 1.05, -2.8],
    target: [0, 0.95, 0],
    fov: 42,
  },
  fullBody: {
    id: 'fullBody',
    label: 'Full Body',
    position: [0, 1.0, 3.6],
    target: [0, 0.85, 0],
    fov: 45,
  },
  faceCloseUp: {
    id: 'faceCloseUp',
    label: 'Face',
    position: [0, 1.45, 1.15],
    target: [0, 1.42, 0],
    fov: 35,
  },
};

export const AVATAR_EQUIPMENT_SLOTS = [
  { id: 'headwear', label: 'Headwear', outfitSlot: null, categoryIds: ['accessories'] },
  { id: 'glasses', label: 'Glasses', outfitSlot: null, categoryIds: ['accessories'] },
  { id: 'top', label: 'Top', outfitSlot: 'tshirt', categoryIds: ['t-shirts', 'shirts'] },
  { id: 'outerwear', label: 'Outerwear', outfitSlot: 'jacket', categoryIds: ['jackets'] },
  { id: 'bottom', label: 'Bottom', outfitSlot: 'pants', categoryIds: ['pants'] },
  { id: 'footwear', label: 'Footwear', outfitSlot: 'shoes', categoryIds: ['shoes'] },
  { id: 'accessories', label: 'Accessories', outfitSlot: null, categoryIds: ['accessories'] },
];
