'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EMPTY_LAYERED_OUTFIT } from '../constants/avatar-layer.constants';
import {
  buildLayeredOutfitFromApi,
  buildLayeredOutfitPayload,
  clearCategorySelection,
  getOutfitSlotForCategory,
  mapApiProductToLayerItem,
  replaceCategorySelection,
} from '../utils/avatar-layer-engine';
import {
  calculateOutfitTotal,
  buildCatalogFromApi,
  randomizeOutfit,
} from '../utils/outfit-builder.util';

function buildRestoreKey(outfitRecord) {
  if (!outfitRecord?.id) {
    return null;
  }

  return `${outfitRecord.id}:${outfitRecord.updatedAt || 'initial'}`;
}

export function useOutfitBuilder({
  apiProducts = [],
  initialOutfitRecord = null,
  onSaveLook,
} = {}) {
  const catalog = useMemo(
    () => buildCatalogFromApi(apiProducts),
    [apiProducts],
  );

  const [activeCategory, setActiveCategory] = useState('t-shirts');
  const [outfit, setOutfit] = useState(() => (
    initialOutfitRecord
      ? buildLayeredOutfitFromApi(initialOutfitRecord)
      : { ...EMPTY_LAYERED_OUTFIT }
  ));
  const [skinTone, setSkinTone] = useState(null);
  const [hairColor, setHairColor] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(initialOutfitRecord?.updatedAt || null);
  const restoredOutfitKeyRef = useRef(buildRestoreKey(initialOutfitRecord));

  useEffect(() => {
    const restoreKey = buildRestoreKey(initialOutfitRecord);

    if (!restoreKey || restoredOutfitKeyRef.current === restoreKey) {
      return;
    }

    restoredOutfitKeyRef.current = restoreKey;
    setOutfit(buildLayeredOutfitFromApi(initialOutfitRecord));
    setLastSavedAt(initialOutfitRecord.updatedAt || null);
  }, [initialOutfitRecord]);

  const totalValue = useMemo(
    () => calculateOutfitTotal(outfit),
    [outfit],
  );

  const selectProduct = useCallback((categoryId, product) => {
    const slot = getOutfitSlotForCategory(categoryId);

    if (!slot || !product) {
      return;
    }

    const layerItem = mapApiProductToLayerItem(product, categoryId);

    if (!layerItem) {
      return;
    }

    setOutfit((current) => replaceCategorySelection(current, categoryId, layerItem));
  }, []);

  const unselectCategory = useCallback((categoryId) => {
    const slot = getOutfitSlotForCategory(categoryId);

    if (!slot) {
      return;
    }

    setOutfit((current) => clearCategorySelection(current, categoryId));
  }, []);

  const handleRandomize = useCallback(() => {
    setOutfit((current) => randomizeOutfit(catalog, current));
  }, [catalog]);

  const handleSaveLook = useCallback(async () => {
    const payload = buildLayeredOutfitPayload(outfit);

    if (!onSaveLook) {
      return {
        outfit,
        payload,
        totalValue,
        savedAt: null,
      };
    }

    const savedOutfit = await onSaveLook(payload);
    const savedAt = savedOutfit?.updatedAt || new Date().toISOString();

    if (savedOutfit) {
      restoredOutfitKeyRef.current = buildRestoreKey(savedOutfit);
      setOutfit(buildLayeredOutfitFromApi(savedOutfit));
      setLastSavedAt(savedAt);
    } else {
      setLastSavedAt(savedAt);
    }

    return {
      outfit,
      payload,
      totalValue: savedOutfit?.totalPrice ?? totalValue,
      savedAt,
    };
  }, [onSaveLook, outfit, totalValue]);

  const applySuggestedOutfit = useCallback((suggestion) => {
    if (suggestion?.outfit) {
      setOutfit(suggestion.outfit);
    }

    if (suggestion?.activeCategory) {
      setActiveCategory(suggestion.activeCategory);
    }

    if (suggestion?.skinTone) {
      setSkinTone(String(suggestion.skinTone).toLowerCase().replace(/\s+/g, '-'));
    }

    if (suggestion?.hairColor) {
      setHairColor(String(suggestion.hairColor).toLowerCase().replace(/\s+/g, '-'));
    }
  }, []);

  const toggleCompare = useCallback(() => {
    setCompareMode((current) => !current);
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialOutfitRecord) {
      return hasLocalOutfitSelections(outfit);
    }

    const saved = buildLayeredOutfitPayload(buildLayeredOutfitFromApi(initialOutfitRecord));
    const current = buildLayeredOutfitPayload(outfit);

    return JSON.stringify(saved) !== JSON.stringify(current);
  }, [initialOutfitRecord, outfit]);

  return {
    catalog,
    activeCategory,
    setActiveCategory,
    outfit,
    setOutfit,
    skinTone,
    setSkinTone,
    hairColor,
    setHairColor,
    compareMode,
    toggleCompare,
    totalValue,
    lastSavedAt,
    hasUnsavedChanges,
    selectProduct,
    unselectCategory,
    handleRandomize,
    handleSaveLook,
    applySuggestedOutfit,
  };
}

function hasLocalOutfitSelections(outfit) {
  return Boolean(
    outfit?.tshirt?.id
    || outfit?.shirt?.id
    || outfit?.jacket?.id
    || outfit?.pants?.id
    || outfit?.shoes?.id,
  );
}
