import { ROUTES } from '@/constants/routes';

export const CLOSET_PREVIEW_LIMIT = 4;

export const CLOSET_TABS = {
  WARDROBE: 'wardrobe',
  PREFERENCES: 'preferences',
};

export const CLOSET_TAB_ITEMS = [
  {
    id: CLOSET_TABS.WARDROBE,
    label: 'Wardrobe & Activity',
    description: 'Saved outfits, purchases, and recent activity.',
  },
  {
    id: CLOSET_TABS.PREFERENCES,
    label: 'Style Preferences',
    description: 'Favorite brands and colors from your wardrobe signals.',
  },
];

export const CLOSET_SECTIONS = {
  activity: {
    id: 'activity',
    title: 'Recent Activity',
    description: 'Your latest wardrobe moments and updates.',
    tab: CLOSET_TABS.WARDROBE,
  },
  outfits: {
    id: 'outfits',
    title: 'Saved Outfits',
    description: 'Looks saved from Digital Avatar, Virtual Try-On, and Recommendations.',
    tab: CLOSET_TABS.WARDROBE,
  },
  purchases: {
    id: 'purchases',
    title: 'Purchased Items',
    description: 'Products from delivered orders in your wardrobe.',
    tab: CLOSET_TABS.WARDROBE,
  },
  brands: {
    id: 'brands',
    title: 'Favorite Brands',
    description: 'Calculated from purchases, wishlist, and saved outfits.',
    tab: CLOSET_TABS.PREFERENCES,
  },
  colors: {
    id: 'colors',
    title: 'Favorite Colors',
    description: 'Your most-used colors across wardrobe activity.',
    tab: CLOSET_TABS.PREFERENCES,
  },
};

export function getClosetSectionHref(sectionId) {
  return ROUTES.MY_CLOSET_SECTION(sectionId);
}

export function getClosetTabHref(tabId) {
  return `${ROUTES.MY_CLOSET}?tab=${tabId}`;
}

export function isClosetSectionId(value) {
  return Boolean(value && CLOSET_SECTIONS[value]);
}
