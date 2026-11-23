/**
 * Deterministic stickman animation library (Style C: stylized 3D stickman).
 * Every action is a pure function (localTime, ctx) -> Pose. There is no randomness
 * and no state: the same frame always produces the same pose, so Remotion can
 * render frames in any order and in parallel.
 *
 * Angle conventions (radians, character space, character faces +z):
 *  limb.fwd   raise limb forward (+) / backward (-)
 *  limb.out   raise limb sideways away from body
 *  limb.bend  forearm flex (forward/up) or shin flex (backward)
 *  lean       torso pitch forward (+), side = roll, twist = yaw
 *  tilt       whole-body pitch about the hip (falling / lying)
 * Hands carry a shape so gestures read at small sizes.
 *
 * Principles applied (see docs/STYLE_GUIDE.md): weight shift and hip bob in gaits,
 * arm swing lagging the legs (follow-through), anticipation before jumps/reactions,
 * momentum-driven lean from locomotion acceleration, eased cross-fades between cues.
 */
import type {Action, Expression, SceneCharacter, Vec3} from '../schema/scene';
import {propMotion} from './weight';

export type HandShape = 'relaxed' | 'fist' | 'point' | 'open' | 'thumb';
export type Limb = {fwd: number; out: number; bend: number};
export type Pose = {
  y: number; lean: number; side: number; twist: number; tilt: number;
  headPitch: number; headYaw: number; headRoll: number;
  lArm: Limb; rArm: Limb; lLeg: Limb; rLeg: Limb;
  lHand: HandShape; rHand: HandShape;
};
/** speed: 0..1 fraction of cruising speed; accel: signed, ~-1..1 */
export type Ctx = {intensity: number; travel: number; seed: number; speed: number; accel: number};

/** Locked Style C proportions (metres, scale 1). Total height ~1.92. */
export const PROPORTIONS = {
  thigh: 0.46, shin: 0.45, hip: 0.91, torso: 0.56, neck: 0.07, head: 0.2,
  upperArm: 0.31, forearm: 0.29, shoulderWidth: 0.16, hipWidth: 0.085,
  shoulderDrop: 0.06,
} as const;

const L = (fwd = 0, out = 0, bend = 0): Limb => ({fwd, out, bend});
export const REST: Pose = {
  y: 0, lean: 0, side: 0, twist: 0, tilt: 0, headPitch: 0, headYaw: 0, headRoll: 0,
  lArm: L(0.02, 0.14, 0.18), rArm: L(0.02, 0.14, 0.18), lLeg: L(0, 0.035, 0.02), rLeg: L(0, 0.035, 0.02),
  lHand: 'relaxed', rHand: 'relaxed',
};
const TAU = Math.PI * 2;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {const c = clamp01(x); return c * c * (3 - 2 * c);};
/** overshoot ease for snappy reactions (follow-through) */
const backOut = (x: number) => {const c = clamp01(x), s = 1.6; return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2);};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type PoseOver = Partial<Omit<Pose, 'lArm' | 'rArm' | 'lLeg' | 'rLeg'>> & {lArm?: Partial<Limb>; rArm?: Partial<Limb>; lLeg?: Partial<Limb>; rLeg?: Partial<Limb>};
const mix = (base: Pose, over: PoseOver): Pose => ({
  ...base, ...over,
  lArm: {...base.lArm, ...(over.lArm ?? {})}, rArm: {...base.rArm, ...(over.rArm ?? {})},
  lLeg: {...base.lLeg, ...(over.lLeg ?? {})}, rLeg: {...base.rLeg, ...(over.rLeg ?? {})},
} as Pose);
const breathe = (t: number, s: number) => Math.sin(t * 1.7 + s) * 0.006;

const SIT: PoseOver = {
  y: -0.43, lean: 0.06, lLeg: L(Math.PI / 2, 0.1, Math.PI / 2), rLeg: L(Math.PI / 2, 0.1, Math.PI / 2),
  lArm: L(0.55, 0.12, 0.95), rArm: L(0.55, 0.12, 0.95),
};
const LYING: PoseOver = {y: -0.69, tilt: -Math.PI / 2, lArm: L(0.1, 0.55, 0.2), rArm: L(0.1, 0.55, 0.2), lLeg: L(0.05, 0.09, 0.05), rLeg: L(0, 0.09, 0.1), lHand: 'open', rHand: 'open'};

/** Weighted gait. Phase comes from distance travelled, so planted feet never slide. */
function gait(t: number, c: Ctx, stride: number, run: boolean): Pose {
  const p = c.travel > 0 ? (c.travel / stride) * TAU : t * TAU * (run ? 1.45 : 0.95);
  const k = c.intensity * (c.travel > 0 ? 0.35 + 0.65 * c.speed : 1); // amplitude follows speed (start/stop momentum)
  const s = Math.sin(p), co = Math.cos(p);
  const lag = 0.35; // arms trail legs: follow-through
  const sa = Math.sin(p - lag);
  const A = run ? 0.75 : 0.42;
  // knee: flexes during swing (leg moving forward) and slightly at contact absorption
  const swingL = Math.max(0, co), swingR = Math.max(0, -co);
  const absorb = 0.08 * Math.abs(Math.sin(2 * p));
  return mix(REST, {
    y: (run ? -0.05 + 0.07 * Math.abs(co) : -0.012 + 0.022 * Math.abs(co)) * k,            // hip bob twice per cycle
    lean: (run ? 0.26 : 0.06) * k - c.accel * 0.12,                                       // momentum lean
    side: (run ? 0.03 : 0.045) * s * k,                                                   // weight shift
    twist: 0.12 * s * k,                                                                  // counter-rotation
    headPitch: (run ? -0.14 : -0.03) * k + c.accel * 0.06,                                // head stabilises against lean
    headRoll: -0.03 * s * k,
    lLeg: L(A * s * k, 0.035, (run ? 1.55 : 0.75) * swingL * k + absorb + 0.05),
    rLeg: L(-A * s * k, 0.035, (run ? 1.55 : 0.75) * swingR * k + absorb + 0.05),
    lArm: L(-A * 0.85 * sa * k, 0.13, run ? 1.55 : 0.3 + 0.35 * Math.max(0, -sa)),
    rArm: L(A * 0.85 * sa * k, 0.13, run ? 1.55 : 0.3 + 0.35 * Math.max(0, sa)),
    lHand: run ? 'fist' : 'relaxed', rHand: run ? 'fist' : 'relaxed',
  });
}

