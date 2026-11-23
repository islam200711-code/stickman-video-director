/**
 * Deterministic stickman animation library.
 * Every action is a pure function (localTime, ctx) -> Pose. No randomness, no
 * state: the same frame always produces the same pose, so Remotion can render
 * frames in any order / in parallel.
 *
 * Angle conventions (radians, character space, character faces +z):
 *  limb.fwd   raise limb forward (+) / backward (-)
 *  limb.out   raise limb sideways away from body
 *  arm.elbow  forearm flex (forward/up), leg.knee shin flex (backward)
 *  lean       torso pitch forward (+), side = roll, twist = yaw
 *  tilt       whole-body pitch about the hip (used for falling / lying)
 */
import type {Action, ActionCue, Expression, SceneCharacter, Vec3} from '../schema/scene';

export type Limb = {fwd: number; out: number; bend: number};
export type Pose = {
  y: number; lean: number; side: number; twist: number; tilt: number;
  headPitch: number; headYaw: number; headRoll: number;
  lArm: Limb; rArm: Limb; lLeg: Limb; rLeg: Limb;
};
export type Ctx = {intensity: number; travel: number; seed: number};

export const PROPORTIONS = {
  thigh: 0.48, shin: 0.47, hip: 0.95, torso: 0.6, neck: 0.1, head: 0.17,
  upperArm: 0.32, forearm: 0.3, shoulderWidth: 0.17, hipWidth: 0.09,
} as const;

const L = (fwd = 0, out = 0, bend = 0): Limb => ({fwd, out, bend});
export const REST: Pose = {
  y: 0, lean: 0, side: 0, twist: 0, tilt: 0, headPitch: 0, headYaw: 0, headRoll: 0,
  lArm: L(0, 0.12, 0.12), rArm: L(0, 0.12, 0.12), lLeg: L(0, 0.03, 0), rLeg: L(0, 0.03, 0),
};
const TAU = Math.PI * 2;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {const c = clamp01(x); return c * c * (3 - 2 * c);};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (base: Pose, over: Partial<Pose>): Pose => ({
  ...base, ...over,
  lArm: {...base.lArm, ...(over.lArm ?? {})}, rArm: {...base.rArm, ...(over.rArm ?? {})},
  lLeg: {...base.lLeg, ...(over.lLeg ?? {})}, rLeg: {...base.rLeg, ...(over.rLeg ?? {})},
});
const breathe = (t: number, s: number) => Math.sin(t * 1.6 + s) * 0.008;

const SIT: Partial<Pose> = {
  y: -0.45, lean: 0.05, lLeg: L(Math.PI / 2, 0.08, Math.PI / 2), rLeg: L(Math.PI / 2, 0.08, Math.PI / 2),
  lArm: L(0.5, 0.12, 0.9), rArm: L(0.5, 0.12, 0.9),
};
const LYING: Partial<Pose> = {y: -0.82, tilt: -Math.PI / 2, lArm: L(0, 0.5, 0.1), rArm: L(0, 0.5, 0.1), lLeg: L(0, 0.08, 0), rLeg: L(0, 0.08, 0)};

function gait(t: number, c: Ctx, stride: number, amp: number, run: boolean): Pose {
  // phase from distance travelled => feet never slide; in-place uses time
  const p = c.travel > 0 ? (c.travel / stride) * TAU : t * TAU * (run ? 1.5 : 1);
  const s = Math.sin(p), k = c.intensity;
  return mix(REST, {
    y: (run ? 0.06 : 0.025) * Math.abs(Math.cos(p)) * k - (run ? 0.04 : 0.01),
    lean: run ? 0.28 * k : 0.05,
    twist: 0.08 * s * k,
    headPitch: run ? -0.15 : 0,
    lLeg: L(amp * s * k, 0.03, Math.max(0, -Math.cos(p)) * (run ? 1.5 : 0.7) * k + 0.1),
    rLeg: L(-amp * s * k, 0.03, Math.max(0, Math.cos(p)) * (run ? 1.5 : 0.7) * k + 0.1),
    lArm: L(-amp * 0.9 * s * k, 0.12, run ? 1.5 : 0.25 + 0.15 * Math.max(0, -s)),
    rArm: L(amp * 0.9 * s * k, 0.12, run ? 1.5 : 0.25 + 0.15 * Math.max(0, s)),
  });
}

