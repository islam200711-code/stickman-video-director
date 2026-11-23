/**
 * Modular environment kits (Priority 6): industrial, lab/control, corridor, ruins, compound,
 * hideout. Built from primitives, deterministic, moderate geometry; reusable by any preset.
 */
import React from 'react';
import * as THREE from 'three';
import {mat, rng, Scatter, type V3} from './assets';

const M: React.FC<{p?: V3; r?: V3; s?: V3 | number; m: THREE.Material; children: React.ReactNode; shadow?: boolean}> = ({p, r, s, m, children, shadow = true}) => (
  <mesh position={p} rotation={r} scale={s} material={m} castShadow={shadow} receiveShadow>{children}</mesh>
);
const steel = () => mat('#5b636e', {rough: 0.45}), rust = () => mat('#8a5a3c', {rough: 0.8}), concrete = (c = '#8d8f91') => mat(c, {rough: 0.95});

export const Pipe: React.FC<{from: V3; to: V3; r?: number; color?: string}> = ({from, to, r = 0.12, color = '#6f7782'}) => {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return <group><mesh position={mid} quaternion={q} material={mat(color, {rough: 0.4})} castShadow><cylinderGeometry args={[r, r, len, 12]} /></mesh>
    {[a, b].map((p, i) => <mesh key={i} position={p} quaternion={q} material={mat('#4a5059', {rough: 0.4})}><cylinderGeometry args={[r * 1.35, r * 1.35, 0.12, 12]} /></mesh>)}</group>;
};
export const Tank: React.FC<{p: V3; r?: number; h?: number; color?: string}> = ({p, r = 1.2, h = 4, color = '#9aa3ad'}) => (
  <group position={p}>
    <M p={[0, h / 2, 0]} m={mat(color, {rough: 0.5})}><cylinderGeometry args={[r, r, h, 24]} /></M>
    <M p={[0, h, 0]} m={mat(color, {rough: 0.5})}><sphereGeometry args={[r, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></M>
    {[0.25, 0.6].map((y) => <M key={y} p={[0, h * y, 0]} m={steel()}><torusGeometry args={[r * 1.01, 0.04, 6, 32]} /></M>)}
    <M p={[r * 0.98, h * 0.45, 0]} m={mat('#f2c230', {rough: 0.6})} shadow={false}><boxGeometry args={[0.02, 0.35, 0.8]} /></M>
  </group>
);
export const Column: React.FC<{p: V3; h?: number}> = ({p, h = 6}) => (
  <group position={p}><M p={[0, h / 2, 0]} m={steel()}><boxGeometry args={[0.32, h, 0.32]} /></M>
    {[0.1, -0.1].map((x) => <M key={x} p={[x, h / 2, 0]} m={mat('#4a5059', {rough: 0.5})}><boxGeometry args={[0.06, h, 0.42]} /></M>)}</group>
);
export const Catwalk: React.FC<{p: V3; length: number; y?: number}> = ({p, length, y = 3.4}) => (
  <group position={p}>
    <M p={[0, y, 0]} m={mat('#3e444c', {rough: 0.5})}><boxGeometry args={[length, 0.08, 1.2]} /></M>
    {[-0.6, 0.6].map((z) => <group key={z}>
      <M p={[0, y + 1.0, z]} m={mat('#f2c230', {rough: 0.6})}><boxGeometry args={[length, 0.05, 0.05]} /></M>
      {Array.from({length: Math.floor(length / 1.2) + 1}, (_, i) => <M key={i} p={[-length / 2 + i * 1.2, y + 0.5, z]} m={steel()}><boxGeometry args={[0.05, 1.0, 0.05]} /></M>)}
    </group>)}
  </group>
);
export const Crate: React.FC<{p: V3; s?: number; r?: number}> = ({p, s = 1, r = 0}) => (
  <group position={p} rotation={[0, r, 0]} scale={s}><M p={[0, 0.4, 0]} m={mat('#9c6b3c', {rough: 0.85})}><boxGeometry args={[0.8, 0.8, 0.8]} /></M>
    {[-1, 1].map((k) => <M key={k} p={[0, 0.4, k * 0.405]} m={mat('#7a522c', {rough: 0.9})} shadow={false}><boxGeometry args={[0.82, 0.1, 0.01]} /></M>)}</group>
);
export const Barrel: React.FC<{p: V3; color?: string}> = ({p, color = '#2f6fa0'}) => (
  <group position={p}><M p={[0, 0.45, 0]} m={mat(color, {rough: 0.5})}><cylinderGeometry args={[0.3, 0.3, 0.9, 16]} /></M>
    {[0.2, 0.7].map((y) => <M key={y} p={[0, y, 0]} m={mat('#222', {rough: 0.5})} shadow={false}><torusGeometry args={[0.305, 0.015, 6, 20]} /></M>)}</group>
);
export const HangingLamp: React.FC<{p: V3; on?: boolean; color?: string; intensity?: number}> = ({p, on = true, color = '#ffe6b0', intensity = 6}) => (
  <group position={p}>
    <M p={[0, 0.6, 0]} m={mat('#222')} shadow={false}><cylinderGeometry args={[0.01, 0.01, 1.2, 4]} /></M>
    <M p={[0, 0, 0]} m={mat('#3b4048', {rough: 0.4, side: THREE.DoubleSide})} shadow={false}><coneGeometry args={[0.35, 0.25, 16, 1, true]} /></M>
    <mesh position={[0, -0.08, 0]} material={mat(color, {emissive: on ? 2 : 0.1})}><sphereGeometry args={[0.1, 10, 8]} /></mesh>
    {on && <pointLight position={[0, -0.3, 0]} intensity={intensity} distance={9} decay={1.6} color={color} />}
  </group>
);
/** Console desk with emissive screens; screen colour sells the mood (green = data, red = alarm). */
export const Console: React.FC<{p: V3; r?: number; screen?: string; screens?: number}> = ({p, r = 0, screen = '#3dff8a', screens = 3}) => (
  <group position={p} rotation={[0, r, 0]}>
    <M p={[0, 0.45, 0]} m={mat('#2c3138', {rough: 0.6})}><boxGeometry args={[screens * 0.75, 0.9, 0.7]} /></M>
    <M p={[0, 0.92, 0.12]} r={[-0.5, 0, 0]} m={mat('#1d2127', {rough: 0.6})}><boxGeometry args={[screens * 0.75, 0.05, 0.5]} /></M>
    {Array.from({length: screens}, (_, i) => <group key={i} position={[(i - (screens - 1) / 2) * 0.72, 1.35, -0.2]} rotation={[-0.08, 0, 0]}>
      <M m={mat('#15181d', {rough: 0.5})}><boxGeometry args={[0.66, 0.46, 0.05]} /></M>
      <mesh position={[0, 0, 0.03]} material={mat(screen, {emissive: 1.1})}><planeGeometry args={[0.58, 0.38]} /></mesh>
      {[0.1, 0.0, -0.1].map((y, k) => <mesh key={k} position={[-0.05 + k * 0.03, y, 0.035]} material={mat('#0b2a17', {emissive: 0.2})}><planeGeometry args={[0.4 - k * 0.1, 0.03]} /></mesh>)}
    </group>)}
  </group>
);
export const ServerRack: React.FC<{p: V3; r?: number; seed?: number}> = ({p, r = 0, seed = 2}) => {
  const rr = rng(seed);
  return <group position={p} rotation={[0, r, 0]}><M p={[0, 1.0, 0]} m={mat('#1f2329', {rough: 0.5})}><boxGeometry args={[0.7, 2.0, 0.8]} /></M>
    {Array.from({length: 14}, (_, i) => <mesh key={i} position={[-0.22 + (i % 2) * 0.1, 0.3 + Math.floor(i / 2) * 0.24, 0.41]} material={mat(rr() > 0.3 ? '#3dff8a' : '#ff9a3d', {emissive: 1.6})}><planeGeometry args={[0.04, 0.04]} /></mesh>)}</group>;
};
/** Signal antenna / dish — the "signal" set piece. */
export const Antenna: React.FC<{p: V3; h?: number; blink?: boolean}> = ({p, h = 9, blink = true}) => (
  <group position={p}>
    {[[-0.5, -0.5], [0.5, -0.5], [0, 0.5]].map(([x, z], i) => <M key={i} p={[x * 0.5, h / 2, z * 0.5]} r={[z * 0.06, 0, -x * 0.06]} m={steel()}><cylinderGeometry args={[0.05, 0.07, h, 6]} /></M>)}
    {Array.from({length: 6}, (_, i) => <M key={i} p={[0, 0.8 + i * (h / 7), 0]} m={steel()}><torusGeometry args={[0.35 - i * 0.03, 0.025, 4, 3]} /></M>)}
    <group position={[0, h * 0.82, 0.4]} rotation={[0.5, 0.3, 0]}><M m={mat('#c9ced4', {rough: 0.4, side: THREE.DoubleSide})}><sphereGeometry args={[1.1, 20, 8, 0, Math.PI * 2, 0, 0.9]} /></M>
      <M p={[0, 0.55, 0]} m={steel()}><cylinderGeometry args={[0.03, 0.03, 1.1, 6]} /></M></group>
    {blink && <mesh position={[0, h + 0.2, 0]} material={mat('#ff3b3b', {emissive: 2.4})}><sphereGeometry args={[0.12, 10, 8]} /></mesh>}
  </group>
);
export const BrokenWall: React.FC<{p: V3; w?: number; h?: number; r?: number; seed?: number; color?: string}> = ({p, w = 5, h = 4, r = 0, seed = 1, color = '#8f8a82'}) => {
  const rr = rng(seed); const n = 7;
  return <group position={p} rotation={[0, r, 0]}>{Array.from({length: n}, (_, i) => {const hh = h * (0.35 + rr() * 0.65); return <M key={i} p={[-w / 2 + (i + 0.5) * (w / n), hh / 2, 0]} m={concrete(color)}><boxGeometry args={[w / n + 0.02, hh, 0.35]} /></M>;})}
    {Array.from({length: 3}, (_, i) => <mesh key={i} position={[-w / 3 + i * (w / 3), h * 0.55, 0.18]} material={mat('#232323', {rough: 1})}><planeGeometry args={[0.7, 0.9]} /></mesh>)}</group>;
};
export const RuinShell: React.FC<{p: V3; w?: number; h?: number; seed?: number; color?: string}> = ({p, w = 6, h = 9, seed = 4, color}) => {
  const rr = rng(seed);
  return <group position={p}>
    <BrokenWall p={[0, 0, 0]} w={w} h={h} seed={seed} color={color} />
    <BrokenWall p={[-w / 2, 0, -1.5]} w={3} h={h * 0.8} r={Math.PI / 2} seed={seed + 1} color={color} />
    {Array.from({length: 5}, (_, i) => <M key={i} p={[(rr() - 0.5) * w, 0.2, 1 + rr()]} r={[rr(), rr(), rr()]} m={concrete('#7c776f')}><boxGeometry args={[0.4 + rr() * 0.8, 0.3 + rr() * 0.4, 0.4 + rr() * 0.6]} /></M>)}
  </group>;
};
export const ChainFence: React.FC<{p: V3; length: number; r?: number}> = ({p, length, r = 0}) => (
  <group position={p} rotation={[0, r, 0]}>
    {Array.from({length: Math.floor(length / 2.5) + 1}, (_, i) => <M key={i} p={[-length / 2 + i * 2.5, 1.1, 0]} m={steel()}><cylinderGeometry args={[0.04, 0.04, 2.2, 6]} /></M>)}
    <mesh position={[0, 1.05, 0]} material={mat('#9aa1a8', {rough: 0.6, side: THREE.DoubleSide})}><planeGeometry args={[length, 2.0, Math.floor(length * 4), 8]} /></mesh>
    <mesh position={[0, 1.05, 0.005]} material={new THREE.MeshBasicMaterial({color: '#3a3f45', wireframe: true})}><planeGeometry args={[length, 2.0, Math.floor(length * 5), 10]} /></mesh>
  </group>
);
export const Floodlight: React.FC<{p: V3; r?: number; on?: boolean}> = ({p, r = 0, on = true}) => (
  <group position={p} rotation={[0, r, 0]}>
    <M p={[0, 2.5, 0]} m={steel()}><cylinderGeometry args={[0.06, 0.09, 5, 8]} /></M>
    <M p={[0, 5.05, 0.2]} r={[0.5, 0, 0]} m={mat('#2b2f35')}><boxGeometry args={[0.7, 0.4, 0.2]} /></M>
    <mesh position={[0, 5.0, 0.32]} rotation={[0.5, 0, 0]} material={mat('#fff6d6', {emissive: on ? 2.2 : 0})}><planeGeometry args={[0.6, 0.3]} /></mesh>
    {on && <pointLight position={[0, 4.6, 0.8]} intensity={18} distance={16} decay={1.4} color="#fff2cc" />}
  </group>
);
export const Warehouse: React.FC<{p: V3; w?: number; h?: number; d?: number; color?: string; doorOpen?: boolean}> = ({p, w = 14, h = 7, d = 8, color = '#6d7680', doorOpen = true}) => (
  <group position={p}>
    <M p={[0, h / 2, 0]} m={mat(color, {rough: 0.8})}><boxGeometry args={[w, h, d]} /></M>
    {Array.from({length: Math.floor(w / 0.6)}, (_, i) => <mesh key={i} position={[-w / 2 + 0.3 + i * 0.6, h / 2, d / 2 + 0.01]} material={mat('#5c646d', {rough: 0.8})}><planeGeometry args={[0.08, h]} /></mesh>)}
    <mesh position={[0, 1.8, d / 2 + 0.02]} material={mat(doorOpen ? '#0b0c0e' : '#7a5a3c', {rough: 1})}><planeGeometry args={[3.4, 3.6]} /></mesh>
    <mesh position={[0, 3.9, d / 2 + 0.03]} material={mat('#f2c230', {rough: 0.6})}><planeGeometry args={[3.8, 0.2]} /></mesh>
    {[-w / 3, w / 3].map((x) => <mesh key={x} position={[x, h * 0.72, d / 2 + 0.02]} material={mat('#1a2230', {rough: 0.3, emissive: 0.15})}><planeGeometry args={[1.6, 0.9]} /></mesh>)}
  </group>
);
export const BunkBed: React.FC<{p: V3; r?: number}> = ({p, r = 0}) => (
  <group position={p} rotation={[0, r, 0]}>
    {[[-0.95, -0.45], [0.95, -0.45], [-0.95, 0.45], [0.95, 0.45]].map(([x, z], i) => <M key={i} p={[x, 0.95, z]} m={steel()}><boxGeometry args={[0.06, 1.9, 0.06]} /></M>)}
    {[0.4, 1.4].map((y) => <group key={y}><M p={[0, y, 0]} m={mat('#4b5563')}><boxGeometry args={[1.95, 0.08, 0.95]} /></M><M p={[0, y + 0.1, 0]} m={mat('#c8b898', {rough: 1})}><boxGeometry args={[1.85, 0.14, 0.85]} /></M>
      <M p={[-0.7, y + 0.22, 0]} m={mat('#efe8dc', {rough: 1})}><boxGeometry args={[0.35, 0.1, 0.55]} /></M></group>)}
  </group>
);
export const HazardFloor: React.FC<{p: V3; w: number; d: number}> = ({p, w, d}) => (
  <group position={p}>{Array.from({length: Math.floor(w / 0.5)}, (_, i) => <mesh key={i} position={[-w / 2 + 0.25 + i * 0.5, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0.7]} material={mat(i % 2 ? '#f2c230' : '#1d1d1f', {rough: 0.9})} receiveShadow><planeGeometry args={[0.3, d]} /></mesh>)}</group>
);
export {Scatter, rng};
