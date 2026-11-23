/**
 * In-world (3D) event effects — procedural, deterministic, unlit flat-tone look to
 * match the 2D characters (posterized dust/smoke, flat sparks, ring shockwaves).
 * Every particle position is a closed-form function of (time since event, seed).
 */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rng} from '../three/assets';
import type {Scene, Vec3} from '../schema/scene';

type Ev = Scene['vfx'][number];
export const EFFECT_LIFE: Record<string, number> = {sparks: 0.45, dust: 0.9, smoke: 2.4, shockwave: 0.55, debris: 1.2, fire: 3, energy: 1.2, explosion: 2.4, sparkle: 0.9};

const basic = new Map<string, THREE.MeshBasicMaterial>();
const mat = (c: string, o = 1) => {const k = c + o; if (!basic.has(k)) basic.set(k, new THREE.MeshBasicMaterial({color: c, transparent: o < 1, opacity: o, depthWrite: o >= 1, toneMapped: false, side: THREE.DoubleSide})); return basic.get(k)!;};
const ico = new THREE.IcosahedronGeometry(1, 0), sph = new THREE.SphereGeometry(1, 10, 8), box = new THREE.BoxGeometry(1, 1, 1);
const shard = new THREE.ConeGeometry(0.5, 1, 4); shard.rotateX(Math.PI / 2);
const ring = new THREE.RingGeometry(0.85, 1, 40); ring.rotateX(-Math.PI / 2);
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

const Puffs: React.FC<{e: Ev; u: number; tones: string[]; n: number; rise: number; spread: number; size: number; seed: number}> = ({e, u, tones, n, rise, spread, size, seed}) => {
  const r = rng(seed); const p = e.position ?? [0, 0, 0];
  return <group>{Array.from({length: n}, (_, i) => {
    const a = r() * Math.PI * 2, rad = spread * (0.4 + r() * 0.6) * ease(u * 1.4), h = rise * (0.3 + r()) * ease(u);
    const s = size * (0.5 + r() * 0.6) * (0.4 + ease(u * 1.6)) * e.scale * (u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1);
    const tone = tones[i % tones.length];
    return s > 0.005 ? <mesh key={i} geometry={i % 3 ? ico : sph} material={mat(tone)} position={[p[0] + Math.cos(a) * rad, p[1] + 0.08 + h + s * 0.5, p[2] + Math.sin(a) * rad * 0.6]} scale={s} rotation={[r() * 3, r() * 3 + u, 0]} /> : null;
  })}</group>;
};

const Sparks: React.FC<{e: Ev; u: number; seed: number; color?: string}> = ({e, u, seed, color = '#ffd34d'}) => {
  const r = rng(seed); const p = e.position ?? [0, 0, 0]; const life = EFFECT_LIFE.sparks;
  return <group>{Array.from({length: 14}, (_, i) => {
    const dir = new THREE.Vector3(r() - 0.5, r() * 0.9 - 0.2, r() - 0.5).normalize();
    const sp = (1.6 + r() * 2.2) * e.scale, tt = u * life;
    const pos = new THREE.Vector3(...p).addScaledVector(dir, sp * tt).add(new THREE.Vector3(0, -4.9 * tt * tt, 0));
    const len = 0.12 * (1 - u) + 0.02;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().add(new THREE.Vector3(0, -9.8 * tt / sp, 0)).normalize());
    return <mesh key={i} geometry={shard} material={mat(i % 3 ? color : '#ffffff')} position={pos} quaternion={q} scale={[0.025, 0.025, len]} />;
  })}</group>;
};

const Debris: React.FC<{e: Ev; u: number; seed: number}> = ({e, u, seed}) => {
  const r = rng(seed); const p = e.position ?? [0, 0, 0]; const tt = u * EFFECT_LIFE.debris;
  return <group>{Array.from({length: 10}, (_, i) => {
    const v = [(r() - 0.5) * 4, 2 + r() * 3, (r() - 0.5) * 2].map((x) => x * e.scale);
    const y = Math.max(0.05, p[1] + v[1] * tt - 4.9 * tt * tt);
    return <mesh key={i} geometry={box} material={mat(i % 2 ? '#6b5a48' : '#8a7a66')} position={[p[0] + v[0] * tt, y, p[2] + v[2] * tt]} rotation={[tt * 9 * r(), tt * 7, 0]} scale={0.06 + r() * 0.08} />;
  })}</group>;
};