export const ACTION_FNS: Record<Action, (t: number, c: Ctx) => Pose> = {
  idle: (t, c) => mix(REST, {y: breathe(t, c.seed), headRoll: Math.sin(t * 0.7 + c.seed) * 0.04,
    lArm: L(Math.sin(t * 1.1 + c.seed) * 0.04, 0.12, 0.12), rArm: L(Math.sin(t * 1.1 + c.seed + 1) * 0.04, 0.12, 0.12)}),
  stand: (t, c) => {const a = smooth(t / 0.5); return blendPose(mix(REST, SIT), ACTION_FNS.idle(t, c), a);},
  walk: (t, c) => gait(t, c, 1.3, 0.45, false),
  run: (t, c) => gait(t, c, 2.4, 0.85, true),
  escape: (t, c) => {const g = gait(t, c, 2.4, 0.85, true);
    return mix(g, {headYaw: 0.9 * Math.sin(Math.min(t, 1.5) * 2) , lArm: L(1.0 + 0.6 * Math.sin(t * 13), 0.9, 0.6), rArm: L(1.0 + 0.6 * Math.sin(t * 13 + 2), 0.9, 0.6)});},
  jump: (t, c) => {
    const T = 1.1, u = t % (T + 0.3);
    if (u < 0.25) {const a = smooth(u / 0.25); return mix(REST, {y: -0.18 * a, lean: 0.25 * a, lLeg: L(0.6 * a, 0.03, 1.1 * a), rLeg: L(0.6 * a, 0.03, 1.1 * a), lArm: L(-0.6 * a, 0.12, 0.3), rArm: L(-0.6 * a, 0.12, 0.3)});}
    if (u < 0.85) {const a = (u - 0.25) / 0.6, h = 4 * a * (1 - a) * 0.75 * c.intensity;
      return mix(REST, {y: h, lean: -0.05, lLeg: L(0.25, 0.08, 0.5), rLeg: L(0.1, 0.08, 0.3), lArm: L(2.6, 0.4, 0.2), rArm: L(2.6, 0.4, 0.2)});}
    if (u < 1.1) {const a = 1 - smooth((u - 0.85) / 0.25); return mix(REST, {y: -0.15 * a, lean: 0.2 * a, lLeg: L(0.5 * a, 0.05, 1.0 * a), rLeg: L(0.5 * a, 0.05, 1.0 * a), lArm: L(0.4, 0.5 * a + 0.12, 0.3), rArm: L(0.4, 0.5 * a + 0.12, 0.3)});}
    return ACTION_FNS.idle(t, c);
  },
  fall: (t, c) => {
    const a = smooth(t / 0.55), flail = (1 - a) * 0.8;
    const p = blendPose(REST, mix(REST, LYING), a);
    return mix(p, {headPitch: -0.3 * (1 - a), lArm: L(2.0 * (1 - a) + Math.sin(t * 20) * flail * 0.5, 0.5 + flail, 0.4), rArm: L(2.0 * (1 - a) + Math.cos(t * 20) * flail * 0.5, 0.5 + flail, 0.4),
      lLeg: L(0.4 * Math.sin(Math.PI * a), 0.08, 0.3 * Math.sin(Math.PI * a)), rLeg: L(0.8 * Math.sin(Math.PI * a), 0.08, 0.2)});
  },
  lying: (t, c) => mix(REST, {...LYING, headRoll: Math.sin(t * 0.8) * 0.05}),
  sit: (t, c) => blendPose(REST, mix(REST, {...SIT, y: (SIT.y ?? 0) + breathe(t, c.seed)}), smooth(t / 0.45)),
  talk: (t, c) => {
    const g = Math.sin(t * 3.1 + c.seed), g2 = Math.sin(t * 2.3 + 1 + c.seed);
    return mix(ACTION_FNS.idle(t, c), {headPitch: Math.sin(t * 4.2) * 0.05 * c.intensity, headYaw: Math.sin(t * 0.9) * 0.08,
      rArm: L(0.55 + 0.25 * g * c.intensity, 0.25, 1.3 + 0.25 * g2), lArm: L(0.15 + 0.15 * g2 * c.intensity, 0.18, 0.5 + 0.3 * Math.max(0, g))});
  },
  point: (t, c) => {const a = smooth(t / 0.3);
    return mix(ACTION_FNS.idle(t, c), {twist: -0.15 * a, rArm: L(1.45 * a, 0.25 * a + 0.12, 0.05), lArm: L(0, 0.15, 0.3), headYaw: -0.1 * a});},
  think: (t, c) => {const a = smooth(t / 0.4);
    return mix(ACTION_FNS.idle(t, c), {headRoll: 0.18 * a, headPitch: -0.1 * a + Math.sin(t * 1.3) * 0.03, headYaw: 0.15 * a,
      rArm: L(0.45 * a, 0.05, 2.45 * a + 0.1), lArm: L(0.7 * a, -0.25 * a + 0.12, 1.7 * a)});},
  surprised: (t, c) => {const a = smooth(t / 0.18), hop = t < 0.35 ? Math.sin((t / 0.35) * Math.PI) * 0.12 : 0;
    return mix(REST, {y: hop + breathe(t, c.seed), lean: -0.18 * a, headPitch: -0.15 * a,
      lArm: L(0.4 * a, 1.9 * a * c.intensity + 0.12, 0.9 * a), rArm: L(0.4 * a, 1.9 * a * c.intensity + 0.12, 0.9 * a),
      lLeg: L(-0.1 * a, 0.12 * a + 0.03, 0.1), rLeg: L(0.15 * a, 0.12 * a + 0.03, 0.1)});},
  celebrate: (t, c) => {const b = Math.abs(Math.sin(t * 2 * Math.PI * 1.3));
    return mix(REST, {y: 0.14 * b * c.intensity, headPitch: -0.15, lean: -0.05,
      lArm: L(0.35, 2.55 + 0.15 * Math.sin(t * 8), 0.15), rArm: L(0.35, 2.55 + 0.15 * Math.sin(t * 8 + 1), 0.15),
      lLeg: L(0.15 * b, 0.1, 0.5 * b), rLeg: L(0.15 * b, 0.1, 0.5 * b)});},
  argue: (t, c) => {const g = Math.sin(t * 2 * Math.PI * 1.6 + c.seed), k = c.intensity;
    return mix(REST, {lean: 0.16 * k, headPitch: 0.05 + 0.08 * Math.max(0, g), y: breathe(t, c.seed),
      rArm: L(0.9 + 0.45 * g * k, 0.3, 1.1 - 0.5 * g), lArm: L(0.5 - 0.3 * g * k, 0.35, 1.5), lLeg: L(0.2, 0.06, 0.1), rLeg: L(-0.15, 0.06, 0)});},
  fight: (t, c) => {
    const u = (t * 2.2) % 2, punchR = u < 1 ? Math.sin(Math.min(u, 1) * Math.PI) : 0, punchL = u >= 1 ? Math.sin((u - 1) * Math.PI) : 0;
    return mix(REST, {lean: 0.15, twist: 0.2 * (punchR - punchL), y: -0.06 + Math.sin(t * 9) * 0.015,
      rArm: L(0.9 + 0.6 * punchR, 0.15, 2.0 - 1.9 * punchR), lArm: L(0.9 + 0.6 * punchL, 0.15, 2.0 - 1.9 * punchL),
      lLeg: L(0.35, 0.1, 0.35), rLeg: L(-0.3, 0.1, 0.25)});},
  work: (t, c) => {const h = Math.sin(t * 2 * Math.PI * 1.8);
    return mix(REST, {lean: 0.22, headPitch: 0.25, y: -0.03, rArm: L(1.0 + 0.55 * h, 0.2, 0.9 - 0.4 * h), lArm: L(0.8, 0.1, 1.2), lLeg: L(0.1, 0.1, 0.15), rLeg: L(-0.05, 0.1, 0.05)});},
  computer: (t, c) => {const s = mix(REST, SIT);
    return mix(s, {lean: 0.12, headPitch: 0.18 + Math.sin(t * 0.6) * 0.03,
      rArm: L(1.05 + Math.sin(t * 17) * 0.05, 0.08, 1.25), lArm: L(1.05 + Math.sin(t * 15 + 1) * 0.05, 0.08, 1.25)});},
  hold: (t, c) => mix(ACTION_FNS.idle(t, c), {rArm: L(0.55, 0.15, 1.35), headPitch: 0.08}),
  wave: (t, c) => {const a = smooth(t / 0.3);
    return mix(ACTION_FNS.idle(t, c), {rArm: L(0.2, 2.5 * a, 0.5 + 0.45 * Math.sin(t * 2 * Math.PI * 2.2)), headRoll: -0.08});},
  shrug: (t, c) => {const a = Math.sin(clamp01(t / 0.8) * Math.PI);
    return mix(ACTION_FNS.idle(t, c), {y: 0.02 * a, headRoll: 0.15 * a, lArm: L(0.4, 0.5 * a + 0.12, 1.6 * a), rArm: L(0.4, 0.5 * a + 0.12, 1.6 * a)});},
  facepalm: (t, c) => {const a = smooth(t / 0.35);
    return mix(ACTION_FNS.idle(t, c), {headPitch: 0.35 * a, lean: 0.08 * a, rArm: L(0.95 * a, 0.0, 2.45 * a + 0.1)});},
  push: (t, c) => {const p = Math.sin(t * 2 * Math.PI * 0.9) * c.intensity;
    return mix(REST, {lean: 0.5 + 0.06 * p, y: -0.1, headPitch: -0.35, rArm: L(1.35, 0.1, 0.55 + 0.2 * p), lArm: L(1.35, 0.1, 0.55 + 0.2 * p),
      lLeg: L(0.45, 0.05, 0.7), rLeg: L(-0.45 - 0.08 * p, 0.05, 0.15)});},
  thumbsup: (t, c) => {const a = smooth(t / 0.3);
    return mix(ACTION_FNS.idle(t, c), {rArm: L(1.1 * a, 0.25, 1.5 * a), headRoll: -0.1 * a});},
};