const reactIn = (t: number, d = 0.28) => backOut(t / d);


/** Phase timing (seconds) for choreographed actions: shared by poses, director, VFX and SFX. */
export const ACTION_TIMING = {
  punch: {anticipation: 0.2, contact: 0.3, followThrough: 0.42, recover: 0.8},
  kick: {anticipation: 0.26, contact: 0.4, followThrough: 0.56, recover: 0.95},
  block: {anticipation: 0.12, contact: 0.3, followThrough: 0.45, recover: 0.8},
  dodge: {anticipation: 0.12, contact: 0.3, followThrough: 0.55, recover: 0.9},
  grab: {anticipation: 0.15, contact: 0.32, followThrough: 0.6, recover: 0.9},
  throw: {anticipation: 0.4, contact: 0.58, followThrough: 0.75, recover: 1.1},
  handshake: {anticipation: 0.15, contact: 0.42, followThrough: 1.2, recover: 1.5},
  highfive: {anticipation: 0.15, contact: 0.38, followThrough: 0.5, recover: 0.8},
  give: {anticipation: 0.15, contact: 0.5, followThrough: 0.9, recover: 1.2},
  rescue: {anticipation: 0.2, contact: 0.6, followThrough: 1.4, recover: 1.7},
  push: {anticipation: 0.2, contact: 0.35, followThrough: 0.6, recover: 0.9},
  pull: {anticipation: 0.2, contact: 0.35, followThrough: 0.9, recover: 1.2},
} as const;
export type TimedAction = keyof typeof ACTION_TIMING;

