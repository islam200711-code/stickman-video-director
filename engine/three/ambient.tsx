/**
 * Ambient life: small deterministic particle systems (one instanced draw call each)
 * that make sets feel alive without heavy geometry — drifting leaves/petals outdoors,
 * dust motes in interior light, fireflies at night, and a distant bird flock.
 * Every particle position is a closed-form function of time (no simulation state).
 */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rng} from './assets';

export type AmbientKind = 'leaves' | 'dust' | 'fireflies' | 'petals' | 'none';
const CFG: Record<Exclude<AmbientKind, 'none'>, {count: number; color: string; size: number; emissive: number; fall: number; area: [number, number, number]}> = {
  leaves: {count: 46, color: '#e0a23a', size: 0.07, emissive: 0.1, fall: 0.45, area: [16, 6, 10]},
  petals: {count: 60, color: '#ffb3c7', size: 0.05, emissive: 0.15, fall: 0.3, area: [16, 5, 10]},
  dust: {count: 90, color: '#fff3d6', size: 0.012, emissive: 1.2, fall: -0.02, area: [10, 4, 6]},
  fireflies: {count: 50, color: '#d8ff7a', size: 0.03, emissive: 2.5, fall: 0, area: [16, 3, 10]},
};

export const Ambient: React.FC<{kind: AmbientKind; t: number; seed?: number}> = ({kind, t, seed = 11}) => {
  const data = useMemo(() => {
    if (kind === 'none') return null;
    const c = CFG[kind], r = rng(seed);
    const geo = kind === 'leaves' || kind === 'petals' ? new THREE.PlaneGeometry(c.size * 1.6, c.size) : new THREE.SphereGeometry(c.size, 6, 4);
    const mat = new THREE.MeshStandardMaterial({color: c.color, emissive: new THREE.Color(c.color), emissiveIntensity: c.emissive, side: THREE.DoubleSide, roughness: 0.8, transparent: kind === 'dust', opacity: kind === 'dust' ? 0.7 : 1});
    const ps = Array.from({length: c.count}, () => ({x: (r() - 0.5) * c.area[0], y: r() * c.area[1], z: (r() - 0.5) * c.area[2] - 1, ph: r() * 10, sp: 0.6 + r() * 0.8}));
    return {geo, mat, ps, c};
  }, [kind, seed]);
  const ref = (im: THREE.InstancedMesh | null) => {
    if (!im || !data) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    data.ps.forEach((d, i) => {
      const h = data.c.area[1];
      let y = d.y - data.c.fall * d.sp * t;
      y = ((y % h) + h) % h + (kind === 'dust' ? 0.3 : 0.05);
      const sway = Math.sin(t * 1.3 * d.sp + d.ph);
      p.set(d.x + sway * 0.35 + (kind === 'leaves' || kind === 'petals' ? t * 0.25 : 0) % 2, y + (kind === 'fireflies' ? Math.sin(t * 2 + d.ph) * 0.3 : 0), d.z + Math.cos(t * 0.9 * d.sp + d.ph) * 0.25);
      e.set(t * 2 * d.sp + d.ph, t * 1.5 + d.ph, sway);
      q.setFromEuler(e);
      const pulse = kind === 'fireflies' ? 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 * d.sp + d.ph)) : 1;
      s.setScalar(pulse);
      im.setMatrixAt(i, m.compose(p, q, s));
    });
    im.instanceMatrix.needsUpdate = true;
  };
  if (!data) return null;
  return <instancedMesh ref={ref} args={[data.geo, data.mat, data.ps.length]} frustumCulled={false} />;
};

/** Distant bird flock (outdoor depth cue): small V shapes gliding across the sky. */
export const Birds: React.FC<{t: number; seed?: number}> = ({t, seed = 5}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0.15, 0, 0, 0, 0, 0, 0.05, 0, 0, 0, 0, 0.5, 0.15, 0, 0, 0.05, 0], 3));
    g.computeVertexNormals(); return g;
  }, []);
  const r = rng(seed);
  const birds = Array.from({length: 7}, (_, i) => ({dx: r() * 4 - i * 0.9, dy: r() * 1.5 + (i % 2) * 0.6, ph: r() * 6}));
  const x0 = -40 + ((t * 2.2) % 80);
  return <group position={[x0, 14, -45]}>{birds.map((b, i) => (
    <mesh key={i} geometry={geo} position={[b.dx, b.dy + Math.sin(t * 1.5 + b.ph) * 0.2, 0]} scale={[1, 1 + 0.6 * Math.sin(t * 9 + b.ph), 1]}>
      <meshBasicMaterial color="#3a3f4a" side={THREE.DoubleSide} fog={false} />
    </mesh>))}</group>;
};
export const defaultAmbient = (preset: string, timeOfDay: string, indoor: boolean): AmbientKind =>
  timeOfDay === 'night' ? (indoor ? 'dust' : 'fireflies') : indoor ? 'dust' : preset === 'park' ? 'petals' : preset === 'forest' || preset === 'cliff' ? 'leaves' : 'none';
