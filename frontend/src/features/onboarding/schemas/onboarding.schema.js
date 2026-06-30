import { z } from 'zod';

const genderEnum = z.enum([
  'MALE',
  'FEMALE',
  'OTHER',
  'PREFER_NOT_TO_SAY',
]);

const bodyTypeEnum = z.enum([
  'SLIM',
  'ATHLETIC',
  'AVERAGE',
  'CURVY',
  'PLUS_SIZE',
]);

const skinToneEnum = z.enum([
  'FAIR',
  'LIGHT',
  'MEDIUM',
  'OLIVE',
  'TAN',
  'BROWN',
  'DARK',
]);

export const personalDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  gender: genderEnum,
  age: z.coerce
    .number({ invalid_type_error: 'Enter a valid age' })
    .int()
    .min(13, 'Minimum age is 13')
    .max(120, 'Maximum age is 120'),
  height: z.coerce
    .number({ invalid_type_error: 'Enter a valid height' })
    .min(50, 'Minimum height is 50 cm')
    .max(300, 'Maximum height is 300 cm'),
  weight: z.coerce
    .number({ invalid_type_error: 'Enter a valid weight' })
    .min(20, 'Minimum weight is 20 kg')
    .max(500, 'Maximum weight is 500 kg'),
  country: z.string().min(1, 'Country is required').max(120),
  language: z.string().min(1, 'Language is required').max(80),
  body_type: bodyTypeEnum.optional().or(z.literal('')),
  skin_tone: skinToneEnum.optional().or(z.literal('')),
});

export const lifestyleSchema = z.object({
  occupation: z.enum(['STUDENT', 'EMPLOYEE', 'BUSINESS_OWNER', 'FREELANCER']),
  shopping_frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']),
  budget_preference: z.enum(['ECONOMY', 'MID_RANGE', 'PREMIUM', 'LUXURY']),
  preferred_categories: z
    .array(z.enum(['CASUAL', 'FORMAL', 'SPORTS', 'ETHNIC', 'LUXURY']))
    .min(1, 'Select at least one category'),
});

export const styleSurveySchema = z.object({
  favorite_colors: z.array(z.string()).min(1, 'Select at least one color'),
  favorite_brands: z.array(z.string()).min(1, 'Select at least one brand'),
  fashion_influencers: z
    .array(z.string())
    .min(1, 'Select at least one inspiration'),
  style_inspiration: z.array(z.string()).optional(),
  preferred_outfit_types: z.array(z.string()).optional(),
});

export function toPersonalDetailsPayload(values) {
  const payload = {
    name: values.name.trim(),
    gender: values.gender,
    age: values.age,
    height: values.height,
    weight: values.weight,
    country: values.country.trim(),
    language: values.language.trim(),
  };

  if (values.body_type) {
    payload.body_type = values.body_type;
  }

  if (values.skin_tone) {
    payload.skin_tone = values.skin_tone;
  }

  return payload;
}

export function toPreferencesPayload(lifestyle, style) {
  const budgetRanges = {
    ECONOMY: { minBudget: 0, maxBudget: 75 },
    MID_RANGE: { minBudget: 50, maxBudget: 200 },
    PREMIUM: { minBudget: 150, maxBudget: 500 },
    LUXURY: { minBudget: 300, maxBudget: 2000 },
  };
  const budget = budgetRanges[lifestyle.budget_preference] || {};

  return {
    occupation: lifestyle.occupation,
    shopping_frequency: lifestyle.shopping_frequency,
    budget_preference: lifestyle.budget_preference,
    minBudget: budget.minBudget,
    maxBudget: budget.maxBudget,
    preferred_categories: lifestyle.preferred_categories,
    favorite_colors: style.favorite_colors,
    favorite_brands: style.favorite_brands,
    fashion_influencers: style.fashion_influencers,
    ...(style.style_inspiration?.length
      ? { style_inspiration: style.style_inspiration }
      : {}),
    ...(style.preferred_outfit_types?.length
      ? { preferred_outfit_types: style.preferred_outfit_types }
      : {}),
  };
}