export const ACTION_FNS: Record<Action, (t: number, c: Ctx) => Pose> = {
  idle: (t, c) => mix(REST, {
    y: breathe(t, c.seed), side: Math.sin(t * 0.55 + c.seed) * 0.018, headRoll: Math.sin(t * 0.7 + c.seed) * 0.035, headYaw: Math.sin(t * 0.33 + c.seed) * 0.06,
    lArm: L(0.02 + Math.sin(t * 1.1 + c.seed) * 0.035, 0.14, 0.18), rArm: L(0.02 + Math.sin(t * 1.1 + c.seed + 1) * 0.035, 0.14, 0.18),
    lLeg: L(0.02, 0.05, 0.03), rLeg: L(-0.02, 0.035, 0.06)}),
  stand: (t, c) => {const a = smooth(t / 0.55); const p = blendPose(mix(REST, SIT), ACTION_FNS.idle(t, c), a); return mix(p, {lean: p.lean + 0.35 * Math.sin(Math.PI * a)});},
  walk: (t, c) => gait(t, c, 1.3, false),
  run: (t, c) => gait(t, c, 2.5, true),
  escape: (t, c) => {const g = gait(t, c, 2.5, true);
    return mix(g, {headYaw: 0.85 * Math.sin(Math.min(t, 1.6) * 2), lArm: L(1.1 + 0.55 * Math.sin(t * 12), 0.85, 0.6), rArm: L(1.1 + 0.55 * Math.sin(t * 12 + 2), 0.85, 0.6), lHand: 'open', rHand: 'open'});},
  jump: (t, c) => {
    const u = t % 1.45;
    if (u < 0.3) {const a = smooth(u / 0.3); return mix(REST, {y: -0.2 * a, lean: 0.3 * a, headPitch: -0.15 * a, lLeg: L(0.65 * a, 0.04, 1.2 * a), rLeg: L(0.65 * a, 0.04, 1.2 * a), lArm: L(-0.7 * a, 0.15, 0.4), rArm: L(-0.7 * a, 0.15, 0.4), lHand: 'fist', rHand: 'fist'});}
    if (u < 0.9) {const a = (u - 0.3) / 0.6, h = 4 * a * (1 - a) * 0.7 * c.intensity;
      return mix(REST, {y: h, lean: -0.08, headPitch: -0.2, lLeg: L(0.3, 0.09, 0.6), rLeg: L(0.1, 0.09, 0.35), lArm: L(2.7, 0.35, 0.15), rArm: L(2.7, 0.35, 0.15), lHand: 'open', rHand: 'open'});}
    if (u < 1.2) {const a = 1 - smooth((u - 0.9) / 0.3); return mix(REST, {y: -0.17 * a, lean: 0.24 * a, lLeg: L(0.55 * a, 0.06, 1.05 * a), rLeg: L(0.55 * a, 0.06, 1.05 * a), lArm: L(0.5 * a, 0.55 * a + 0.14, 0.3), rArm: L(0.5 * a, 0.55 * a + 0.14, 0.3)});}
    return ACTION_FNS.idle(t, c);
  },
  fall: (t, c) => {
    const a = smooth(t / 0.6), flail = (1 - a);
    const p = blendPose(REST, mix(REST, LYING), a);
    return mix(p, {headPitch: -0.35 * flail, lArm: L(2.1 * flail + Math.sin(t * 19) * flail * 0.4, 0.55 + flail * 0.6, 0.4), rArm: L(2.1 * flail + Math.cos(t * 19) * flail * 0.4, 0.55 + flail * 0.6, 0.4),
      lLeg: L(0.4 * Math.sin(Math.PI * a), 0.09, 0.35 * Math.sin(Math.PI * a)), rLeg: L(0.85 * Math.sin(Math.PI * a), 0.09, 0.25), lHand: 'open', rHand: 'open'});
  },
  lying: (t) => mix(REST, {...LYING, headRoll: Math.sin(t * 0.8) * 0.05}),
  sit: (t, c) => {const a = smooth(t / 0.5); const p = blendPose(REST, mix(REST, {...SIT, y: (SIT.y ?? 0) + breathe(t, c.seed)}), a); return mix(p, {lean: p.lean + 0.3 * Math.sin(Math.PI * a)});},
  crouch: (t, c) => {const a = smooth(t / 0.35); return mix(REST, {y: -0.32 * a + breathe(t, c.seed), lean: 0.35 * a, headPitch: -0.25 * a, lLeg: L(0.9 * a, 0.12, 1.5 * a), rLeg: L(0.7 * a, 0.12, 1.3 * a), lArm: L(0.7 * a, 0.2, 0.8), rArm: L(0.6 * a, 0.2, 0.9)});},
  talk: (t, c) => {
    const g = Math.sin(t * 3.0 + c.seed), g2 = Math.sin(t * 2.1 + 1 + c.seed), beat = Math.max(0, Math.sin(t * 4.4 + c.seed));
    return mix(ACTION_FNS.idle(t, c), {headPitch: -0.04 + beat * 0.07 * c.intensity, headYaw: Math.sin(t * 0.9) * 0.1, lean: 0.03 + 0.03 * beat,
      rArm: L(0.6 + 0.28 * g * c.intensity, 0.28, 1.35 + 0.3 * g2), lArm: L(0.2 + 0.22 * g2 * c.intensity, 0.2, 0.55 + 0.4 * Math.max(0, g)),
      rHand: 'open', lHand: g2 > 0.3 ? 'open' : 'relaxed'});
  },
  point: (t, c) => {const a = reactIn(t, 0.35);
    return mix(ACTION_FNS.idle(t, c), {twist: -0.15 * a, lean: 0.04 * a, rArm: L(1.45 * a, 0.22 * a + 0.12, 0.06), lArm: L(0.05, 0.16, 0.35), headYaw: -0.12 * a, rHand: 'point'});},
  think: (t, c) => {const a = smooth(t / 0.45);
    return mix(ACTION_FNS.idle(t, c), {headRoll: 0.18 * a, headPitch: -0.12 * a + Math.sin(t * 1.3) * 0.03, headYaw: 0.18 * a, side: -0.04 * a,
      rArm: L(0.42 * a, 0.04, 2.5 * a + 0.12), lArm: L(0.72 * a, -0.25 * a + 0.14, 1.75 * a), rHand: 'fist'});},
  surprised: (t, c) => {const a = reactIn(t, 0.22), hop = t < 0.36 ? Math.sin((t / 0.36) * Math.PI) * 0.12 : 0;
    return mix(REST, {y: hop + breathe(t, c.seed), lean: -0.2 * a, headPitch: -0.18 * a,
      lArm: L(0.45 * a, 1.85 * a * c.intensity + 0.14, 0.95 * a), rArm: L(0.45 * a, 1.85 * a * c.intensity + 0.14, 0.95 * a),
      lLeg: L(-0.12 * a, 0.12 * a + 0.035, 0.12), rLeg: L(0.15 * a, 0.12 * a + 0.035, 0.12), lHand: 'open', rHand: 'open'});},
  celebrate: (t, c) => {const b = Math.abs(Math.sin(t * TAU * 1.3)), a = smooth(t / 0.25);
    return mix(REST, {y: 0.13 * b * c.intensity * a, headPitch: -0.18, lean: -0.06, side: 0.05 * Math.sin(t * TAU * 0.65),
      lArm: L(0.35, (2.55 + 0.15 * Math.sin(t * 8)) * a + 0.14, 0.18), rArm: L(0.35, (2.55 + 0.15 * Math.sin(t * 8 + 1)) * a + 0.14, 0.18),
      lLeg: L(0.15 * b, 0.1, 0.5 * b), rLeg: L(0.15 * b, 0.1, 0.5 * b), lHand: 'fist', rHand: 'fist'});},
  argue: (t, c) => {const g = Math.sin(t * TAU * 1.5 + c.seed), k = c.intensity;
    return mix(REST, {lean: 0.17 * k, headPitch: 0.06 + 0.08 * Math.max(0, g), y: breathe(t, c.seed), side: 0.03 * g,
      rArm: L(0.95 + 0.45 * g * k, 0.3, 1.1 - 0.5 * g), lArm: L(0.5 - 0.3 * g * k, 0.35, 1.5), lLeg: L(0.2, 0.06, 0.1), rLeg: L(-0.15, 0.06, 0.05),
      rHand: g > 0 ? 'point' : 'open', lHand: 'fist'});},
  fight: (t, c) => {
    const u = (t * 2.1) % 2, punchR = u < 1 ? Math.sin(Math.min(u, 1) * Math.PI) : 0, punchL = u >= 1 ? Math.sin((u - 1) * Math.PI) : 0;
    return mix(REST, {lean: 0.16, twist: 0.25 * (punchR - punchL), y: -0.07 + Math.sin(t * 9) * 0.015,
      rArm: L(0.95 + 0.55 * punchR, 0.15, 2.0 - 1.9 * punchR), lArm: L(0.95 + 0.55 * punchL, 0.15, 2.0 - 1.9 * punchL),
      lLeg: L(0.35, 0.1, 0.38), rLeg: L(-0.3, 0.1, 0.28), lHand: 'fist', rHand: 'fist'});},
  work: (t, c) => {const h = Math.sin(t * TAU * 1.8);
    return mix(REST, {lean: 0.22, headPitch: 0.25, y: -0.03, rArm: L(1.0 + 0.55 * h, 0.2, 0.9 - 0.4 * h), lArm: L(0.8, 0.1, 1.2), lLeg: L(0.1, 0.1, 0.15), rLeg: L(-0.05, 0.1, 0.05), rHand: 'fist'});},
  computer: (t) => {const s = mix(REST, SIT);
    return mix(s, {lean: 0.12, headPitch: 0.16 + Math.sin(t * 0.6) * 0.03,
      rArm: L(1.0 + Math.sin(t * 17) * 0.05, 0.1, 1.3), lArm: L(1.0 + Math.sin(t * 15 + 1) * 0.05, 0.1, 1.3), lHand: 'open', rHand: 'open'});},
  hold: (t, c) => mix(ACTION_FNS.idle(t, c), {rArm: L(0.55, 0.15, 1.4), headPitch: 0.06, rHand: 'fist'}),
  wave: (t, c) => {const a = reactIn(t, 0.35);
    return mix(ACTION_FNS.idle(t, c), {side: -0.04 * a, rArm: L(0.2, 2.45 * a + 0.14, 0.5 + 0.45 * Math.sin(t * TAU * 2.1)), headRoll: -0.09 * a, rHand: 'open'});},
  shrug: (t, c) => {const a = Math.sin(clamp01(t / 0.9) * Math.PI);
    return mix(ACTION_FNS.idle(t, c), {y: 0.025 * a, headRoll: 0.17 * a, headPitch: -0.05 * a, lArm: L(0.45, 0.5 * a + 0.14, 1.65 * a), rArm: L(0.45, 0.5 * a + 0.14, 1.65 * a), lHand: 'open', rHand: 'open'});},
  facepalm: (t, c) => {const a = smooth(t / 0.35);
    return mix(ACTION_FNS.idle(t, c), {headPitch: 0.36 * a, lean: 0.09 * a, rArm: L(0.95 * a, 0.0, 2.45 * a + 0.12), rHand: 'open'});},
  thumbsup: (t, c) => {const a = reactIn(t, 0.3);
    return mix(ACTION_FNS.idle(t, c), {rArm: L(1.1 * a, 0.25, 1.55 * a), headRoll: -0.1 * a, rHand: 'thumb'});},
  push: (t, c) => {const p = Math.sin(t * TAU * 0.85) * c.intensity;
    return mix(REST, {lean: 0.52 + 0.06 * p, y: -0.11, headPitch: -0.38, rArm: L(1.35, 0.12, 0.5 + 0.2 * p), lArm: L(1.35, 0.12, 0.5 + 0.2 * p),
      lLeg: L(0.5, 0.05, 0.75), rLeg: L(-0.48 - 0.08 * p, 0.05, 0.15), lHand: 'open', rHand: 'open'});},
  reach: (t, c) => {const a = smooth(t / 0.4);
    return mix(ACTION_FNS.idle(t, c), {lean: 0.08 * a, rArm: L(1.2 * a, 0.15, 0.4), rHand: 'open'});},
  clap: (t, c) => {const k = Math.abs(Math.sin(t * TAU * 1.8));
    return mix(ACTION_FNS.idle(t, c), {headPitch: -0.05, lArm: L(1.15, 0.05 + 0.4 * k, 1.2), rArm: L(1.15, 0.05 + 0.4 * k, 1.2), lHand: 'open', rHand: 'open'});},
  nod: (t, c) => mix(ACTION_FNS.idle(t, c), {headPitch: 0.16 * Math.max(0, Math.sin(t * TAU * 1.6)) * c.intensity}),
  headshake: (t, c) => mix(ACTION_FNS.idle(t, c), {headYaw: 0.32 * Math.sin(t * TAU * 1.8) * c.intensity, headPitch: 0.05}),

  // ---------------- choreography actions (driven by choreography/director.ts) ----------------
  // Phase times live in ACTION_TIMING so the director can align contact, VFX and SFX exactly.
  guard: (t, c) => mix(REST, {y: -0.05 + breathe(t, c.seed), lean: 0.12, twist: -0.1, lArm: L(0.95, 0.12, 2.05), rArm: L(0.85, 0.15, 2.15), lLeg: L(0.3, 0.1, 0.28), rLeg: L(-0.25, 0.1, 0.16), lHand: 'fist', rHand: 'fist'}),
  punch: (t, c) => {
    const T = ACTION_TIMING.punch, k = c.intensity, g = ACTION_FNS.guard(t, c);
    if (t < T.anticipation) {const a = smooth(t / T.anticipation); return mix(g, {twist: 0.35 * a * k, lean: 0.12 - 0.06 * a, rArm: L(0.7, 0.3, 2.2)});}
    if (t < T.contact) {const e = 1 - Math.pow(1 - (t - T.anticipation) / (T.contact - T.anticipation), 3);
      return mix(g, {twist: 0.35 * k - 0.7 * e * k, lean: 0.06 + 0.2 * e, y: -0.07, rArm: L(0.7 + 0.8 * e, 0.3 - 0.2 * e, 2.2 - 2.15 * e)});}
    if (t < T.followThrough) return mix(g, {twist: -0.38 * k, lean: 0.27, y: -0.08, rArm: L(1.52, 0.1, 0.05)});
    const r = smooth((t - T.followThrough) / (T.recover - T.followThrough));
    return blendPose(mix(g, {twist: -0.38 * k, lean: 0.27, rArm: L(1.52, 0.1, 0.05)}), g, r);
  },
  kick: (t, c) => {
    const T = ACTION_TIMING.kick, g = ACTION_FNS.guard(t, c);
    if (t < T.anticipation) {const a = smooth(t / T.anticipation); return mix(g, {lean: -0.08 * a, rLeg: L(1.25 * a, 0.08, 1.9 * a), lLeg: L(0.1, 0.08, 0.2)});}
    if (t < T.contact) {const e = 1 - Math.pow(1 - (t - T.anticipation) / (T.contact - T.anticipation), 3);
      return mix(g, {lean: -0.08 - 0.22 * e, twist: 0.1 * e, rLeg: L(1.25 + 0.3 * e, 0.08, 1.9 - 1.85 * e), lLeg: L(0.1, 0.08, 0.25), lArm: L(0.5, 0.6, 1.2), rArm: L(-0.3, 0.5, 0.6)});}
    if (t < T.followThrough) return mix(g, {lean: -0.3, rLeg: L(1.55, 0.08, 0.05), lLeg: L(0.1, 0.08, 0.25), lArm: L(0.5, 0.6, 1.2), rArm: L(-0.3, 0.5, 0.6)});
    const r = smooth((t - T.followThrough) / (T.recover - T.followThrough));
    return blendPose(mix(g, {lean: -0.3, rLeg: L(1.2, 0.08, 1.4)}), g, r);
  },
  block: (t, c) => {
    const T = ACTION_TIMING.block, up = smooth(t / T.anticipation);
    const hitK = t > T.contact ? Math.exp(-(t - T.contact) * 9) : 0; // recoil absorbs the incoming hit
    return mix(ACTION_FNS.guard(t, c), {lean: 0.08 - 0.25 * hitK * c.intensity, y: -0.07 - 0.04 * hitK, headPitch: 0.15 * up,
      lArm: L(1.1 * up + 0.4 * (1 - up), 0.05, 2.3 * up), rArm: L(1.15 * up + 0.4 * (1 - up), 0.05, 2.25 * up), lLeg: L(0.25, 0.1, 0.3), rLeg: L(-0.35 - 0.1 * hitK, 0.1, 0.2)});
  },
  dodge: (t, c) => {
    const T = ACTION_TIMING.dodge;
    const a = t < T.anticipation ? smooth(t / T.anticipation) * 0.25 : t < T.followThrough ? 0.25 + 0.75 * smooth((t - T.anticipation) / (T.contact - T.anticipation)) : 1 - smooth((t - T.followThrough) / (T.recover - T.followThrough));
    return mix(ACTION_FNS.guard(t, c), {y: -0.3 * a, lean: 0.35 * a, side: 0.38 * a * c.intensity, twist: 0.25 * a, headPitch: -0.1 * a,
      lLeg: L(0.55 * a + 0.2, 0.25 * a + 0.1, 1.0 * a + 0.2), rLeg: L(-0.35, 0.12, 0.6 * a + 0.1)});
  },
  grab: (t, c) => {
    const T = ACTION_TIMING.grab, a = smooth(t / T.contact), close = t > T.contact ? 1 : 0;
    return mix(REST, {lean: 0.22 * a - (t > T.followThrough ? 0.18 : 0), y: -0.05 * a, lArm: L(1.25 * a, 0.12, 0.5 + 0.6 * close), rArm: L(1.25 * a, 0.12, 0.5 + 0.6 * close),
      lLeg: L(0.25 * a, 0.08, 0.25), rLeg: L(-0.25 * a, 0.08, 0.1), lHand: close ? 'fist' : 'open', rHand: close ? 'fist' : 'open'});
  },
  throw: (t, c) => {
    const T = ACTION_TIMING.throw;
    if (t < T.anticipation) {const a = smooth(t / T.anticipation); return mix(REST, {twist: 0.6 * a, lean: -0.22 * a, y: -0.08 * a, lArm: L(1.2 + 0.6 * a, 0.2, 0.5), rArm: L(1.2 + 0.6 * a, 0.2, 0.5), lLeg: L(0.3, 0.1, 0.3), rLeg: L(-0.35, 0.1, 0.25), lHand: 'fist', rHand: 'fist'});}
    if (t < T.contact) {const e = smooth((t - T.anticipation) / (T.contact - T.anticipation));
      return mix(REST, {twist: 0.6 - 1.2 * e, lean: -0.22 + 0.6 * e, y: -0.08, lArm: L(1.8 - 0.5 * e, 0.2, 0.5 - 0.4 * e), rArm: L(1.8 - 0.5 * e, 0.2, 0.5 - 0.4 * e), lLeg: L(0.3, 0.1, 0.3), rLeg: L(-0.35, 0.1, 0.25), lHand: 'open', rHand: 'open'});}
    const r = smooth((t - T.contact) / (T.recover - T.contact));
    return blendPose(mix(REST, {twist: -0.6, lean: 0.38, lArm: L(1.3, 0.2, 0.1), rArm: L(1.3, 0.2, 0.1), lHand: 'open', rHand: 'open'}), ACTION_FNS.idle(t, c), r);
  },
  pull: (t, c) => {const tug = Math.max(0, Math.sin(t * TAU * 1.1)) * c.intensity, a = smooth(t / 0.3);
    return mix(REST, {lean: -0.3 * a - 0.08 * tug, y: -0.1 * a, lArm: L(1.25, 0.1, 0.5 + 0.5 * tug), rArm: L(1.25, 0.1, 0.5 + 0.5 * tug), lLeg: L(0.45 * a, 0.1, 0.5 * a), rLeg: L(-0.2, 0.1, 0.2), lHand: 'fist', rHand: 'fist'});},
  hit: (t, c) => {const k = c.intensity;
    const snap = t < 0.08 ? smooth(t / 0.08) : Math.exp(-(t - 0.08) * 4.5);
    return mix(ACTION_FNS.guard(t, c), {lean: -0.4 * snap * k, headPitch: -0.45 * snap * k, headRoll: 0.2 * snap, twist: 0.3 * snap * k, y: -0.04 * snap,
      lArm: L(0.4, 0.5 + 0.5 * snap, 0.8), rArm: L(0.2, 0.6 + 0.6 * snap, 0.7), lHand: 'open', rHand: 'open'});},
  stagger: (t, c) => {const w = Math.sin(t * TAU * 1.6) * Math.exp(-t * 1.6);
    return mix(REST, {side: 0.18 * w, lean: -0.15 * Math.exp(-t * 2), headRoll: 0.2 * w, lArm: L(0.4, 0.6 + 0.3 * w, 0.4), rArm: L(0.4, 0.6 - 0.3 * w, 0.4), lLeg: L(0.25 * w, 0.12, 0.2), rLeg: L(-0.25 * w, 0.12, 0.2), lHand: 'open', rHand: 'open'});},
  knockdown: (t, c) => {const a = smooth(t / 0.45);
    const p = blendPose(mix(REST, {lean: -0.5, headPitch: -0.4, lArm: L(1.8, 0.9, 0.3), rArm: L(1.8, 0.9, 0.3), lHand: 'open', rHand: 'open'}), mix(REST, LYING), a);
    return mix(p, {y: (p.y ?? 0) + (t > 0.45 && t < 0.62 ? 0.06 * Math.sin(((t - 0.45) / 0.17) * Math.PI) : 0)}); // small bounce on landing
  },
  thrown: (t, c) => {const u = Math.min(1, t / 0.7), arc = 4 * u * (1 - u) * 0.55 * c.intensity;
    const p = blendPose(mix(REST, {lean: -0.3, lArm: L(2.2, 1.0, 0.3), rArm: L(2.2, 1.0, 0.3), lLeg: L(0.6, 0.3, 0.9), rLeg: L(0.2, 0.3, 0.4), lHand: 'open', rHand: 'open'}), mix(REST, LYING), smooth(u));
    return mix(p, {y: p.y + arc});
  },
  handshake: (t, c) => {const a = smooth(t / 0.4), pump = t > ACTION_TIMING.handshake.contact ? Math.sin((t - ACTION_TIMING.handshake.contact) * TAU * 2.6) * Math.exp(-(t - ACTION_TIMING.handshake.contact) * 0.9) : 0;
    return mix(ACTION_FNS.idle(t, c), {lean: 0.06 * a, headPitch: 0.06 * a, rArm: L(0.95 * a + 0.08 * pump, 0.08, 0.35 + 0.15 * pump), rHand: 'open'});},
  highfive: (t, c) => {const T = ACTION_TIMING.highfive, a = smooth(t / T.contact), rec = t > T.contact ? Math.exp(-(t - T.contact) * 6) : 0;
    return mix(ACTION_FNS.idle(t, c), {y: 0.06 * a, lean: -0.04 + 0.1 * rec, side: -0.05 * a, rArm: L(2.35 * a, 0.3, 0.25 + 0.4 * rec), rHand: 'open', headPitch: -0.12 * a});},
  give: (t, c) => {const a = smooth(t / 0.45); return mix(ACTION_FNS.idle(t, c), {lean: 0.1 * a, rArm: L(1.1 * a + 0.3, 0.1, 0.4), rHand: 'fist'});},
  receive: (t, c) => {const a = smooth(t / 0.45); return mix(ACTION_FNS.idle(t, c), {lean: 0.08 * a, lArm: L(0.95 * a, 0.1, 0.5), rArm: L(1.05 * a, 0.1, 0.45), lHand: 'open', rHand: 'open'});},
  rescue: (t, c) => {const T = ACTION_TIMING.rescue, reach = smooth(t / T.contact), lift = smooth((t - T.contact) / (T.followThrough - T.contact));
    return mix(REST, {lean: 0.7 * reach - 0.55 * lift, y: -0.2 * reach + 0.18 * lift, headPitch: 0.3 * reach - 0.3 * lift,
      rArm: L(1.0 + 0.4 * reach - 0.3 * lift, 0.12, 0.1 + 0.7 * lift), lArm: L(0.5 * reach, 0.3, 0.6), lLeg: L(0.6 * reach, 0.1, 0.9 * reach - 0.6 * lift + 0.1), rLeg: L(-0.25, 0.1, 0.3 * reach), rHand: 'open'});},
  rescued: (t, c) => {const T = ACTION_TIMING.rescue, up = smooth((t - T.contact) / (T.followThrough - T.contact + 0.2));
    const kneel = mix(REST, {y: -0.42, lean: 0.15, headPitch: -0.3, lLeg: L(1.4, 0.15, 2.4), rLeg: L(0.4, 0.15, 1.6), lArm: L(0.2, 0.3, 0.4), rArm: L(1.9, 0.15, 0.15), rHand: 'open'});
    return blendPose(kneel, mix(ACTION_FNS.idle(t, c), {rArm: L(0.9, 0.12, 0.3)}), up);},
  huddle: (t, c) => {const b = Math.abs(Math.sin(t * TAU * 1.2)) * c.intensity;
    return mix(REST, {lean: 0.32, y: 0.03 * b, headPitch: 0.15, lArm: L(1.0, 0.9, 0.7), rArm: L(1.0, 0.9, 0.7), lHand: 'open', rHand: 'open', lLeg: L(0.1, 0.12, 0.1 + 0.2 * b), rLeg: L(0.1, 0.12, 0.1 + 0.2 * b)});},
  laugh: (t, c) => {const b = Math.sin(t * TAU * 3.2);
    return mix(ACTION_FNS.idle(t, c), {headPitch: -0.22 + 0.06 * b, lean: -0.08 + 0.03 * b, y: 0.01 * b, lArm: L(0.6, 0.2, 1.7), rArm: L(0.6, 0.2, 1.7), lHand: 'fist', rHand: 'fist'});},
};

