export const PDP_COLORS = {
  background: '#070B17',
  card: '#111827',
  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  border: 'rgba(255,255,255,0.08)',
};

export const PDP_CARD_CLASS =
  'rounded-3xl border border-white/[0.08] bg-[#111827]/90 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl';

export const PDP_GLASS_CLASS =
  'rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md';

export const PDP_MOTION = {
  page: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.35 } },
  lift: { whileHover: { y: -4, scale: 1.01 }, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};
