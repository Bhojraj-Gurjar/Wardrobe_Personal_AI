'use client';

import { useCallback, useState } from 'react';
import { useRecommendationsQuery } from '@/features/ai/hooks/use-recommendations';
import { useFashionDnaQuery } from '@/features/fashion-dna/hooks';
import { useFaceAnalysisQuery } from '@/features/face-analysis/hooks';
import { useBodyAnalysisQuery } from '@/features/body-analysis/hooks';
import { suggestCompleteOutfit } from '../utils/ai-outfit-suggest.util';

export function useAiOutfitSuggest({ catalog, onSuggested }) {
  const { data: recommendations, isFetching: isLoadingRecommendations } =
    useRecommendationsQuery({ limit: 24 });
  const { data: fashionDna } = useFashionDnaQuery();
  const { data: faceAnalysis } = useFaceAnalysisQuery();
  const { data: bodyAnalysis } = useBodyAnalysisQuery();
  const [isSuggesting, setIsSuggesting] = useState(false);

  const suggestOutfit = useCallback(async () => {
    setIsSuggesting(true);

    try {
      const suggestion = suggestCompleteOutfit({
        recommendations,
        fashionDna,
        faceAnalysis,
        bodyAnalysis,
        catalog,
      });

      onSuggested?.(suggestion);
      return suggestion;
    } finally {
      setIsSuggesting(false);
    }
  }, [
    bodyAnalysis,
    catalog,
    faceAnalysis,
    fashionDna,
    onSuggested,
    recommendations,
  ]);

  return {
    suggestOutfit,
    isSuggesting: isSuggesting || isLoadingRecommendations,
    hasPersonalization: Boolean(fashionDna || faceAnalysis || bodyAnalysis),
  };
}