export function blendPose(a: Pose, b: Pose, t: number): Pose {
  const lb = (x: Limb, y: Limb): Limb => ({fwd: lerp(x.fwd, y.fwd, t), out: lerp(x.out, y.out, t), bend: lerp(x.bend, y.bend, t)});
  const n = (k: keyof Pose) => lerp(a[k] as number, b[k] as number, t);
  return {y: n('y'), lean: n('lean'), side: n('side'), twist: n('twist'), tilt: n('tilt'), headPitch: n('headPitch'), headYaw: n('headYaw'), headRoll: n('headRoll'),
    lArm: lb(a.lArm, b.lArm), rArm: lb(a.rArm, b.rArm), lLeg: lb(a.lLeg, b.lLeg), rLeg: lb(a.rLeg, b.rLeg),
    lHand: t < 0.5 ? a.lHand : b.lHand, rHand: t < 0.5 ? a.rHand : b.rHand};
}

export type CharacterFrame = {
  pose: Pose; position: Vec3; facing: number; expression: Expression; talking: boolean; prop?: string; action: Action;
  reach?: {left?: Vec3; right?: Vec3; weight: number};
  lookAt?: Vec3;
  lookAtCharacter?: string;
  /** facial cross-fade: previous expression and blend 0..1 towards `expression` */
  exprFrom: Expression; exprK: number;
  /** emphasis of emotion 0..1 (used by face + camera) */
  emotion: number;
};

