export const STYLIST_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
export const STYLIST_MAX_HISTORY = 20;
export const STYLIST_MAX_PRODUCTS = 6;

export const EXAMPLE_QUERIES = [
  'What should I wear for an interview?',
  'Suggest wedding attire.',
  'Create an outfit under ₹5000.',
  'What colors suit my skin tone?',
  'Build a casual weekend look.',
  'Recommend accessories for a formal event.',
  'What to wear for a first date?',
  'Office wear ideas for summer.',
  'Gym outfit suggestions.',
  'Capsule wardrobe under ₹8000.',
];

export const OCCASION_KEYWORDS = {
  interview: ['interview', 'job', 'office', 'work', 'professional', 'corporate', 'meeting'],
  wedding: ['wedding', 'marriage', 'reception', 'ceremony', 'sangeet', 'engagement'],
  party: ['party', 'date', 'dinner', 'night out', 'celebration', 'birthday'],
  casual: ['casual', 'weekend', 'everyday', 'relaxed', 'brunch'],
  gym: ['gym', 'workout', 'fitness', 'sport', 'activewear', 'training'],
  formal: ['formal', 'black tie', 'gala', 'award'],
};

export const OCCASION_CATEGORIES = {
  interview: ['shirts', 'men-shirts', 'trousers', 'men-trousers', 'blazer', 'jackets'],
  wedding: ['shirts', 'suits', 'jackets', 'men-suits'],
  party: ['shirts', 'jackets', 'jeans', 'men-jeans'],
  casual: ['t-shirts', 'men-t-shirts', 'jeans', 'sneakers'],
  gym: ['t-shirts', 'men-t-shirts', 'shorts', 'sneakers'],
  formal: ['suits', 'shirts', 'men-shirts', 'trousers'],
};

export const OCCASION_COLORS = {
  interview: ['navy', 'charcoal', 'white', 'light blue', 'grey'],
  wedding: ['maroon', 'gold', 'cream', 'emerald', 'navy'],
  party: ['black', 'burgundy', 'emerald', 'navy', 'white'],
  casual: ['olive', 'white', 'denim', 'beige', 'navy'],
  gym: ['black', 'grey', 'navy', 'red', 'white'],
  formal: ['black', 'navy', 'charcoal', 'white'],
};

export const OCCASION_ACCESSORIES = {
  interview: ['Leather belt', 'Classic watch', 'Oxford shoes', 'Minimal cufflinks'],
  wedding: ['Pocket square', 'Statement watch', 'Dress shoes', 'Tie or bow tie'],
  party: ['Statement watch', 'Slim belt', 'Chelsea boots or loafers', 'Subtle chain'],
  casual: ['Sneakers', 'Canvas belt', 'Crossbody bag', 'Sunglasses'],
  gym: ['Training shoes', 'Sports watch', 'Gym bag', 'Performance socks'],
  formal: ['Silk tie', 'Cufflinks', 'Patent leather shoes', 'Dress watch'],
};
