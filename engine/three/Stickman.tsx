/**
 * Style C — Stylized 3D Stickman renderer.
 * Draws smooth, connected, tapered limbs through the solved skeleton (see
 * skeleton.ts), rounded mitten hands with gesture shapes, soft shoes, and a
 * large expressive head (sclera + pupils + highlights, brows, shaped mouths,
 * blush). The component holds no state: geometry is a pure function of the frame.
 */
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {PROPORTIONS as P, type CharacterFrame, type HandShape} from '../animations/library';
import type {CharacterProfile, Expression, Vec3} from '../schema/scene';
import {BUILD_THICKNESS} from '../characters';
import {HandProp} from './props';
import {solveSkeleton, type ArmJoints, type Skeleton} from './skeleton';
import {ContactShadow} from './ContactShadow';

const V3 = THREE.Vector3;

/* ---------- materials (cached per colour; smooth, controlled highlights) ---------- */
const matCache = new Map<string, THREE.Material>();
function bodyMat(color: string) {
  const k = `b${color}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({color, roughness: 0.42, metalness: 0, envMapIntensity: 0.6}));
  return matCache.get(k)!;
}
function flatMat(color: string, opacity = 1) {
  const k = `f${color}${opacity}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshBasicMaterial({color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1}));
  return matCache.get(k)!;
}
function skinMat(color: string) {
  const k = `h${color}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({color, roughness: 0.55, metalness: 0, emissive: new THREE.Color(color), emissiveIntensity: 0.12}));
  return matCache.get(k)!;
}
const darker = (c: string, f = 0.55) => '#' + new THREE.Color(c).multiplyScalar(f).getHexString();

/* ---------- smooth tapered tube through joints ---------- */
function taperTube(points: THREE.Vector3[], radii: number[], segs = 22, radial = 12): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const geo = new THREE.TubeGeometry(curve, segs, 1, radial, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const c = new V3(), v = new V3();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    curve.getPointAt(u, c);
    const f = u * (radii.length - 1), i0 = Math.floor(f), i1 = Math.min(radii.length - 1, i0 + 1);
    const r = THREE.MathUtils.lerp(radii[i0], radii[i1], f - i0);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

const Tube: React.FC<{points: THREE.Vector3[]; radii: number[]; material: THREE.Material}> = ({points, radii, material}) => {
  const key = points.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join('|') + radii.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(() => taperTube(points, radii), [key]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={material} castShadow receiveShadow />;
};
const Ball: React.FC<{at: THREE.Vector3; r: number; material: THREE.Material; scale?: Vec3}> = ({at, r, material, scale = [1, 1, 1]}) => (
  <mesh position={at} scale={scale.map((s) => s * r) as Vec3} material={material} castShadow><sphereGeometry args={[1, 18, 14]} /></mesh>
);

/* ---------- hands ---------- */
function handQuat(a: ArmJoints) {
  const y = a.handDir.clone().normalize();
  const z = a.handUp.clone().sub(y.clone().multiplyScalar(a.handUp.dot(y))).normalize();
  const x = new V3().crossVectors(y, z);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
const Hand: React.FC<{arm: ArmJoints; shape: HandShape; side: 1 | -1; mat: THREE.Material; r: number; prop?: string}> = ({arm, shape, side, mat, r, prop}) => {
  const q = handQuat(arm);
  const s = r / 0.042; // scale hands with build
  const palm: Vec3 = shape === 'fist' || shape === 'point' || shape === 'thumb' ? [0.05, 0.052, 0.045] : [0.05, 0.068, 0.03];
  return (
    <group position={arm.wrist} quaternion={q} scale={s}>
      <mesh position={[0, 0.045, 0]} scale={palm} material={mat} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
      {(shape === 'open' || shape === 'relaxed') && (
        <mesh position={[side * 0.042, 0.03, 0.012]} rotation={[0, 0, side * 0.7]} scale={[0.017, 0.035, 0.017]} material={mat}><sphereGeometry args={[1, 10, 8]} /></mesh>
      )}
      {shape === 'point' && (
        <mesh position={[0, 0.1, 0.015]} material={mat} castShadow><capsuleGeometry args={[0.014, 0.06, 4, 8]} /></mesh>
      )}
      {shape === 'thumb' && (
        <mesh position={[0, 0.05, 0.055]} rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow><capsuleGeometry args={[0.015, 0.045, 4, 8]} /></mesh>
      )}
      {prop && side === -1 && <group position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}><HandProp kind={prop} /></group>}
    </group>
  );
};

/* ---------- face ---------- */
export type FaceDef = {mouth: 'line' | 'smile' | 'grin' | 'frown' | 'o' | 'wavy' | 'smirk' | 'flat'; brow: number; browY: number; eyeH: number; pupil: [number, number]; blush: boolean; lid?: number};
export const FACE: Record<Expression, FaceDef> = {
  neutral: {mouth: 'line', brow: 0, browY: 0, eyeH: 1, pupil: [0, 0], blush: false},
  happy: {mouth: 'smile', brow: 0.12, browY: 0.008, eyeH: 0.9, pupil: [0, 0], blush: true},
  excited: {mouth: 'grin', brow: 0.15, browY: 0.02, eyeH: 1.1, pupil: [0, 0.004], blush: true},
  sad: {mouth: 'frown', brow: -0.38, browY: 0, eyeH: 0.85, pupil: [0, -0.01], blush: false},
  angry: {mouth: 'flat', brow: 0.55, browY: -0.012, eyeH: 0.8, pupil: [0, 0], blush: false, lid: 0.3},
  surprised: {mouth: 'o', brow: 0.0, browY: 0.03, eyeH: 1.25, pupil: [0, 0], blush: false},
  scared: {mouth: 'wavy', brow: -0.45, browY: 0.025, eyeH: 1.3, pupil: [0, 0], blush: false},
  thinking: {mouth: 'smirk', brow: -0.15, browY: 0.01, eyeH: 0.9, pupil: [0.012, 0.014], blush: false},
  worried: {mouth: 'wavy', brow: -0.45, browY: 0.008, eyeH: 1.05, pupil: [0, -0.004], blush: false},
  determined: {mouth: 'flat', brow: 0.35, browY: -0.006, eyeH: 0.85, pupil: [0, 0], blush: false, lid: 0.15},
  confused: {mouth: 'smirk', brow: -0.3, browY: 0.012, eyeH: 1, pupil: [-0.01, 0.008], blush: false},
  smug: {mouth: 'smirk', brow: 0.18, browY: 0, eyeH: 0.6, pupil: [0.006, 0], blush: false, lid: 0.45},
};
const INK = '#1a1a1f';

function curveGeo(pts: [number, number][], z: number, r: number) {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new V3(x, y, z)));
  return new THREE.TubeGeometry(c, 16, r, 6, false);
}
const MOUTH_GEOS: Record<string, THREE.BufferGeometry> = {};
function mouthGeo(kind: string) {
  if (!MOUTH_GEOS[kind]) {
    const z = 0;
    const g = {
      line: curveGeo([[-0.035, 0], [0, -0.004], [0.035, 0]], z, 0.0085),
      smile: curveGeo([[-0.055, 0.012], [-0.025, -0.012], [0.025, -0.012], [0.055, 0.012]], z, 0.009),
      frown: curveGeo([[-0.045, -0.012], [-0.02, 0.008], [0.02, 0.008], [0.045, -0.012]], z, 0.009),
      wavy: curveGeo([[-0.045, -0.004], [-0.02, 0.006], [0, -0.004], [0.02, 0.006], [0.045, -0.004]], z, 0.008),
      smirk: curveGeo([[-0.035, -0.004], [0.01, -0.006], [0.045, 0.012]], z, 0.0085),
      flat: curveGeo([[-0.045, 0], [0.045, 0]], z, 0.0095),
    } as Record<string, THREE.BufferGeometry>;
    Object.assign(MOUTH_GEOS, g);
  }
  return MOUTH_GEOS[kind];
}

/** Cross-fade facial parameters between expressions (brows/eyes/pupils glide, mouth swaps mid-way). */
export function blendFace(a: FaceDef, b: FaceDef, k: number): FaceDef {
  const l = (x: number, y: number) => x + (y - x) * k;
  return {mouth: k < 0.5 ? a.mouth : b.mouth, brow: l(a.brow, b.brow), browY: l(a.browY, b.browY), eyeH: l(a.eyeH, b.eyeH),
    pupil: [l(a.pupil[0], b.pupil[0]), l(a.pupil[1], b.pupil[1])], blush: k < 0.5 ? a.blush : b.blush, lid: l(a.lid ?? 0, b.lid ?? 0)};
}
const Face: React.FC<{expression: Expression; from?: Expression; k?: number; look?: [number, number]; talkOpen: number; blink: number; r: number; inkCol: string}> = ({expression, from, k = 1, look = [0, 0], talkOpen, blink, r, inkCol}) => {
  const f0 = blendFace(FACE[from ?? expression], FACE[expression], k);
  const f = {...f0, pupil: [f0.pupil[0] + look[0], f0.pupil[1] + look[1]] as [number, number]};
  const zf = r * 0.92;
  const lid = Math.max(blink, f.lid ?? 0);
  const eyeY = Math.max(0.06, f.eyeH * (1 - lid));
  const open = f.mouth === 'grin' ? 0.75 + talkOpen * 0.25 : f.mouth === 'o' ? 0.7 + talkOpen * 0.2 : talkOpen;
  const ink = flatMat(INK);
  return (
    <group>
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * r * 0.36, r * 0.12, zf * 0.96]} rotation={[-0.08, s * 0.34, 0]}>
          <mesh scale={[r * 0.27, r * 0.34 * eyeY, r * 0.1]} material={flatMat('#ffffff')}><sphereGeometry args={[1, 18, 14]} /></mesh>
          <mesh position={[f.pupil[0] - s * 0.004, f.pupil[1] - 0.004, r * 0.08]} scale={[r * 0.145, r * 0.18 * eyeY, r * 0.05]} material={ink}><sphereGeometry args={[1, 14, 10]} /></mesh>
          {eyeY > 0.3 && <mesh position={[f.pupil[0] + 0.008, f.pupil[1] + 0.012 * eyeY, r * 0.12]} scale={r * 0.04} material={flatMat('#ffffff')}><sphereGeometry args={[1, 8, 6]} /></mesh>}
          <mesh position={[0, r * (0.47 + f.browY * 5), r * 0.06]} rotation={[0, 0, Math.PI / 2 + s * f.brow]} material={flatMat(inkCol)}><capsuleGeometry args={[r * 0.048, r * 0.26, 4, 8]} /></mesh>
        </group>
      ))}
      <group position={[0, -r * 0.33, zf]} rotation={[-0.25, 0, 0]}>
        {open > 0.05 ? (
          <group>
            <mesh scale={[r * 0.24, r * 0.2 * open, r * 0.08]} material={flatMat('#5b1f26')}><sphereGeometry args={[1, 16, 12]} /></mesh>
            {open > 0.4 && <mesh position={[0, -r * 0.08 * open, r * 0.04]} scale={[r * 0.13, r * 0.07 * open, r * 0.05]} material={flatMat('#e06a78')}><sphereGeometry args={[1, 10, 8]} /></mesh>}
          </group>
        ) : (
          <mesh geometry={mouthGeo(f.mouth === 'grin' ? 'smile' : f.mouth === 'o' ? 'line' : f.mouth)} material={ink} scale={(r / 0.2) * 1.25} />
        )}
      </group>
      {f.blush && ([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * r * 0.58, -r * 0.14, zf * 0.78]} rotation={[0, s * 0.6, 0]} scale={[r * 0.15, r * 0.08, r * 0.02]} material={flatMat('#ff7a8a', 0.45)}><sphereGeometry args={[1, 10, 8]} /></mesh>
      ))}
    </group>
  );
};

const Accessory: React.FC<{profile: CharacterProfile; r: number}> = ({profile, r}) => {
  const c = profile.accent ?? '#e33';
  const m = bodyMat(c);
  switch (profile.accessory) {
    case 'cap':
      return (<group position={[0, r * 0.32, 0]} rotation={[-0.12, 0, 0]}>
        <mesh material={m} castShadow><sphereGeometry args={[r * 1.04, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[0, 0.0, r * 0.92]} rotation={[0.22, 0, 0]} scale={[1, 0.25, 1]} material={m} castShadow><cylinderGeometry args={[r * 0.62, r * 0.62, 0.05, 24, 1, false, -Math.PI / 2, Math.PI]} /></mesh>
        <mesh position={[0, r * 1.02, 0]} material={m}><sphereGeometry args={[r * 0.1, 10, 8]} /></mesh>
      </group>);
    case 'bow':
      return (<group position={[r * 0.55, r * 0.8, 0]} rotation={[0, 0, 0.5]}>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.055, 0, 0]} rotation={[0, 0, s * Math.PI / 2]} material={m}><coneGeometry args={[0.05, 0.1, 14]} /></mesh>)}
        <mesh material={m}><sphereGeometry args={[0.025, 10, 8]} /></mesh>
      </group>);
    case 'glasses':
      return (<group position={[0, r * 0.12, r * 0.98]}>
        {[-1, 1].map((s) => <mesh key={s} position={[s * r * 0.36, 0, 0]} material={flatMat(c)}><torusGeometry args={[r * 0.26, 0.008, 8, 24]} /></mesh>)}
        <mesh material={flatMat(c)}><boxGeometry args={[r * 0.22, 0.008, 0.008]} /></mesh>
      </group>);
    default:
      return null;
  }
};

export const Stickman: React.FC<{profile: CharacterProfile; frame: CharacterFrame; time: number; lineWidth?: number; gaze?: Vec3}> = ({profile, frame: frame0, time, lineWidth = 1, gaze}) => {
  // gaze: turn the head toward the target (clamped), the eyes cover the remainder
  let frame = frame0; let eyeLook: [number, number] = [0, 0];
  if (gaze && frame0.pose.tilt === 0) {
    const yawF = (frame0.facing * Math.PI) / 180;
    const d = new V3(gaze[0] - frame0.position[0], 0, gaze[2] - frame0.position[2]).applyAxisAngle(new V3(0, 1, 0), -yawF);
    const want = Math.atan2(d.x, d.z);
    const turn = THREE.MathUtils.clamp(want - frame0.pose.twist, -0.85, 0.85) * 0.75;
    const dist = Math.hypot(d.x, d.z) || 1;
    const pitch = THREE.MathUtils.clamp(-Math.atan2(gaze[1] - 1.75 * profile.scale, dist), -0.3, 0.3) * 0.5;
    frame = {...frame0, pose: {...frame0.pose, headYaw: frame0.pose.headYaw * 0.4 + turn, headPitch: frame0.pose.headPitch + pitch}};
    eyeLook = [THREE.MathUtils.clamp((want - turn) * 0.02, -0.014, 0.014), 0];
  }
  const {pose} = frame;
  const yaw = (frame.facing * Math.PI) / 180;
  // world -> character-local for IK targets
  const toLocal = (w?: Vec3) => {
    if (!w) return undefined;
    const v = new V3(w[0] - frame.position[0], w[1] - frame.position[1], w[2] - frame.position[2]).applyAxisAngle(new V3(0, 1, 0), -yaw);
    return v.multiplyScalar(1 / profile.scale);
  };
  const sk: Skeleton = solveSkeleton(pose, {reachLocal: {left: toLocal(frame.reach?.left), right: toLocal(frame.reach?.right)}, reachWeight: frame.reach?.weight ?? 0});
  const b = BUILD_THICKNESS[profile.build] * lineWidth;
  const mat = bodyMat(profile.color);
  const R = {torso: [0.072, 0.082, 0.07, 0.05].map((x) => x * b), arm: [0.05, 0.046, 0.04, 0.036].map((x) => x * b), leg: [0.06, 0.056, 0.048, 0.044].map((x) => x * b)};
  const talkOpen = frame.talking ? Math.max(0, Math.sin(time * 16) * 0.5 + Math.sin(time * 10.7) * 0.5) : 0;
  const seed = profile.id.length * 0.77 + profile.id.charCodeAt(0) * 0.13;
  const bp = (time + seed) % 3.6;
  const blink = bp < 0.13 ? Math.sin((bp / 0.13) * Math.PI) : 0;
  const hr = P.head;
  const footQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(pose.tilt, 0, 0));
  const fwd = new V3(0, 0, 1).applyQuaternion(footQ);
  const spineMid = sk.pelvis.clone().lerp(sk.neck, 0.5).add(new V3(0, 0, 0).applyQuaternion(sk.bodyQuat));
  const headCol = profile.headColor ?? '#fbf6ee';
  return (
    <group position={frame.position} rotation={[0, yaw, 0]} scale={profile.scale}>
      <ContactShadow center={[sk.pelvis.x, sk.pelvis.z]} height={Math.max(0, sk.pelvis.y - P.hip)} lying={pose.tilt !== 0} />
      {/* torso: one smooth tapered tube pelvis -> chest -> neck */}
      <Tube points={[sk.pelvis.clone().add(new V3(0, -0.04, 0).applyQuaternion(sk.bodyQuat)), spineMid, sk.chest, sk.neck.clone().add(new V3(0, P.neck, 0).applyQuaternion(sk.bodyQuat))]} radii={R.torso} material={mat} />
      <Ball at={sk.pelvis.clone().add(new V3(0, -0.035, 0).applyQuaternion(sk.bodyQuat))} r={R.torso[0] * 1.02} material={mat} />
      {/* arms start inside the chest for a connected shoulder line */}
      {([['l', sk.lArm, pose.lHand, 1], ['r', sk.rArm, pose.rHand, -1]] as const).map(([k, a, shape, side]) => (
        <group key={k}>
          <Tube points={[sk.chest.clone().lerp(a.shoulder, 0.35), a.shoulder, a.elbow, a.wrist]} radii={R.arm} material={mat} />
          <Hand arm={a} shape={shape} side={side} mat={mat} r={R.arm[3]} prop={frame.prop} />
        </group>
      ))}
      {/* legs flow from the pelvis */}
      {([['l', sk.lLeg], ['r', sk.rLeg]] as const).map(([k, l]) => (
        <group key={k}>
          <Tube points={[sk.pelvis.clone().lerp(l.hip, 0.4), l.hip, l.knee, l.ankle]} radii={R.leg} material={mat} />
          <mesh position={l.ankle.clone().add(fwd.clone().multiplyScalar(0.045)).add(new V3(0, -0.012, 0))} quaternion={footQ} scale={[0.068 * b, 0.05 * b, 0.12]} material={bodyMat(darker(profile.color, 0.7))} castShadow><sphereGeometry args={[1, 18, 12]} /></mesh>
        </group>
      ))}
      {/* body accessories */}
      {profile.accessory === 'scarf' && (
        <group position={sk.neck} quaternion={sk.bodyQuat}>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={bodyMat(profile.accent ?? '#e33')} castShadow><torusGeometry args={[0.068, 0.034, 12, 24]} /></mesh>
          <mesh position={[0.05, -0.09, 0.07]} rotation={[0.25, 0, 0.12]} material={bodyMat(profile.accent ?? '#e33')} castShadow><capsuleGeometry args={[0.026, 0.13, 4, 8]} /></mesh>
        </group>
      )}
      {profile.accessory === 'tie' && (
        <group position={sk.chest} quaternion={sk.bodyQuat}>
          <mesh position={[0, -0.14, 0.072 * b]} rotation={[0.08, 0, Math.PI]} scale={[1, 1, 0.35]} material={bodyMat(profile.accent ?? '#e33')}><coneGeometry args={[0.045, 0.24, 4]} /></mesh>
          <mesh position={[0, 0.02, 0.07 * b]} material={bodyMat(profile.accent ?? '#e33')}><sphereGeometry args={[0.025, 8, 6]} /></mesh>
        </group>
      )}
      {/* head */}
      <group position={sk.headCenter} quaternion={sk.headQuat}>
        <mesh scale={[1, 1.04, 0.97]} material={skinMat(headCol)} castShadow><sphereGeometry args={[hr, 36, 26]} /></mesh>
        <mesh scale={[1.045, 1.085, 1.015]} material={(() => {const k = `o${profile.color}`; if (!matCache.has(k)) matCache.set(k, new THREE.MeshBasicMaterial({color: darker(profile.color, 0.6), side: THREE.BackSide})); return matCache.get(k)!;})()}><sphereGeometry args={[hr, 36, 26]} /></mesh>
        <Face expression={frame.expression} from={frame.exprFrom} k={frame.exprK} look={eyeLook} talkOpen={talkOpen} blink={blink} r={hr} inkCol={darker(profile.color, 0.45)} />
        <Accessory profile={profile} r={hr} />
      </group>
    </group>
  );
};
