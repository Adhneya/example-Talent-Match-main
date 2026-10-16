/**
 * Reward motion for the two "spark" moments — Interested (#7) and a match (#8).
 * Plain DOM + Web Animations on a fixed, aria-hidden overlay, so it never
 * touches React state or layout. Coral appears here and nowhere decorative:
 * it is reserved for spark moments. Everything is a no-op under reduced motion.
 */

const HEART_PATH =
  'm11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z';
const heartSvg = (size: number) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${HEART_PATH}"/></svg>`;

/** Palette only (globals.css :root). */
const SPARKS = ['var(--coral)', 'var(--highlight)', 'var(--lilac-2)', 'var(--coral-pressed)'];
const CONFETTI = ['var(--coral)', 'var(--highlight)', 'var(--lilac-2)', 'var(--lilac-3)', '#fff'];

export function prefersReducedMotion() {
  return typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function layer() {
  let el = document.getElementById('fx-layer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fx-layer';
    el.className = 'fx-layer';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

function piece(className: string, x: number, y: number, html = '') {
  const el = document.createElement('span');
  el.className = className;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.innerHTML = html;
  layer().appendChild(el);
  return el;
}

const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/** A short tap on touch devices — the physical half of the reward. */
export function tick() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator && window.matchMedia('(pointer: coarse)').matches) {
    navigator.vibrate(12);
  }
}

/** Hearts and sparks bursting outward from a point. */
export function heartBurst(x: number, y: number, count = 12) {
  if (prefersReducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const heart = i % 3 === 0;
    const el = heart
      ? piece('fx-heart', x, y, heartSvg(14 + Math.round(Math.random() * 8)))
      : piece('fx-spark', x, y);
    el.style.color = SPARKS[i % SPARKS.length];
    el.style.background = heart ? 'none' : SPARKS[i % SPARKS.length];
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 46 + Math.random() * 54;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 18;
    el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy + 26}px)) scale(0.7)`, opacity: 0 },
      ],
      { duration: 720 + Math.random() * 220, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
    ).onfinish = () => el.remove();
  }
}

/** The visible Saved nav item (top nav from 768px, bottom nav below). */
function savedTarget() {
  return Array.from(document.querySelectorAll<HTMLElement>('a[href="/saved"]')).find(
    (el) => el.getClientRects().length > 0,
  );
}

/** Briefly scale an element up and back — used on the Saved tab and its badge. */
export function bump(el: Element | null | undefined) {
  if (!el || prefersReducedMotion()) return;
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], {
    duration: 420,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  });
}

/**
 * Interested: a heart token arcs from the card into the Saved tab, which bumps
 * on arrival — so "Interested saves the role" is shown, not just written.
 */
export function flyToSaved(from: DOMRect) {
  const target = savedTarget();
  if (!target) return;
  if (prefersReducedMotion()) return;
  const to = (target.querySelector('svg') ?? target).getBoundingClientRect();
  const a = center(from);
  const b = center(to);
  const el = piece('fx-token', 0, 0, heartSvg(18));
  const mid = { x: (a.x + b.x) / 2 + (b.x > a.x ? -40 : 40), y: Math.min(a.y, b.y) - 90 };
  el.animate(
    [
      { transform: `translate(${a.x}px, ${a.y}px) translate(-50%, -50%) scale(0.6)`, opacity: 0 },
      { transform: `translate(${a.x}px, ${a.y}px) translate(-50%, -50%) scale(1.15)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${mid.x}px, ${mid.y}px) translate(-50%, -50%) scale(0.95)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${b.x}px, ${b.y}px) translate(-50%, -50%) scale(0.4)`, opacity: 0.85 },
    ],
    { duration: 720, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' },
  ).onfinish = () => {
    el.remove();
    bump(target);
    bump(target.querySelector('.badge'));
  };
}

/** Confetti for a match: palette paper falling from a point. */
export function confetti(x: number, y: number, count = 42) {
  if (prefersReducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const el = piece('fx-confetti', x, y);
    el.style.background = CONFETTI[i % CONFETTI.length];
    if (i % 4 === 0) el.style.borderRadius = '50%';
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
    const power = 140 + Math.random() * 220;
    const dx = Math.cos(angle) * power;
    const peak = Math.sin(angle) * power;
    const fall = 260 + Math.random() * 260;
    const spin = (Math.random() - 0.5) * 900;
    el.animate(
      [
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${peak}px)) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${peak + fall}px)) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: 1500 + Math.random() * 700, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)', delay: Math.random() * 120, fill: 'backwards' },
    ).onfinish = () => el.remove();
  }
}
