/**
 * Procedural, joint-based stickman rig for React Three Fiber.
 * Hierarchy: root(position, facing) -> hip(pose.y, tilt) -> torso(twist/lean/side)
 *   -> shoulders -> upperArm -> elbow -> forearm -> hand(+held prop)
 *   -> neck -> head(face, accessory)
 *   hip -> thigh -> knee -> shin -> foot
 * The rig has no internal state: it renders whatever CharacterFrame it receives.
 */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {PROPORTIONS as P, type CharacterFrame, type Limb} from '../animations/library';
import type {CharacterProfile, Expression} from '../schema/scene';
import {BUILD_THICKNESS} from '../characters';
import {HandProp} from './props';

const R = 0.045; // base limb radius

type MatProps = {color: string};
const Ink: React.FC<MatProps> = ({color}) => <meshStandardMaterial color={color} roughness={0.55} metalness={0} />;

const Bone: React.FC<{len: number; r: number; color: string}> = ({len, r, color}) => (
  <mesh position={[0, -len / 2, 0]} castShadow>
    <capsuleGeometry args={[r, len, 6, 12]} />
    <Ink color={color} />
  </mesh>
);

const LimbChain: React.FC<{
  limb: Limb; side: 1 | -1; upper: number; lower: number; r: number; color: string; leg?: boolean; children?: React.ReactNode;
}> = ({limb, side, upper, lower, r, color, leg, children}) => (
  <group rotation={[-limb.fwd, 0, side * limb.out]}>
    <Bone len={upper} r={r} color={color} />
    <mesh position={[0, -upper, 0]}><sphereGeometry args={[r * 1.02, 12, 10]} /><Ink color={color} /></mesh>
    <group position={[0, -upper, 0]} rotation={[leg ? limb.bend : -limb.bend, 0, 0]}>
      <Bone len={lower} r={r * 0.92} color={color} />
      <group position={[0, -lower, 0]}>{children}</group>
    </group>
  </group>
);

const FACE: Record<Expression, {mouth: number; brow: number; eye: number; browY?: number}> = {
  neutral: {mouth: 0.005, brow: 0, eye: 1},
  happy: {mouth: 0.045, brow: 0.1, eye: 0.9},
  sad: {mouth: -0.035, brow: -0.35, eye: 0.9},
  angry: {mouth: -0.02, brow: 0.5, eye: 0.85},
  surprised: {mouth: 0, brow: 0, eye: 1.35, browY: 0.03},
  thinking: {mouth: -0.008, brow: -0.2, eye: 0.8},
  worried: {mouth: -0.025, brow: -0.45, eye: 1.1},
  determined: {mouth: 0.0, brow: 0.35, eye: 0.85},
};

const Mouth: React.FC<{curve: number; open: number; z: number}> = ({curve, open, z}) => {
  const geo = useMemo(() => {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.055, 0, 0), new THREE.Vector3(0, -curve * 2, 0.01), new THREE.Vector3(0.055, 0, 0));
    return new THREE.TubeGeometry(c, 12, 0.009, 6, false);
  }, [curve]);
  return (
    <group position={[0, -0.065, z]}>
      {open > 0.02 ? (
        <mesh scale={[0.045, Math.max(0.01, open * 0.05), 0.02]}><sphereGeometry args={[1, 16, 10]} /><meshBasicMaterial color="#141414" /></mesh>
      ) : (
        <mesh geometry={geo}><meshBasicMaterial color="#141414" /></mesh>
      )}
    </group>
  );
};

const Head: React.FC<{profile: CharacterProfile; expression: Expression; talkOpen: number; blink: number}> = ({profile, expression, talkOpen, blink}) => {
  const hr = P.head;
  const f = FACE[expression];
  const z = hr * 0.93;
  const eyeH = Math.max(0.08, f.eye * (1 - blink));
  return (
    <group position={[0, hr, 0]}>
      <mesh castShadow><sphereGeometry args={[hr, 28, 20]} /><meshStandardMaterial color={profile.headColor ?? '#fdfdfb'} roughness={0.7} /></mesh>
      {/* inverted-hull outline keeps the classic "drawn circle" read */}
      <mesh scale={1.09}><sphereGeometry args={[hr, 28, 20]} /><meshBasicMaterial color={profile.color} side={THREE.BackSide} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.058, 0.025, z]} scale={[0.022, 0.03 * eyeH, 0.012]}><sphereGeometry args={[1, 12, 10]} /><meshBasicMaterial color="#141414" /></mesh>
          <mesh position={[s * 0.06, 0.082 + (f.browY ?? 0), z - 0.01]} rotation={[0, 0, -s * f.brow]}>
            <boxGeometry args={[0.055, 0.012, 0.01]} /><meshBasicMaterial color="#141414" />
          </mesh>
        </group>
      ))}
      <Mouth curve={f.mouth} open={expression === 'surprised' ? 0.6 + talkOpen * 0.3 : talkOpen} z={z - 0.005} />
      <Accessory profile={profile} />
    </group>
  );
};

