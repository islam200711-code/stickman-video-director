/**
 * Reusable cinematic "looks": lighting balance + depth (fog/haze) + 2D grade.
 * Applied per scene on top of the environment and timeOfDay (storyboard `look`).
 * Costs nothing extra to render: same lights, different numbers; the grade is a
 * CSS filter + vignette in Remotion's 2D layer.
 */
export type Look = {
  key: number; fill: number; rim: number;           // light multipliers
  keyColor?: string; rimColor?: string;
  keyAngle?: 'high' | 'low-side' | 'back';           // key light direction
  fog: number;                                       // <1 = denser haze / shallower depth, >1 = clearer air
  exposure: number;
  grade: {vignette: number; saturate: number; contrast: number; tint?: string; tintOpacity?: number};
};

export const LOOKS: Record<string, Look> = {
  natural:        {key: 1, fill: 1, rim: 1, fog: 1, exposure: 1.05, grade: {vignette: 0.18, saturate: 1.0, contrast: 1.0}},
  'high-key':     {key: 0.8, fill: 1.5, rim: 0.8, fog: 1.4, exposure: 1.15, grade: {vignette: 0.06, saturate: 1.05, contrast: 0.95}},
  'golden-hour':  {key: 1.1, fill: 0.75, rim: 1.6, keyColor: '#ffbe7a', rimColor: '#ffd9a0', keyAngle: 'low-side', fog: 0.8, exposure: 1.05, grade: {vignette: 0.28, saturate: 1.12, contrast: 1.04, tint: '#ff9a3c', tintOpacity: 0.07}},
  overcast:       {key: 0.45, fill: 1.35, rim: 0.6, keyColor: '#e8eef5', fog: 0.7, exposure: 1.08, grade: {vignette: 0.2, saturate: 0.85, contrast: 0.95, tint: '#9fb3c8', tintOpacity: 0.06}},
  dramatic:       {key: 1.35, fill: 0.45, rim: 1.8, keyAngle: 'low-side', fog: 0.9, exposure: 1.0, grade: {vignette: 0.42, saturate: 1.0, contrast: 1.12}},
  'moody-night':  {key: 0.7, fill: 0.6, rim: 1.7, keyColor: '#8fa6ff', rimColor: '#7fd0ff', fog: 0.6, exposure: 1.1, grade: {vignette: 0.45, saturate: 0.9, contrast: 1.06, tint: '#1d2a6b', tintOpacity: 0.12}},
  'interior-warm':{key: 0.9, fill: 1.15, rim: 1.0, keyColor: '#ffe0b8', fog: 1.2, exposure: 1.08, grade: {vignette: 0.24, saturate: 1.06, contrast: 1.0, tint: '#ffb070', tintOpacity: 0.05}},
  'interior-cool':{key: 0.9, fill: 1.1, rim: 1.1, keyColor: '#e6f0ff', fog: 1.2, exposure: 1.05, grade: {vignette: 0.2, saturate: 0.95, contrast: 1.03, tint: '#6aa0ff', tintOpacity: 0.04}},
  tension:        {key: 1.0, fill: 0.55, rim: 1.4, keyAngle: 'back', fog: 0.65, exposure: 0.98, grade: {vignette: 0.5, saturate: 0.82, contrast: 1.1, tint: '#3a4a7a', tintOpacity: 0.06}},
};
export const getLook = (name?: string): Look => {
  const l = LOOKS[name ?? 'natural'];
  if (!l) throw new Error(`Unknown look "${name}". Known: ${Object.keys(LOOKS).join(', ')}`);
  return l;
};
