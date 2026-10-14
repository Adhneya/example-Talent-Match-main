'use client';

import { useEffect, useRef } from 'react';
import s from './landing.module.css';

/**
 * Generative growing tree — fixed, full-viewport background for the landing page.
 * A trunk grows, branches spawn recursively, the canopy sways in the wind; the
 * cursor anywhere on the page is wind, a click/tap on empty space shakes it;
 * then it fades and regrows.
 *
 * Native Canvas 2D: no iframe, no third-party scripts. Pauses in hidden tabs;
 * with reduced motion it renders one still, fully grown tree.
 */

type Branch = {
  parent: Branch | null;
  angle: number; // rest angle (radians)
  length: number;
  width: number;
  depth: number;
  progress: number; // 0 → 1 growth
  speed: number; // progress per ms
  spawned: boolean;
  swayPhase: number;
  swayAmp: number;
  curve: number;
  bud: boolean; // only some twigs carry a glowing bud
  // per-frame geometry
  sway: number;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
};

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number; rate: number; phase: number };

// Deck palette, trunk to tips: Ink → navy → lilac (#8891C9 → #AEB6E4 → #CFD6F5). Buds and motes are coral.
const PALETTE: [number, number, number][] = [
  [27, 33, 64],
  [47, 60, 126],
  [136, 145, 201],
  [174, 182, 228],
  [207, 214, 245],
];
const CORAL = '249, 97, 103';

const MAX_DEPTH = 9;
const HOLD_MS = 7000;
const FADE_MS = 1800;
const WAIT_MS = 700;
const PARTICLES = 40;
// Sections carry tabindex="-1" for in-page focus, so only positive/zero tabindex counts as interactive.
const INTERACTIVE = 'a, button, input, textarea, select, label, summary, [role="button"], [tabindex]:not([tabindex="-1"])';

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function colorAt(depth: number, alpha: number) {
  const t = (depth / MAX_DEPTH) * (PALETTE.length - 1);
  const i = Math.min(PALETTE.length - 2, Math.floor(t));
  const f = t - i;
  const [r0, g0, b0] = PALETTE[i];
  const [r1, g1, b1] = PALETTE[i + 1];
  return `rgba(${lerp(r0, r1, f) | 0}, ${lerp(g0, g1, f) | 0}, ${lerp(b0, b1, f) | 0}, ${alpha})`;
}