export function blendPose(a: Pose, b: Pose, t: number): Pose {
  const lb = (x: Limb, y: Limb): Limb => ({fwd: lerp(x.fwd, y.fwd, t), out: lerp(x.out, y.out, t), bend: lerp(x.bend, y.bend, t)});
  const n = (k: keyof Pose) => lerp(a[k] as number, b[k] as number, t);
  return {y: n('y'), lean: n('lean'), side: n('side'), twist: n('twist'), tilt: n('tilt'), headPitch: n('headPitch'), headYaw: n('headYaw'), headRoll: n('headRoll'),
    lArm: lb(a.lArm, b.lArm), rArm: lb(a.rArm, b.rArm), lLeg: lb(a.lLeg, b.lLeg), rLeg: lb(a.rLeg, b.rLeg)};
}

export type CharacterFrame = {
  pose: Pose; position: Vec3; facing: number; expression: Expression; talking: boolean; prop?: string; action: Action;
};

const LOCOMOTION = new Set<Action>(['walk', 'run', 'escape']);
const BLEND = 0.3;
const hash = (s: string) => {let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return (h >>> 0) % 1000 / 100;};
const easeMove = (x: number) => {const c = clamp01(x); return c < 0.15 ? (c * c) / 0.3 : c > 0.85 ? 1 - ((1 - c) * (1 - c)) / 0.3 : c - 0.075;} ;
const normMove = (x: number) => easeMove(x) / easeMove(1);
const angleLerp = (a: number, b: number, t: number) => {let d = ((b - a + 540) % 360) - 180; return a + d * t;};

