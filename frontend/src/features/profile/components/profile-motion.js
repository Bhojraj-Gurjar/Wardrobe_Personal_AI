'use client';

import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

export function ProfileMotionSection({
  children,
  className,
  delay = 0,
  id,
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

export function ProfileMotionGridItem({ children, className, index = 0 }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: EASE }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({ value, className }) {
  const reduceMotion = useReducedMotion();
  const numeric = Number(value) || 0;

  if (reduceMotion) {
    return <span className={className}>{numeric}</span>;
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {numeric}
      </motion.span>
    </motion.span>
  );
}

export function AnimatedProgressBar({ percent, className, barClassName }) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={className}>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
        {reduceMotion ? (
          <div
            className={barClassName}
            style={{ width: `${clamped}%` }}
          />
        ) : (
          <motion.div
            className={barClassName}
            initial={{ width: 0 }}
            whileInView={{ width: `${clamped}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
          />
        )}
      </div>
    </div>
  );
}