const Accessory: React.FC<{profile: CharacterProfile}> = ({profile}) => {
  const c = profile.accent ?? '#e33';
  const hr = P.head;
  switch (profile.accessory) {
    case 'cap':
      return (<group position={[0, hr * 0.35, 0]}>
        <mesh><sphereGeometry args={[hr * 1.04, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={c} /></mesh>
        <mesh position={[0, 0.005, hr * 0.85]} rotation={[0.15, 0, 0]}><boxGeometry args={[hr * 1.3, 0.015, hr * 0.8]} /><meshStandardMaterial color={c} /></mesh>
      </group>);
    case 'bow':
      return (<group position={[hr * 0.6, hr * 0.75, 0]} rotation={[0, 0, 0.4]}>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.05, 0, 0]} rotation={[0, 0, s * Math.PI / 2]}><coneGeometry args={[0.04, 0.09, 12]} /><meshStandardMaterial color={c} /></mesh>)}
      </group>);
    case 'glasses':
      return (<group position={[0, 0.025, hr * 0.97]}>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.06, 0, 0]}><torusGeometry args={[0.038, 0.007, 8, 20]} /><meshBasicMaterial color={c} /></mesh>)}
        <mesh><boxGeometry args={[0.04, 0.007, 0.007]} /><meshBasicMaterial color={c} /></mesh>
      </group>);
    default:
      return null;
  }
};

export const Stickman: React.FC<{profile: CharacterProfile; frame: CharacterFrame; time: number; lineWidth?: number}> = ({profile, frame, time, lineWidth = 1}) => {
  const {pose} = frame;
  const r = R * BUILD_THICKNESS[profile.build] * lineWidth;
  const color = profile.color;
  const talkOpen = frame.talking ? Math.max(0, Math.sin(time * 17) * 0.5 + Math.sin(time * 11.3) * 0.5) : 0;
  // deterministic blink every ~3.4s, offset per character
  const seed = profile.id.length * 0.77;
  const bp = (time + seed) % 3.4;
  const blink = bp < 0.12 ? Math.sin((bp / 0.12) * Math.PI) : 0;
  const yaw = (frame.facing * Math.PI) / 180;
  const shoulderY = P.torso - 0.04;
  return (
    <group position={frame.position} rotation={[0, yaw, 0]} scale={profile.scale}>
      <group position={[0, P.hip + pose.y, 0]} rotation={[pose.tilt, 0, 0]}>
        {/* torso */}
        <group rotation={new THREE.Euler(pose.lean, pose.twist, pose.side, 'YXZ')}>
          <mesh position={[0, P.torso / 2, 0]} castShadow><capsuleGeometry args={[r * 1.1, P.torso, 6, 12]} /><Ink color={color} /></mesh>
          {profile.accessory === 'tie' && (
            <mesh position={[0, shoulderY - 0.17, r * 1.1]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.04, 0.26, 4]} /><meshStandardMaterial color={profile.accent} /></mesh>
          )}
          {profile.accessory === 'scarf' && (
            <group position={[0, P.torso + 0.02, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.07, 0.03, 10, 20]} /><meshStandardMaterial color={profile.accent} /></mesh>
              <mesh position={[0.05, -0.1, 0.06]} rotation={[0.2, 0, 0.15]}><boxGeometry args={[0.05, 0.18, 0.02]} /><meshStandardMaterial color={profile.accent} /></mesh>
            </group>
          )}
          {/* shoulder bar */}
          <mesh position={[0, shoulderY, 0]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[r, P.shoulderWidth * 2, 4, 10]} /><Ink color={color} /></mesh>
          {/* neck + head */}
          <group position={[0, P.torso, 0]}>
            <mesh position={[0, P.neck / 2, 0]}><cylinderGeometry args={[r * 0.9, r * 0.9, P.neck, 10]} /><Ink color={color} /></mesh>
            <group position={[0, P.neck, 0]} rotation={new THREE.Euler(pose.headPitch, pose.headYaw, pose.headRoll, 'YXZ')}>
              <Head profile={profile} expression={frame.expression} talkOpen={talkOpen} blink={blink} />
            </group>
          </group>
          {/* arms: character's left is +x */}
          <group position={[P.shoulderWidth, shoulderY, 0]}>
            <LimbChain limb={pose.lArm} side={1} upper={P.upperArm} lower={P.forearm} r={r} color={color}>
              <mesh><sphereGeometry args={[r * 1.35, 12, 10]} /><Ink color={color} /></mesh>
            </LimbChain>
          </group>
          <group position={[-P.shoulderWidth, shoulderY, 0]}>
            <LimbChain limb={pose.rArm} side={-1} upper={P.upperArm} lower={P.forearm} r={r} color={color}>
              <mesh><sphereGeometry args={[r * 1.35, 12, 10]} /><Ink color={color} /></mesh>
              {frame.prop && <HandProp kind={frame.prop} />}
            </LimbChain>
          </group>
        </group>
        {/* legs */}
        {([1, -1] as const).map((s) => (
          <group key={s} position={[s * P.hipWidth, 0, 0]}>
            <LimbChain limb={s === 1 ? pose.lLeg : pose.rLeg} side={s} upper={P.thigh} lower={P.shin} r={r * 1.05} color={color} leg>
              <group rotation={[(s === 1 ? pose.lLeg : pose.rLeg).fwd - (s === 1 ? pose.lLeg : pose.rLeg).bend, 0, 0]}>
                <mesh position={[0, -0.01, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow><capsuleGeometry args={[r * 1.1, 0.1, 4, 10]} /><Ink color={color} /></mesh>
              </group>
            </LimbChain>
          </group>
        ))}
      </group>
    </group>
  );
};
