import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository } from '../../products/repositories/product.repository';
import {
  buildBodyProductHaystack,
  computeBodyScore,
  resolveBodyTraits,
} from '../../recommendations/utils/body-score.util';
import { formatBodyAnalysisRecord } from '../utils/body-analysis.mapper';

const SECTION_FILTERS = {
  tops: {
    subcategories: ['men-t-shirts', 'men-shirts', 't-shirts', 'shirts'],
    categories: ['MEN', 'CASUAL', 'FORMAL'],
  },
  bottoms: {
    subcategories: ['men-jeans', 'men-trousers', 'pants', 'jeans', 'trousers'],
    categories: ['MEN', 'CASUAL'],
  },
  outerwear: {
    subcategories: ['men-jackets', 'jackets', 'hoodies'],
    categories: ['MEN', 'CASUAL'],
  },
  formal: {
    subcategories: ['men-suits', 'suits', 'men-shirts', 'shirts'],
    categories: ['MEN', 'FORMAL'],
  },
  casual: {
    subcategories: ['men-t-shirts', 'men-shirts', 'men-jackets', 't-shirts'],
    categories: ['MEN', 'CASUAL'],
  },
  footwear: {
    subcategories: ['shoes', 'sneakers', 'boots', 'loafers'],
    categories: ['FOOTWEAR', 'MEN'],
  },
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/_/g, ' ');
}

function formatProduct(product) {
  const image = product.images?.[0];

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    category: product.category,
    subcategory: product.subcategory,
    fitType: product.fit_type || product.fitType,
    imageUrl: image?.url || image?.image_url || null,
  };
}

function matchesSection(product, sectionId) {
  const filters = SECTION_FILTERS[sectionId];
  if (!filters) {
    return false;
  }

  const haystack = buildBodyProductHaystack(product);
  const subcategory = normalizeText(product.subcategory);
  const category = normalizeText(product.category);

  const subcategoryMatch = filters.subcategories.some(
    (token) => subcategory.includes(normalizeText(token)),
  );
  const categoryMatch = filters.categories.some(
    (token) => category.includes(normalizeText(token)),
  );

  if (subcategoryMatch || categoryMatch) {
    return true;
  }

  return filters.subcategories.some((token) => haystack.includes(normalizeText(token)));
}

function scoreKeywordMatch(haystack, keywords = []) {
  let score = 0;

  for (const keyword of keywords) {
    const normalized = normalizeText(keyword);
    if (normalized && haystack.includes(normalized)) {
      score += 12;
    }
  }

  return score;
}

function scoreProduct(product, bodyAnalysis, profile, keywords = []) {
  const bodyResult = computeBodyScore(bodyAnalysis, product, profile);
  const haystack = buildBodyProductHaystack(product);
  const keywordScore = scoreKeywordMatch(haystack, keywords);
  const raw = bodyResult.score + keywordScore;
  const confidence = Math.max(55, Math.min(98, Math.round(52 + raw * 1.25)));

  return {
    product: formatProduct(product),
    confidence,
    bodyScore: bodyResult.score,
    matchReason: keywordScore > 0
      ? 'Matches your body profile and recommended style keywords'
      : 'Scored for your body type and measurements',
  };
}

export @Injectable()
class BodyFitProductsService {
  constructor(@Inject(ProductRepository) productRepository) {
    this.productRepository = productRepository;
  }

  async attachProductsToFitGuide(record, profile = null, fitProfile = null) {
    const profileData = fitProfile || record?.fit_profile;
    if (!profileData?.sections?.length) {
      return profileData;
    }

    const bodyAnalysis = formatBodyAnalysisRecord(record);
    const [products] = await this.productRepository.findMany({
      page: 1,
      limit: 200,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    if (!products?.length) {
      return profileData;
    }

    const traits = resolveBodyTraits(bodyAnalysis, profile);
    if (!traits.bodyType && !traits.measurements) {
      return profileData;
    }

    const sections = profileData.sections.map((section) => {
      const keywords = [
        ...(section.productKeywords || []),
        ...(Array.isArray(section.recommendations)
          ? section.recommendations.map((item) => (
            typeof item === 'string' ? item : item?.name
          ))
          : []),
      ].filter(Boolean);

      const candidates = products
        .filter((product) => matchesSection(product, section.id))
        .map((product) => scoreProduct(product, bodyAnalysis, profile, keywords))
        .sort((a, b) => b.confidence - a.confidence);

      const topProducts = candidates.slice(0, 3).map((entry) => ({
        ...entry.product,
        matchConfidence: entry.confidence,
        matchReason: entry.matchReason,
      }));

      return {
        ...section,
        products: topProducts,
      };
    });

    return {
      ...profileData,
      sections,
    };
  }
}
