export const OUTFIT_SLOTS = {
  TSHIRT: 'tshirt',
  SHIRT: 'shirt',
  JACKET: 'jacket',
  PANTS: 'pants',
  SHOES: 'shoes',
};

export const OUTFIT_SLOT_LABELS = {
  [OUTFIT_SLOTS.TSHIRT]: 'T-Shirt',
  [OUTFIT_SLOTS.SHIRT]: 'Shirt',
  [OUTFIT_SLOTS.JACKET]: 'Jacket',
  [OUTFIT_SLOTS.PANTS]: 'Pants',
  [OUTFIT_SLOTS.SHOES]: 'Shoes',
};

export const CATEGORY_TABS = [
  {
    id: 't-shirts',
    label: 'T-Shirts',
    slot: OUTFIT_SLOTS.TSHIRT,
    icon: 'shirt',
    accent: '#8B5CF6',
  },
  {
    id: 'shirts',
    label: 'Shirts',
    slot: OUTFIT_SLOTS.SHIRT,
    icon: 'shirt',
    accent: '#3B82F6',
  },
  {
    id: 'jackets',
    label: 'Jackets',
    slot: OUTFIT_SLOTS.JACKET,
    icon: 'jacket',
    accent: '#F59E0B',
  },
  {
    id: 'pants',
    label: 'Pants',
    slot: OUTFIT_SLOTS.PANTS,
    icon: 'pants',
    accent: '#22C55E',
  },
  {
    id: 'shoes',
    label: 'Shoes',
    slot: OUTFIT_SLOTS.SHOES,
    icon: 'shoes',
    accent: '#EC4899',
  },
];

export const CATEGORY_SLOT_MAP = {
  't-shirts': OUTFIT_SLOTS.TSHIRT,
  shirts: OUTFIT_SLOTS.SHIRT,
  jackets: OUTFIT_SLOTS.JACKET,
  pants: OUTFIT_SLOTS.PANTS,
  shoes: OUTFIT_SLOTS.SHOES,
};

export const SKIN_TONE_OPTIONS = [
  { id: 'fair', color: '#F5D0C5', label: 'Fair' },
  { id: 'light', color: '#E8B89A', label: 'Light' },
  { id: 'medium', color: '#C68658', label: 'Medium' },
  { id: 'olive', color: '#A67C52', label: 'Olive' },
  { id: 'tan', color: '#8D5524', label: 'Tan' },
  { id: 'dark', color: '#5C3D2E', label: 'Dark' },
];

export const HAIR_COLOR_OPTIONS = [
  { id: 'black', color: '#1A1412', label: 'Black' },
  { id: 'dark-brown', color: '#3D2B1F', label: 'Dark Brown' },
  { id: 'brown', color: '#6B4423', label: 'Brown' },
  { id: 'auburn', color: '#8B3A2A', label: 'Auburn' },
  { id: 'blonde', color: '#D4A76A', label: 'Blonde' },
  { id: 'platinum', color: '#E8DCC8', label: 'Platinum' },
  { id: 'gray', color: '#9CA3AF', label: 'Gray' },
  { id: 'red', color: '#B45309', label: 'Red' },
];

export const DEFAULT_OUTFIT = {
  [OUTFIT_SLOTS.TSHIRT]: {
    id: 'tee-2',
    brand: 'UNIQLO',
    title: 'Classic Black Tee',
    price: 19,
    rating: 4.9,
    color: '#111827',
    categoryId: 't-shirts',
  },
  [OUTFIT_SLOTS.JACKET]: {
    id: 'jacket-1',
    brand: 'ZARA',
    title: 'Structured Blazer',
    price: 129,
    rating: 4.8,
    color: '#1F2937',
    categoryId: 'jackets',
  },
  [OUTFIT_SLOTS.PANTS]: {
    id: 'pants-1',
    brand: 'ACNE STUDIOS',
    title: 'Slim Raw-Edge Jeans',
    price: 280,
    rating: 4.7,
    color: '#1E3A5F',
    categoryId: 'pants',
  },
  [OUTFIT_SLOTS.SHOES]: {
    id: 'shoes-1',
    brand: 'NIKE',
    title: 'Air Force 1 Low',
    price: 110,
    rating: 4.9,
    color: '#F9FAFB',
    categoryId: 'shoes',
  },
};