/**
 * Emotional body language: an additive posture layer per expression, so the
 * whole body acts the feeling (not only the face). Scaled down during locomotion.
 */
type Body = (t: number) => PoseOver;
const BODY: Partial<Record<Expression, Body>> = {
  happy: (t) => ({lean: -0.03, headPitch: -0.05, y: 0.006 * Math.sin(t * 3.2)}),
  excited: (t) => ({lean: -0.05, headPitch: -0.09, y: 0.018 * Math.abs(Math.sin(t * 5))}),
  sad: () => ({lean: 0.11, headPitch: 0.2, y: -0.02, lArm: {out: 0.05}, rArm: {out: 0.05}}),
  angry: (t) => ({lean: 0.12, headPitch: 0.07, side: 0.01 * Math.sin(t * 9), lHand: 'fist', rHand: 'fist'}),
  scared: (t) => ({lean: -0.13, y: -0.035, headPitch: 0.05, headRoll: 0.012 * Math.sin(t * 31), lArm: {fwd: 0.45, bend: 1.1}, rArm: {fwd: 0.45, bend: 1.1}, lHand: 'open', rHand: 'open'}),
  surprised: () => ({lean: -0.08, headPitch: -0.1}),
  thinking: (t) => ({headRoll: 0.1, headPitch: -0.06 + 0.02 * Math.sin(t * 1.1)}),
  worried: (t) => ({headPitch: 0.09, lean: 0.03, side: 0.012 * Math.sin(t * 2.3), lArm: {fwd: 0.2, bend: 0.5}, rArm: {fwd: 0.2, bend: 0.5}}),
  determined: () => ({lean: 0.06, headPitch: 0.05, lHand: 'fist', rHand: 'fist'}),
  confused: () => ({headRoll: 0.2, side: 0.03}),
  smug: () => ({lean: -0.06, headPitch: -0.09, headRoll: -0.08}),
};
const STRONG = new Set<Expression>(['surprised', 'scared', 'angry', 'excited', 'sad']);
function addBody(p: Pose, o: PoseOver, w: number): Pose {
  if (w <= 0) return p;
  const n = (k: 'y' | 'lean' | 'side' | 'twist' | 'headPitch' | 'headYaw' | 'headRoll') => p[k] + ((o[k] as number | undefined) ?? 0) * w;
  const limb = (a: Limb, b?: Partial<Limb>): Limb => ({fwd: a.fwd + (b?.fwd ?? 0) * w, out: a.out + (b?.out ?? 0) * w, bend: a.bend + (b?.bend ?? 0) * w});
  return {...p, y: n('y'), lean: n('lean'), side: n('side'), twist: n('twist'), headPitch: n('headPitch'), headYaw: n('headYaw'), headRoll: n('headRoll'),
    lArm: limb(p.lArm, o.lArm), rArm: limb(p.rArm, o.rArm), lLeg: limb(p.lLeg, o.lLeg), rLeg: limb(p.rLeg, o.rLeg),
    lHand: w > 0.5 && o.lHand && p.lHand === 'relaxed' ? o.lHand : p.lHand, rHand: w > 0.5 && o.rHand && p.rHand === 'relaxed' ? o.rHand : p.rHand};
}

