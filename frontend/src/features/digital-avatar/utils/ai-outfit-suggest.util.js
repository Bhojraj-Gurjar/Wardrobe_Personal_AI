import {
  OUTFIT_SLOTS,
} from '../constants/outfit-builder.constants';

import { EMPTY_LAYERED_OUTFIT } from '../constants/avatar-layer.constants';

import { resolveRecommendationItems } from '@/features/products/utils/product-catalog.utils';

import {
  inferProductCategory,
  mapApiProductToOutfitItem,
} from './outfit-builder.util';



const CATEGORY_SLOTS = [

  { categoryId: 't-shirts', slot: OUTFIT_SLOTS.TSHIRT },

  { categoryId: 'shirts', slot: OUTFIT_SLOTS.SHIRT },

  { categoryId: 'jackets', slot: OUTFIT_SLOTS.JACKET },

  { categoryId: 'pants', slot: OUTFIT_SLOTS.PANTS },

  { categoryId: 'shoes', slot: OUTFIT_SLOTS.SHOES },

];



function scoreRecommendationItem(item, fashionDna) {

  const baseScore = Number(item?.score) || 0;

  const product = item?.product || item;

  const name = `${product?.name || ''}`.toLowerCase();

  let bonus = 0;



  const styleType = String(

    fashionDna?.styleType || fashionDna?.style_type || '',

  ).toLowerCase();



  if (styleType && name.includes(styleType.split('_')[0])) {

    bonus += 0.05;

  }



  const colorAffinity = fashionDna?.colorAffinity || fashionDna?.color_affinity || {};



  Object.keys(colorAffinity).forEach((color) => {

    if (name.includes(String(color).toLowerCase())) {

      bonus += Number(colorAffinity[color]) * 0.1;

    }

  });



  return baseScore + bonus;

}



function pickBestForCategory(items, categoryId, fashionDna) {

  const ranked = items

    .map((item) => ({

      item,

      score: scoreRecommendationItem(item, fashionDna),

      categoryId: inferProductCategory(item?.product || item),

    }))

    .filter((entry) => entry.categoryId === categoryId)

    .sort((left, right) => right.score - left.score);



  if (!ranked.length) {

    return null;

  }



  return mapApiProductToOutfitItem(ranked[0].item.product || ranked[0].item, categoryId);

}



function pickFromCatalog(catalog, categoryId) {

  const items = catalog?.[categoryId] || [];



  return items[0] || null;

}



export function suggestCompleteOutfit({

  recommendations = [],

  fashionDna,

  faceAnalysis,

  bodyAnalysis,

  catalog,

}) {

  const recommendationItems = resolveRecommendationItems(recommendations);

  const nextOutfit = { ...EMPTY_LAYERED_OUTFIT };



  CATEGORY_SLOTS.forEach(({ categoryId, slot }) => {

    const selected = pickBestForCategory(recommendationItems, categoryId, fashionDna)

      || pickFromCatalog(catalog, categoryId);



    if (selected) {

      nextOutfit[slot] = {

        ...selected,

        categoryId,

      };

    }

  });



  const skinTone = faceAnalysis?.skinTone || faceAnalysis?.skin_tone;

  const hairColor = faceAnalysis?.hairColor || faceAnalysis?.hair_color;

  const bodyType = bodyAnalysis?.bodyType || bodyAnalysis?.body_type;



  return {

    outfit: nextOutfit,

    activeCategory: 't-shirts',

    personalization: {

      usedFashionDna: Boolean(fashionDna),

      usedFaceAnalysis: Boolean(faceAnalysis),

      usedBodyAnalysis: Boolean(bodyType),

      recommendationCount: recommendationItems.length,

    },

    skinTone,

    hairColor,

  };

}



export function getCategoryDescription(categoryId, outfit) {

  const labels = {

    't-shirts': 'Replaces selected t-shirt',

    shirts: 'Replaces selected shirt',

    jackets: 'Replaces selected jacket',

    pants: 'Replaces selected pants',

    shoes: 'Replaces selected shoes',

  };



  return labels[categoryId] || 'Select an item';

}


