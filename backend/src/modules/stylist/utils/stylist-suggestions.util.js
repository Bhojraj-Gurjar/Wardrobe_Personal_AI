import { STYLIST_INTENTS } from '../constants/stylist-intents.constants';

export function buildSuggestedQuestions(intent, context = {}) {
  const name = context.displayName || 'there';
  const base = [
    'What colors suit me?',
    'Build a casual outfit',
    'Show outfits under ₹5000',
    'What should I wear for a wedding?',
  ];

  const byIntent = {
    [STYLIST_INTENTS.GREETING]: [
      'What colors suit me?',
      'Build a wedding outfit',
      'Recommend shoes for my style',
      'Show outfits under ₹3000',
      'What fits my body shape?',
    ],
    [STYLIST_INTENTS.COLOR_ADVICE]: [
      'Build an outfit with these colors',
      'What suits my face shape?',
      'Show summer outfit ideas',
    ],
    [STYLIST_INTENTS.OUTFIT_GENERATION]: [
      'Make it cheaper',
      'Suggest matching shoes',
      'Show a formal version',
    ],
    [STYLIST_INTENTS.OCCASION_STYLING]: [
      'Make it cheaper',
      'Suggest accessories',
      'What colors work for this occasion?',
    ],
    [STYLIST_INTENTS.BUDGET_STYLING]: [
      'Add footwear under the same budget',
      'Show a formal option',
      'What colors suit me?',
    ],
    [STYLIST_INTENTS.BODY_STYLE_GUIDANCE]: [
      'Build an outfit for my body type',
      'Recommend shirts for my build',
      'What colors suit me?',
    ],
    [STYLIST_INTENTS.FACE_STYLE_GUIDANCE]: [
      'What colors suit my skin tone?',
      'Best necklines for my face shape',
      'Build a smart casual outfit',
    ],
    [STYLIST_INTENTS.FOOTWEAR_RECOMMENDATION]: [
      'Build a full outfit with these shoes',
      'Show casual shoe options',
    ],
    [STYLIST_INTENTS.FOLLOW_UP_MODIFY]: [
      'Use black instead',
      'Make it more formal',
      'Add accessories',
    ],
  };

  return byIntent[intent?.type] || base;
}