const LOCOMOTION = new Set<Action>(['walk', 'run', 'escape']);
const BLEND = 0.35;
const hash = (s: string) => {let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return (h >>> 0) % 1000 / 100;};
/** accelerate / cruise / decelerate profile for travel (normalised 0..1) */
const easeMove = (x: number) => {const c = clamp01(x); return c < 0.18 ? (c * c) / 0.36 : c > 0.82 ? 1 - ((1 - c) * (1 - c)) / 0.36 : c - 0.09;};
const normMove = (x: number) => easeMove(x) / easeMove(1);
const moveSpeed = (x: number) => {const c = clamp01(x); return c < 0.18 ? c / 0.18 : c > 0.82 ? (1 - c) / 0.18 : 1;};
const angleLerp = (a: number, b: number, t: number) => {const d = ((b - a + 540) % 360) - 180; return a + d * t;};

/** Evaluate a character's action track at scene time t (seconds). Pure. */
export function evaluateCharacter(ch: SceneCharacter, t: number, sceneDuration: number): CharacterFrame {
  const seed = hash(ch.id);
  const cues = [...ch.track].sort((a, b) => a.start - b.start);
  let pos: Vec3 = [...ch.position] as Vec3;
  let facing = ch.facing;
  let result: CharacterFrame | null = null;
  let prevPose: Pose | null = null;
  let prevExpr: Expression = ch.expression;

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const end = cue.end ?? cues[i + 1]?.start ?? sceneDuration;
    const dur = Math.max(0.01, end - cue.start);
    const from = pos;
    const to = cue.to ?? from;
    const dist = Math.hypot(to[0] - from[0], to[2] - from[2]);
    const moveYaw = dist > 0.01 ? (Math.atan2(to[0] - from[0], to[2] - from[2]) * 180) / Math.PI : null;
    const startFacing = facing;
    const targetFacing = cue.facing ?? moveYaw ?? facing;
    const evalAt = (tt: number): {pose: Pose; p: Vec3; f: number} => {
      const local = Math.max(0, tt - cue.start);
      const x = local / dur;
      const k = cue.moveCurve ? propMotion(cue.moveCurve, x).k : normMove(x);
      const p: Vec3 = [lerp(from[0], to[0], k), lerp(from[1], to[1], k), lerp(from[2], to[2], k)];
      const moving = LOCOMOTION.has(cue.action) && dist > 0.01;
      const travel = moving ? dist * k : 0;
      const speed = moving ? moveSpeed(x) : 0;
      const accel = moving ? (x < 0.18 ? 1 - x / 0.18 : x > 0.82 ? -(x - 0.82) / 0.18 : 0) : 0;
      const pose = ACTION_FNS[cue.action](local * cue.speed, {intensity: cue.intensity, travel, seed, speed, accel});
      // turn the body over 0.35s, head leads slightly (anticipation)
      const f = angleLerp(startFacing, targetFacing, smooth(local / 0.35));
      const headLead = ((angleLerp(startFacing, targetFacing, smooth(local / 0.2)) - f) * Math.PI) / 180;
      return {pose: {...pose, headYaw: pose.headYaw + headLead}, p, f};
    };
    if (t < end || i === cues.length - 1) {
      const cur = evalAt(t);
      let pose = cur.pose;
      const local = t - cue.start;
      if (prevPose && local < BLEND) pose = blendPose(prevPose, pose, smooth(local / BLEND));
      const rAt = cue.reachAt ?? 0, rRamp = cue.reachRamp ?? 0.35;
      let reachW = cue.reach ? smooth((local - rAt) / rRamp) : 0;
      if (cue.reach && cue.reachUntil !== undefined) reachW *= 1 - smooth((local - cue.reachUntil) / 0.25);
      const expr = cue.expression ?? prevExpr;
      const exprK = expr === prevExpr ? 1 : smooth(local / 0.3);
      // body language: blend out the old feeling, blend in the new one
      const moving = LOCOMOTION.has(cue.action) ? 0.4 : cue.action === 'lying' || cue.action === 'fall' ? 0 : 1;
      const bOld = BODY[prevExpr], bNew = BODY[expr];
      if (bOld && exprK < 1) pose = addBody(pose, bOld(t), (1 - exprK) * moving);
      if (bNew) pose = addBody(pose, bNew(t), exprK * moving * cue.intensity);
      result = {pose, position: cur.p, facing: cur.f, expression: expr, exprFrom: prevExpr, exprK,
        emotion: STRONG.has(expr) ? exprK : 0.3 * exprK,
        talking: cue.action === 'talk' || cue.action === 'argue' || cue.action === 'laugh', prop: cue.prop, action: cue.action,
        reach: cue.reach ? {weight: reachW, ...Object.fromEntries(Object.entries(cue.reach).map(([k2, v2]) => [k2, v2 ? [v2[0] + cur.p[0] - from[0], v2[1], v2[2] + cur.p[2] - from[2]] : v2]))} : undefined, lookAt: cue.target, lookAtCharacter: cue.lookAtCharacter};
      break;
    }
    const done = evalAt(end);
    prevPose = done.pose; pos = to; facing = targetFacing; prevExpr = cue.expression ?? prevExpr;
  }
  return result!;
}
