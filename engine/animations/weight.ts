/**
 * Object weight: deterministic motion curves for props.
 *  smooth – plain ease;  light – snappy start, soft stop
 *  heavy  – strains (micro-wobble, no travel) then slowly gathers momentum and settles with a small overshoot
 *  drop   – gravity fall with two decaying bounces (pairs with an impact event/shake)
 */
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const inOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export type MotionSample = {k: number; lift: number; wobble: number};
export function propMotion(weight: 'smooth' | 'heavy' | 'light' | 'drop', u: number, dropHeight = 0): MotionSample {
  const x = c01(u);
  switch (weight) {
    case 'light': return {k: 1 - Math.pow(1 - x, 3), lift: 0, wobble: 0};
    case 'heavy': {
      const strain = 0.2;
      if (x < strain) return {k: 0, lift: 0, wobble: 0.035 * Math.sin(x * 70) * (x / strain)};
      const v = (x - strain) / (1 - strain);
      const settle = v > 0.82 ? 0.025 * Math.sin(Math.PI * ((v - 0.82) / 0.18)) : 0;
      return {k: inOutCubic(v) + settle, lift: 0, wobble: 0};
    }
    case 'drop': {
      const tf = 0.55;
      if (x < tf) {const f = x / tf; return {k: f, lift: dropHeight * (1 - f * f), wobble: 0};}
      const b = (x - tf) / (1 - tf);
      const bounce = b < 0.55 ? 0.14 * Math.sin(Math.PI * (b / 0.55)) : 0.045 * Math.sin(Math.PI * ((b - 0.55) / 0.45));
      return {k: 1, lift: dropHeight * bounce, wobble: 0};
    }
    default: {const s = x * x * (3 - 2 * x); return {k: s, lift: 0, wobble: 0};}
  }
}