/** Evaluate a character's action track at scene time t (seconds). Pure. */
export function evaluateCharacter(ch: SceneCharacter, t: number, sceneDuration: number): CharacterFrame {
  const seed = hash(ch.id);
  const cues = [...ch.track].sort((a, b) => a.start - b.start);
  let pos: Vec3 = [...ch.position] as Vec3;
  let facing = ch.facing;
  let prevFacing = facing;
  let result: CharacterFrame | null = null;
  let prevPose: Pose | null = null;

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const end = cue.end ?? cues[i + 1]?.start ?? sceneDuration;
    const dur = Math.max(0.01, end - cue.start);
    const from = pos;
    const to = cue.to ?? from;
    const dist = Math.hypot(to[0] - from[0], to[2] - from[2]);
    const moveYaw = dist > 0.01 ? (Math.atan2(to[0] - from[0], to[2] - from[2]) * 180) / Math.PI : null;
    const targetFacing = cue.facing ?? moveYaw ?? facing;
    const evalAt = (tt: number): {pose: Pose; p: Vec3; f: number} => {
      const local = Math.max(0, tt - cue.start);
      const k = normMove(local / dur);
      const p: Vec3 = [lerp(from[0], to[0], k), lerp(from[1], to[1], k), lerp(from[2], to[2], k)];
      const travel = LOCOMOTION.has(cue.action) && dist > 0.01 ? dist * k : 0;
      const pose = ACTION_FNS[cue.action](local * cue.speed, {intensity: cue.intensity, travel, seed});
      const f = angleLerp(prevFacing, targetFacing, smooth(local / 0.3));
      return {pose, p, f};
    };
    if (t < end || i === cues.length - 1) {
      const cur = evalAt(t);
      let pose = cur.pose;
      const local = t - cue.start;
      if (prevPose && local < BLEND) pose = blendPose(prevPose, pose, smooth(local / BLEND));
      result = {pose, position: cur.p, facing: cur.f, expression: cue.expression ?? ch.expression,
        talking: cue.action === 'talk' || cue.action === 'argue', prop: cue.prop, action: cue.action};
      break;
    }
    const done = evalAt(end);
    prevPose = done.pose; pos = to; facing = targetFacing; prevFacing = targetFacing;
  }
  return result!;
}
