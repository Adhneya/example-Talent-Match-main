'use client';

import { useReducedMotion } from 'motion/react';

/**
 * Gradient border glow (coral → navy, 3s loop) — the ring itself is CSS
 * (`.glow__ring` in globals.css) because it's a decorative loop, not
 * scroll-driven. Reduced motion is read from the hook, which freezes the ring.
 *
 * Usage: put `useGlowClass()` on a positioned, rounded wrapper and render
 * <GlowRing /> as its last child.
 */
export function useGlowClass() {
  return useReducedMotion() ? 'glow glow--still' : 'glow';
}

export function GlowRing() {
  return <span className="glow__ring" aria-hidden="true" />;
}