/** Stylised flat-layer fire: stacked flickering cones in 3 tones (no simulation). */
export const Fire: React.FC<{p: Vec3; t: number; scale?: number; seed?: number}> = ({p, t, scale = 1, seed = 3}) => {
  const r = rng(seed);
  return <group position={p} scale={scale}>{['#ff5a1f', '#ff9b21', '#ffe066'].flatMap((c, layer) => Array.from({length: 5}, (_, i) => {
    const ph = r() * 6, x = (r() - 0.5) * 0.7 * (1 - layer * 0.25), h = (0.9 - layer * 0.25) * (0.75 + 0.25 * Math.sin(t * (9 + i) + ph));
    return <mesh key={`${c}${i}`} material={mat(c)} position={[x + Math.sin(t * 7 + ph) * 0.04, h / 2, layer * 0.02]} scale={[0.22 - layer * 0.04, h, 0.22 - layer * 0.04]} rotation={[0, ph, Math.sin(t * 5 + ph) * 0.12]} renderOrder={20 + layer}><coneGeometry args={[1, 1, 5]} /></mesh>;
  }))}</group>;
};

export const Effects3D: React.FC<{events: Ev[]; t: number}> = ({events, t}) => (
  <group>{events.map((e, i) => {
    const life = e.duration ?? EFFECT_LIFE[e.type] ?? 0;
    const dt = t - e.at; if (!life || dt < 0 || dt > life) return null;
    const u = dt / life, seed = Math.round(e.at * 1000) + i;
    const p = e.position ?? [0, 0, 0];
    switch (e.type) {
      case 'sparks': return <Sparks key={i} e={e} u={u} seed={seed} color={e.color} />;
      case 'dust': return <Puffs key={i} e={{...e, position: [p[0], 0, p[2]]}} u={u} tones={['#cdbfa6', '#b3a58c', '#e2d7c2']} n={9} rise={0.35} spread={0.7} size={0.22} seed={seed} />;
      case 'smoke': return <Puffs key={i} e={e} u={u} tones={['#6e6e74', '#8a8a90', '#55555b']} n={12} rise={2.2} spread={0.9} size={0.45} seed={seed} />;
      case 'shockwave': return <mesh key={i} geometry={ring} material={mat(e.color ?? '#ffffff', 0.85 * (1 - u))} position={[p[0], 0.03, p[2]]} scale={(0.2 + ease(u) * 1.8) * e.scale} />;
      case 'debris': return <Debris key={i} e={e} u={u} seed={seed} />;
      case 'fire': return <Fire key={i} p={p} t={t} scale={e.scale * Math.min(1, dt * 4) * (u > 0.85 ? (1 - u) / 0.15 : 1)} seed={seed} />;
      case 'explosion': return <group key={i}>
        <Fire p={p} t={t} scale={1.6 * e.scale * (u < 0.15 ? u / 0.15 : Math.max(0, 1 - (u - 0.15) * 1.6))} seed={seed} />
        <Puffs e={e} u={Math.min(1, u * 1.1)} tones={['#5d5d63', '#7b7b82', '#3f3f45']} n={14} rise={2.6} spread={1.3} size={0.6} seed={seed + 1} />
        {u < 0.5 && <Debris e={e} u={u * 2} seed={seed + 2} />}
        {u < 0.25 && <mesh geometry={ring} material={mat('#fff3c2', 0.9 * (1 - u * 4))} position={[p[0], 0.04, p[2]]} scale={(0.3 + ease(u * 4) * 3) * e.scale} />}
      </group>;
      case 'energy': return <group key={i}>{[0, 1, 2].map((k) => <mesh key={k} geometry={ring} material={mat(e.color ?? '#9fe8ff', 0.7 * (1 - u))} position={[p[0], p[1] + k * 0.45, p[2]]} rotation={[0, t * (2 + k), 0]} scale={(0.35 + 0.15 * Math.sin(t * 8 + k)) * e.scale} />)}</group>;
      case 'sparkle': return <Sparks key={i} e={{...e, scale: e.scale * 0.6}} u={u} seed={seed} color={e.color ?? '#fff6a8'} />;
      default: return null;
    }
  })}</group>
);
