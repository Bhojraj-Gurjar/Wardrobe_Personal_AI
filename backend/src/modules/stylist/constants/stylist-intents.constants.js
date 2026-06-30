export const STYLIST_INTENTS = {
  GREETING: 'GREETING',
  COLOR_ADVICE: 'COLOR_ADVICE',
  OUTFIT_GENERATION: 'OUTFIT_GENERATION',
  FOOTWEAR_RECOMMENDATION: 'FOOTWEAR_RECOMMENDATION',
  BUDGET_STYLING: 'BUDGET_STYLING',
  OCCASION_STYLING: 'OCCASION_STYLING',
  BODY_STYLE_GUIDANCE: 'BODY_STYLE_GUIDANCE',
  FACE_STYLE_GUIDANCE: 'FACE_STYLE_GUIDANCE',
  CLOSET_ADVICE: 'CLOSET_ADVICE',
  ACCESSORY_ADVICE: 'ACCESSORY_ADVICE',
  SEASONAL_STYLING: 'SEASONAL_STYLING',
  CATEGORY_REQUEST: 'CATEGORY_REQUEST',
  FOLLOW_UP_MODIFY: 'FOLLOW_UP_MODIFY',
  GENERAL_ADVICE: 'GENERAL_ADVICE',
};

export const THINKING_STEPS_BY_INTENT = {
  GREETING: ['Understanding your message…'],
  COLOR_ADVICE: [
    'Analyzing your style profile…',
    'Reviewing skin tone & Fashion DNA…',
    'Building color recommendations…',
  ],
  OUTFIT_GENERATION: [
    'Analyzing your style profile…',
    'Checking Fashion DNA…',
    'Reviewing body proportions…',
    'Matching catalog products…',
    'Building your outfit…',
  ],
  OCCASION_STYLING: [
    'Detecting occasion…',
    'Checking Fashion DNA…',
    'Reviewing body & face analysis…',
    'Matching catalog products…',
    'Building occasion look…',
  ],
  BUDGET_STYLING: [
    'Analyzing budget constraints…',
    'Scanning catalog products…',
    'Filtering by price…',
    'Building affordable look…',
  ],
  FOOTWEAR_RECOMMENDATION: [
    'Reviewing your profile…',
    'Matching footwear from catalog…',
  ],
  BODY_STYLE_GUIDANCE: [
    'Loading body analysis…',
    'Reviewing proportions…',
    'Generating fit advice…',
  ],
  FACE_STYLE_GUIDANCE: [
    'Loading face analysis…',
    'Reviewing face shape & skin tone…',
    'Generating style advice…',
  ],
  CLOSET_ADVICE: [
    'Checking your personal closet…',
    'Reviewing wishlist & orders…',
  ],
  SEASONAL_STYLING: [
    'Detecting season…',
    'Matching seasonal catalog picks…',
  ],
  FOLLOW_UP_MODIFY: [
    'Reviewing previous outfit…',
    'Applying your changes…',
  ],
  DEFAULT: [
    'Analyzing your message…',
    'Gathering your style profile…',
    'Preparing recommendations…',
  ],
};