export default function GrowthTree() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!wrap || !canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0;
    let H = 0;
    let plantedW = 0;
    let plantedH = 0;
    let branches: Branch[] = [];
    let particles: Particle[] = [];
    let state: 'growing' | 'holding' | 'fading' | 'waiting' = 'growing';
    let stateMs = 0;
    let alpha = 1;
    let clock = 0; // animation time, only advances while running
    let last = 0;
    let raf = 0;
    let wind = 0;
    let windTarget = 0;
    let shake = 0;

    /* ── Tree construction ─────────────────────────────────── */
    function makeBranch(parent: Branch | null, angle: number, length: number, width: number, depth: number): Branch {
      return {
        parent,
        angle,
        length,
        width,
        depth,
        progress: 0,
        speed: 0.00042 * rand(0.9, 1.2) * (1 + depth * 0.12),
        spawned: false,
        swayPhase: rand(0, Math.PI * 2),
        swayAmp: 0.0016 * (depth + 1) * rand(0.7, 1.3),
        curve: rand(-0.05, 0.05) * (1 + depth * 0.1),
        bud: Math.random() < 0.35,
        sway: 0,
        sx: 0,
        sy: 0,
        ex: 0,
        ey: 0,
      };
    }

    function spawn(b: Branch) {
      if (b.depth >= MAX_DEPTH) return;
      let n = b.depth < 3 ? (Math.random() < 0.35 ? 3 : 2) : Math.random() < 0.2 ? 3 : 2;
      const prune = b.depth <= 3 ? 0 : b.depth <= 5 ? 0.12 : 0.3;
      if (Math.random() < prune) n -= 1;
      // Wide early forks give a broad, airy crown instead of a columnar one.
      const spread = b.depth < 2 ? rand(0.42, 0.62) : rand(0.4, 0.68);
      for (let i = 0; i < n; i++) {
        const offset =
          n === 1 ? rand(-0.25, 0.25) : n === 2 ? (i === 0 ? -1 : 1) * rand(0.24, spread) : (i - 1) * spread + rand(-0.1, 0.1);
        branches.push(
          makeBranch(b, b.angle + offset, b.length * rand(0.66, 0.8), Math.max(0.5, b.width * rand(0.52, 0.68)), b.depth + 1),
        );
      }
    }

    function plant() {
      plantedW = W;
      plantedH = H;
      // Trunk scales with the shorter side so the crown fits wide and tall viewports alike.
      const trunk = Math.min(H * rand(0.18, 0.21), W * 0.26);
      branches = [makeBranch(null, -Math.PI / 2 + rand(-0.05, 0.05), trunk, Math.min(16, Math.max(6, W * 0.012)), 0)];
      particles = Array.from({ length: PARTICLES }, () => particle(true));
      state = 'growing';
      stateMs = 0;
      alpha = 1;
    }

    function particle(anywhere: boolean): Particle {
      return {
        x: rand(W * 0.1, W * 0.9),
        y: anywhere ? rand(H * 0.1, H * 0.95) : rand(H * 0.6, H),
        vx: rand(-0.008, 0.008),
        vy: rand(-0.03, -0.008),
        r: rand(1, 3),
        a: rand(0.2, 0.5),
        life: anywhere ? rand(0, 1) : 0,
        rate: rand(0.00006, 0.00018),
        phase: rand(0, Math.PI * 2),
      };
    }

    /* ── Simulation ────────────────────────────────────────── */
    function grow(dt: number) {
      let done = true;
      // Index loop: spawn() appends, and new children should grow this same pass.
      for (let i = 0; i < branches.length; i++) {
        const b = branches[i];
        if (b.progress < 1) {
          b.progress = Math.min(1, b.progress + b.speed * dt);
          done = false;
        }
        if (b.progress >= 0.65 && !b.spawned) {
          b.spawned = true;
          spawn(b);
        }
      }
      return done;
    }

    function layout() {
      // Parents always precede children in `branches`, so one pass resolves every base point.
      for (const b of branches) {
        const own =
          Math.sin(clock * 0.0005 + b.swayPhase) * b.swayAmp +
          Math.sin(clock * 0.00031 + b.swayPhase * 1.7) * b.swayAmp * 0.6;
        b.sway = (b.parent ? b.parent.sway : 0) + own;
        const angle =
          b.angle + b.sway + wind * 0.035 * b.depth + Math.sin(clock * 0.015 + b.swayPhase * 3) * shake * 0.05 * b.depth;
        const len = b.length * easeOut(b.progress);
        b.sx = b.parent ? b.parent.ex : W / 2;
        b.sy = b.parent ? b.parent.ey : H + b.width * 0.5;
        const px = -Math.sin(angle);
        const py = Math.cos(angle);
        b.ex = b.sx + Math.cos(angle) * len + px * b.curve * len;
        b.ey = b.sy + Math.sin(angle) * len + py * b.curve * len;
      }
    }

    /* ── Rendering ─────────────────────────────────────────── */
    function draw() {
      ctx!.clearRect(0, 0, W, H);
      ctx!.lineCap = 'round';
      for (const b of branches) {
        if (b.progress <= 0) continue;
        const t = b.depth / MAX_DEPTH;
        const a = alpha * (b.depth <= 1 ? 0.95 : lerp(0.92, 0.45, t));
        const mx = (b.sx + b.ex) / 2 + (b.ey - b.sy) * b.curve * 0.6;
        const my = (b.sy + b.ey) / 2 - (b.ex - b.sx) * b.curve * 0.6;
        const width = lerp(b.width, b.width * 0.55, easeOut(b.progress));
        ctx!.beginPath();
        ctx!.moveTo(b.sx, b.sy);
        ctx!.quadraticCurveTo(mx, my, b.ex, b.ey);
        // Soft halo under a crisp core on trunk and limbs; twigs stay fine so the crown reads as branches.
        if (b.depth < 5) {
          ctx!.strokeStyle = colorAt(b.depth, a * 0.3);
          ctx!.lineWidth = width * 1.6;
          ctx!.stroke();
        }
        ctx!.strokeStyle = colorAt(b.depth, a);
        ctx!.lineWidth = width;
        ctx!.stroke();

        // Glowing buds on some of the outermost twigs.
        if (b.bud && b.depth === MAX_DEPTH && b.progress > 0.9) {
          const g = ctx!.createRadialGradient(b.ex, b.ey, 0, b.ex, b.ey, 3.5);
          g.addColorStop(0, `rgba(${CORAL}, ${0.6 * alpha})`);
          g.addColorStop(1, `rgba(${CORAL}, 0)`);
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(b.ex, b.ey, 3.5, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      for (const p of particles) {
        const fade = p.life < 0.15 ? p.life / 0.15 : p.life > 0.8 ? (1 - p.life) / 0.2 : 1;
        const a = p.a * fade * alpha;
        if (a < 0.01) continue;
        ctx!.fillStyle = `rgba(${CORAL}, ${a})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function stepParticles(dt: number) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += (p.vx + Math.sin(clock * 0.0008 + p.phase) * 0.012) * dt;
        p.y += p.vy * dt;
        p.life += p.rate * dt;
        if (p.life > 1 || p.y < -10) particles[i] = particle(false);
      }
    }

    function frame(now: number) {
      const dt = Math.min(50, last ? now - last : 16);
      last = now;
      clock += dt;
      wind += (windTarget - wind) * 0.05;
      shake = shake > 0.01 ? shake * 0.95 : 0;

      stateMs += dt;
      if (state === 'growing' && grow(dt)) {
        state = 'holding';
        stateMs = 0;
      } else if (state === 'holding' && stateMs > HOLD_MS) {
        state = 'fading';
        stateMs = 0;
      } else if (state === 'fading') {
        alpha = Math.max(0, 1 - stateMs / FADE_MS);
        if (stateMs >= FADE_MS) {
          state = 'waiting';
          stateMs = 0;
        }
      } else if (state === 'waiting' && stateMs > WAIT_MS) {
        plant();
      }

      layout();
      stepParticles(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf || reduced || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function paintStill() {
      while (!grow(1000)) {
        /* grow to completion */
      }
      particles = [];
      layout();
      draw();
    }

    /* ── Sizing (DPR-aware) ────────────────────────────────── */
    function resize() {
      const rect = wrap!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (Math.abs(rect.width - W) <= 1 && Math.abs(rect.height - H) <= 1 && branches.length) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = rect.width;
      H = rect.height;
      // Assigning canvas.width wipes the bitmap; the loop (or paintStill) repaints right after.
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Replant on real layout changes only — not when a mobile URL bar nudges the height.
      const replant = !branches.length || Math.abs(W - plantedW) > 1 || Math.abs(H - plantedH) > plantedH * 0.25;
      if (replant) plant();
      if (reduced) {
        if (!replant) plant();
        paintStill();
      }
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    resize();

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    /* ── Interaction: cursor anywhere is wind; click on empty space shakes ── */
    const onMove = (e: PointerEvent) => {
      windTarget = Math.max(-1, Math.min(1, (e.clientX - W / 2) / (W / 2))) * 0.8;
    };
    const onLeave = () => (windTarget = 0);
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest(INTERACTIVE)) return;
      shake = 1;
    };
    if (!reduced) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      window.addEventListener('pointerdown', onDown, { passive: true });
    }

    start();

    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return (
    <div ref={wrapRef} className={s.bgTree} aria-hidden="true">
      <canvas ref={canvasRef} className={s.treeCanvas} />
    </div>
  );
}
