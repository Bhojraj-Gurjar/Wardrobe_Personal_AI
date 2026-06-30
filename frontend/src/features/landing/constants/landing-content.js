import { ROUTES } from '@/constants/routes';

export const LANDING_NAV = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Enterprise', href: '#pricing' },
];

export const LANDING_STATS = [
  { value: '50K+', label: 'Active Users', color: 'text-primary' },
  { value: '98%', label: 'Match Accuracy', color: 'text-emerald-400' },
  { value: '2.4M', label: 'Outfits Curated', color: 'text-amber-400' },
  { value: '4.9★', label: 'App Store Rating', color: 'text-sky-400' },
];

export const LANDING_FEATURES = [
  {
    id: 'fashion-dna',
    title: 'AI Fashion DNA',
    description:
      'A full style profile built from your preferences, purchase history, and biometric scans. The deeper the data, the smarter the matches.',
    badge: 'Core Feature',
    badgeClass: 'border-primary/40 bg-primary/15 text-primary',
    accentClass: 'text-primary',
    icon: 'sparkles',
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&h=600&q=80',
    featured: true,
    href: ROUTES.AUTH.REGISTER,
  },
  {
    id: 'face-analysis',
    title: 'Face Analysis',
    description:
      'Our AI maps your face shape, skin tone, and features to recommend necklines, collars, and accessories that truly flatter.',
    badge: 'AI Scan',
    badgeClass: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    accentClass: 'text-sky-400',
    icon: 'scan',
    href: ROUTES.FACE.ANALYSIS,
  },
  {
    id: 'body-analysis',
    title: 'Body Analysis',
    description:
      'Precision body measurements via your camera. Get outfits that fit your actual proportions, not a generic size chart.',
    badge: 'Smart Fit',
    badgeClass: 'border-primary/40 bg-primary/15 text-primary',
    accentClass: 'text-primary',
    icon: 'ruler',
    href: ROUTES.BODY.ANALYSIS,
  },
  {
    id: 'virtual-tryon',
    title: 'Virtual Try-On',
    description:
      'See outfits on your own body before buying. Photorealistic AI rendering with your face and measurements.',
    badge: 'Try Before Buy',
    badgeClass: 'border-pink-500/40 bg-pink-500/15 text-pink-300',
    accentClass: 'text-pink-400',
    icon: 'camera',
    image:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&h=500&q=80',
    href: ROUTES.AVATAR.HOME,
  },
  {
    id: 'ai-stylist',
    title: 'AI Stylist Chat',
    description:
      'A real-time stylist powered by the latest fashion intelligence. Ask anything from color pairings to capsule wardrobe advice.',
    badge: 'Always On',
    badgeClass: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    accentClass: 'text-amber-400',
    icon: 'message',
    href: ROUTES.AI.STYLIST,
  },
  {
    id: 'seasonal-trends',
    title: 'Seasonal Trends',
    description:
      'Live trend data filtered through your personal DNA — see only the trends that actually work for your style type.',
    badge: 'Live Data',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    accentClass: 'text-emerald-400',
    icon: 'trending',
    href: ROUTES.AI.RECOMMENDATIONS,
  },
];

export const LANDING_PROCESS = [
  {
    step: '01',
    title: 'Build your Style Profile',
    description:
      'Answer a short lifestyle questionnaire and let our AI establish your style baseline — your budget, occasions, and aesthetic direction.',
    image:
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&h=800&q=80',
    accent: 'text-primary',
  },
  {
    step: '02',
    title: 'Scan Face & Body',
    description:
      'Our AI maps your facial features and body proportions to understand what cuts, necklines, and silhouettes will flatter you most.',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&h=800&q=80',
    accent: 'text-primary',
  },
  {
    step: '03',
    title: 'Get Curated Recommendations',
    description:
      'Receive daily outfit picks and brand suggestions that match your DNA. Every recommendation improves as you interact with the app.',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&h=800&q=80',
    accent: 'text-teal-400',
  },
];

export const LANDING_TESTIMONIALS = [
  {
    quote:
      'Wardrobe AI completely changed how I shop. I stopped buying clothes that looked good on the rack but wrong on me.',
    name: 'Priya Sharma',
    role: 'Fashion Blogger · Mumbai',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
  },
  {
    quote:
      'The face and body analysis is scary accurate. My match scores went from random guesses to 90%+ every time.',
    name: 'Arjun Mehta',
    role: 'Product Designer · Bangalore',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
  },
  {
    quote:
      'I save hours every week. The AI stylist knows my wardrobe better than I do — and the virtual try-on is magic.',
    name: 'Sneha Reddy',
    role: 'Marketing Lead · Hyderabad',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80',
  },
];

export const LANDING_PRESS = ['Vogue', 'GQ', 'TechCrunch', 'Wired', 'Forbes', 'WWD'];

export const LANDING_PRICING = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'Explore your Fashion DNA and get started.',
    features: [
      'Fashion DNA analysis',
      '50 wardrobe items',
      '5 AI recommendations / week',
      'Basic face analysis',
      'Community style feed',
    ],
    checkClass: 'text-dashboard-muted',
    highlighted: false,
    cta: 'Get Started Free',
    href: ROUTES.AUTH.REGISTER,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹1,499',
    period: '/ month',
    description: 'The full AI fashion experience, no limits.',
    features: [
      'Everything in Starter',
      'Unlimited wardrobe items',
      'Unlimited AI recommendations',
      'Advanced face & body analysis',
      'Virtual try-on (unlimited)',
      'AI Stylist Chat (24/7)',
    ],
    checkClass: 'text-primary',
    highlighted: true,
    badge: 'Most Popular',
    cta: 'Start for Free',
    href: ROUTES.AUTH.REGISTER,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '₹3,999',
    period: '/ month',
    description: 'Personal styling at the highest level.',
    features: [
      'Everything in Premium',
      '1-on-1 human stylist sessions',
      'Priority AI processing',
      'Early trend access',
      'Personal closet management',
      'Brand partnership discounts',
    ],
    checkClass: 'text-amber-400',
    highlighted: false,
    cta: 'Get Started',
    href: ROUTES.AUTH.REGISTER,
  },
];

export const LANDING_FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Virtual Try-On', href: ROUTES.AVATAR.HOME },
    { label: 'AI Stylist', href: ROUTES.AI.STYLIST },
  ],
  company: [
    { label: 'About', href: '#features' },
    { label: 'Blog', href: '#features' },
    { label: 'Press', href: '#features' },
    { label: 'Careers', href: '#features' },
    { label: 'Contact', href: '#features' },
  ],
  legal: [
    { label: 'Privacy', href: '#features' },
    { label: 'Terms', href: '#features' },
    { label: 'Cookies', href: '#features' },
    { label: 'GDPR', href: '#features' },
  ],
};
