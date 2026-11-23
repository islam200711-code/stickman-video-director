/**
 * Skeleton solver: Pose -> joint positions in character-local space (metres,
 * origin at the feet, +z = facing). Pure math, no rendering, so it is testable
 * and the renderer can draw smooth connected geometry through the joints.
 *
 * Steps: forward kinematics -> optional 2-bone IK for hand targets -> ground
 * contact (body is lifted so feet never sink below the floor).
 */
import * as THREE from 'three';
import {PROPORTIONS as P, type Limb, type Pose} from '../animations/library';

export type V = THREE.Vector3;
export type ArmJoints = {shoulder: V; elbow: V; wrist: V; handDir: V; handUp: V};
export type LegJoints = {hip: V; knee: V; ankle: V};
export type Skeleton = {
  pelvis: V; chest: V; neck: V; headCenter: V; headQuat: THREE.Quaternion; bodyQuat: THREE.Quaternion;
  lArm: ArmJoints; rArm: ArmJoints; lLeg: LegJoints; rLeg: LegJoints; lift: number;
};

const m4 = () => new THREE.Matrix4();
const T = (x: number, y: number, z: number) => m4().makeTranslation(x, y, z);
const R = (x: number, y: number, z: number, order: THREE.EulerOrder = 'XYZ') => m4().makeRotationFromEuler(new THREE.Euler(x, y, z, order));
const pt = (m: THREE.Matrix4, x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z).applyMatrix4(m);
const dirOf = (m: THREE.Matrix4, x: number, y: number, z: number) => new THREE.Vector3(x, y, z).transformDirection(m);

function arm(torso: THREE.Matrix4, side: 1 | -1, l: Limb): ArmJoints {
  const sy = P.torso - P.shoulderDrop;
  const mu = torso.clone().multiply(T(side * P.shoulderWidth, sy, 0)).multiply(R(-l.fwd, 0, side * l.out));
  const ml = mu.clone().multiply(T(0, -P.upperArm, 0)).multiply(R(-l.bend, 0, 0));
  return {shoulder: pt(mu), elbow: pt(ml), wrist: pt(ml, 0, -P.forearm, 0), handDir: dirOf(ml, 0, -1, 0), handUp: dirOf(ml, 0, 0, 1)};
}
function leg(root: THREE.Matrix4, side: 1 | -1, l: Limb): LegJoints {
  const mt = root.clone().multiply(T(side * P.hipWidth, 0, 0)).multiply(R(-l.fwd, 0, side * l.out));
  const ms = mt.clone().multiply(T(0, -P.thigh, 0)).multiply(R(l.bend, 0, 0));
  return {hip: pt(mt), knee: pt(ms), ankle: pt(ms, 0, -P.shin, 0)};
}

/** Analytic two-bone IK. Keeps the elbow on the side of the FK elbow (natural pole). */
export function solveTwoBone(a: ArmJoints, target: V, weight: number): ArmJoints {
  if (weight <= 0) return a;
  const L1 = P.upperArm, L2 = P.forearm;
  const toT = target.clone().sub(a.shoulder);
  const d = THREE.MathUtils.clamp(toT.length(), Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
  const dir = toT.normalize();
  const x = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
  const hint = a.elbow.clone().sub(a.shoulder);
  const pole = hint.sub(dir.clone().multiplyScalar(hint.dot(dir)));
  if (pole.lengthSq() < 1e-8) pole.set(0, -1, -0.3);
  pole.normalize();
  const elbow = a.shoulder.clone().add(dir.clone().multiplyScalar(x)).add(pole.multiplyScalar(h));
  const wrist = a.shoulder.clone().add(dir.clone().multiplyScalar(d));
  const handDir = wrist.clone().sub(elbow).normalize();
  return {
    shoulder: a.shoulder,
    elbow: a.elbow.clone().lerp(elbow, weight),
    wrist: a.wrist.clone().lerp(wrist, weight),
    handDir: a.handDir.clone().lerp(handDir, weight).normalize(),
    handUp: a.handUp,
  };
}

export function solveSkeleton(pose: Pose, opts: {reachLocal?: {left?: V; right?: V}; reachWeight?: number} = {}): Skeleton {
  const root = T(0, P.hip + pose.y, 0).multiply(R(pose.tilt, 0, 0));
  const torso = root.clone().multiply(R(pose.lean, pose.twist, pose.side, 'YXZ'));
  const neckM = torso.clone().multiply(T(0, P.torso, 0));
  const headM = neckM.clone().multiply(T(0, P.neck, 0)).multiply(R(pose.headPitch, pose.headYaw, pose.headRoll, 'YXZ'));
  const lArm = arm(torso, 1, pose.lArm), rArm = arm(torso, -1, pose.rArm);
  const lLeg = leg(root, 1, pose.lLeg), rLeg = leg(root, -1, pose.rLeg);
  const sk: Skeleton = {
    pelvis: pt(root), chest: pt(torso, 0, P.torso - P.shoulderDrop, 0), neck: pt(neckM), headCenter: pt(headM, 0, P.head * 0.95, 0),
    headQuat: new THREE.Quaternion().setFromRotationMatrix(headM), bodyQuat: new THREE.Quaternion().setFromRotationMatrix(torso),
    lArm, rArm, lLeg, rLeg, lift: 0,
  };
  // ground contact: lowest foot sole sits on y=0 when standing (not while lying/airborne by design)
  const sole = 0.045;
  const lowest = Math.min(lLeg.ankle.y, rLeg.ankle.y) - sole;
  if (pose.tilt === 0 && lowest < 0) {
    sk.lift = -lowest;
    const up = new THREE.Vector3(0, sk.lift, 0);
    const all = [sk.pelvis, sk.chest, sk.neck, sk.headCenter, lArm.shoulder, lArm.elbow, lArm.wrist, rArm.shoulder, rArm.elbow, rArm.wrist, lLeg.hip, lLeg.knee, lLeg.ankle, rLeg.hip, rLeg.knee, rLeg.ankle];
    for (const v of new Set(all)) v.add(up);
  }
  // IK last, so hand targets are honoured after the ground-contact lift
  const w = opts.reachWeight ?? 0;
  if (opts.reachLocal?.left) sk.lArm = solveTwoBone(sk.lArm, opts.reachLocal.left, w);
  if (opts.reachLocal?.right) sk.rArm = solveTwoBone(sk.rArm, opts.reachLocal.right, w);
  return sk;
}