export const DEFAULT_PRODUCTS_BY_CATEGORY = {
  't-shirts': [
    {
      id: 'tee-1',
      brand: 'EVERLANE',
      title: 'Pima Cotton Tee',
      price: 28,
      rating: 4.8,
      color: '#F3F4F6',
    },
    {
      id: 'tee-2',
      brand: 'UNIQLO',
      title: 'Classic Black Tee',
      price: 19,
      rating: 4.9,
      color: '#111827',
    },
    {
      id: 'tee-3',
      brand: 'ZARA',
      title: 'Essential Cotton Tee',
      price: 15,
      rating: 4.7,
      color: '#374151',
    },
    {
      id: 'tee-4',
      brand: 'J.CREW',
      title: 'Supima Crew Tee',
      price: 35,
      rating: 4.6,
      color: '#E5E7EB',
    },
  ],
  shirts: [
    {
      id: 'shirt-1',
      brand: 'BROOKS BROTHERS',
      title: 'Oxford Button-Down',
      price: 89,
      rating: 4.8,
      color: '#DBEAFE',
    },
    {
      id: 'shirt-2',
      brand: 'UNIQLO',
      title: 'Linen Blend Shirt',
      price: 39,
      rating: 4.7,
      color: '#F5F5F4',
    },
    {
      id: 'shirt-3',
      brand: 'COS',
      title: 'Relaxed Poplin Shirt',
      price: 79,
      rating: 4.6,
      color: '#FFFFFF',
    },
    {
      id: 'shirt-4',
      brand: 'EVERLANE',
      title: 'Organic Cotton Shirt',
      price: 58,
      rating: 4.5,
      color: '#D1D5DB',
    },
  ],
  jackets: [
    {
      id: 'jacket-1',
      brand: 'ZARA',
      title: 'Structured Blazer',
      price: 129,
      rating: 4.8,
      color: '#1F2937',
    },
    {
      id: 'jacket-2',
      brand: 'ALLSAINTS',
      title: 'Leather Biker Jacket',
      price: 450,
      rating: 4.9,
      color: '#111827',
    },
    {
      id: 'jacket-3',
      brand: 'UNIQLO',
      title: 'Ultra Light Down',
      price: 69,
      rating: 4.7,
      color: '#374151',
    },
    {
      id: 'jacket-4',
      brand: 'PATAGONIA',
      title: 'Retro-X Fleece',
      price: 199,
      rating: 4.8,
      color: '#92400E',
    },
  ],
  pants: [
    {
      id: 'pants-1',
      brand: 'ACNE STUDIOS',
      title: 'Slim Raw-Edge Jeans',
      price: 280,
      rating: 4.7,
      color: '#1E3A5F',
    },
    {
      id: 'pants-2',
      brand: 'UNIQLO',
      title: 'Slim Fit Chinos',
      price: 49,
      rating: 4.6,
      color: '#78716C',
    },
    {
      id: 'pants-3',
      brand: 'LEVI\'S',
      title: '501 Original Jeans',
      price: 98,
      rating: 4.8,
      color: '#1E40AF',
    },
    {
      id: 'pants-4',
      brand: 'COS',
      title: 'Wide-Leg Trousers',
      price: 115,
      rating: 4.5,
      color: '#111827',
    },
  ],
  shoes: [
    {
      id: 'shoes-1',
      brand: 'NIKE',
      title: 'Air Force 1 Low',
      price: 110,
      rating: 4.9,
      color: '#F9FAFB',
    },
    {
      id: 'shoes-2',
      brand: 'ADIDAS',
      title: 'Stan Smith',
      price: 95,
      rating: 4.7,
      color: '#FFFFFF',
    },
    {
      id: 'shoes-3',
      brand: 'COMMON PROJECTS',
      title: 'Achilles Low',
      price: 425,
      rating: 4.8,
      color: '#FFFFFF',
    },
    {
      id: 'shoes-4',
      brand: 'VANS',
      title: 'Old Skool',
      price: 70,
      rating: 4.6,
      color: '#111827',
    },
  ],
};

export const DEFAULT_SKIN_TONE = 'medium';
export const DEFAULT_HAIR_COLOR = 'black';

export const AVATAR_PAGE_COLORS = {
  background: '#070B1A',
  card: '#141E32',
  accent: '#8B5CF6',
};
