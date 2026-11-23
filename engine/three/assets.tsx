/**
 * Style C reusable environment assets. Low-poly, smooth-shaded, built from
 * primitives (no downloads), deterministic (seeded scatter), instanced where
 * repeated. Shared by every environment preset.
 */
import React, {useMemo} from 'react';
import * as THREE from 'three';

export type V3 = [number, number, number];
export const rng = (seed: number) => () => {seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};

const cache = new Map<string, THREE.Material>();
export const mat = (color: string, o: {rough?: number; emissive?: number; flat?: boolean; side?: THREE.Side} = {}) => {
  const k = `${color}|${o.rough ?? 0.8}|${o.emissive ?? 0}|${o.flat ?? false}|${o.side ?? 0}`;
  if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({color, roughness: o.rough ?? 0.8, metalness: 0, emissive: o.emissive ? new THREE.Color(color) : undefined, emissiveIntensity: o.emissive ?? 0, flatShading: o.flat ?? false, side: o.side ?? THREE.FrontSide}));
  return cache.get(k)!;
};
const M: React.FC<{p?: V3; r?: V3; s?: V3 | number; m: THREE.Material; shadow?: boolean; children: React.ReactNode}> = ({p, r, s, m, shadow = true, children}) => (
  <mesh position={p} rotation={r} scale={s} material={m} castShadow={shadow} receiveShadow>{children}</mesh>
);

/* ---------- sky ---------- */
export const SkyDome: React.FC<{top: string; horizon: string; bottom?: string}> = ({top, horizon, bottom}) => {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(150, 32, 16);
    const c = [new THREE.Color(top), new THREE.Color(horizon), new THREE.Color(bottom ?? horizon)];
    const cols: number[] = [];
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const h = p.getY(i) / 150;
      const col = h > 0 ? c[1].clone().lerp(c[0], Math.pow(h, 0.6)) : c[1].clone().lerp(c[2], Math.min(1, -h * 4));
      cols.push(col.r, col.g, col.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    return g;
  }, [top, horizon, bottom]);
  return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
};

export const Cloud: React.FC<{p: V3; s?: number; color?: string}> = ({p, s = 1, color = '#ffffff'}) => (
  <group position={p} scale={s}>
    {[[0, 0, 0, 1.2], [1.2, -0.2, 0, 0.9], [-1.1, -0.25, 0.1, 0.85], [0.4, 0.5, -0.2, 0.8]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} scale={[r, r * 0.75, r * 0.8]} material={mat(color, {rough: 1, emissive: 0.25})}><sphereGeometry args={[1, 14, 10]} /></mesh>
    ))}
  </group>
);

export const Mountains: React.FC<{z: number; color: string; count?: number; seed?: number; h?: number; spread?: number}> = ({z, color, count = 7, seed = 3, h = 10, spread = 90}) => {
  const r = rng(seed);
  return <group>{Array.from({length: count}, (_, i) => {
    const x = -spread / 2 + (i + r() * 0.6) * (spread / count), hh = h * (0.6 + r() * 0.7);
    return <mesh key={i} position={[x, hh / 2 - 1, z - r() * 8]} material={mat(color, {flat: true, rough: 1})}><coneGeometry args={[hh * 0.9, hh, 6 + Math.floor(r() * 3), 1]} /></mesh>;
  })}</group>;
};
export const Hills: React.FC<{z: number; color: string; seed?: number}> = ({z, color, seed = 5}) => {
  const r = rng(seed);
  return <group>{Array.from({length: 6}, (_, i) => <mesh key={i} position={[-40 + i * 16 + r() * 6, -9 + r() * 2, z - r() * 6]} scale={[1.6, 0.7, 1]} material={mat(color, {rough: 1})} receiveShadow><sphereGeometry args={[12 + r() * 5, 28, 16]} /></mesh>)}</group>;
};

/* ---------- vegetation ---------- */
export const Tree: React.FC<{p: V3; s?: number; color?: string; kind?: 'round' | 'pine' | 'tall'; seed?: number}> = ({p, s = 1, color = '#3f9a4e', kind = 'round', seed = 1}) => {
  const r = rng(seed);
  const trunk = mat('#7a5232', {rough: 0.9});
  const leaf = mat(color, {rough: 0.75});
  const leaf2 = mat('#' + new THREE.Color(color).multiplyScalar(0.82).getHexString(), {rough: 0.75});
  if (kind === 'pine') return (
    <group position={p} scale={s}>
      <M p={[0, 0.5, 0]} m={trunk}><cylinderGeometry args={[0.1, 0.14, 1, 8]} /></M>
      {[0, 1, 2].map((i) => <M key={i} p={[0, 1.2 + i * 0.75, 0]} m={i % 2 ? leaf2 : leaf}><coneGeometry args={[1.05 - i * 0.28, 1.3, 10]} /></M>)}
    </group>
  );
  const blobs = kind === 'tall' ? 3 : 4;
  return (
    <group position={p} scale={s} rotation={[0, r() * 6.28, 0]}>
      <M p={[0, 0.85, 0]} m={trunk}><cylinderGeometry args={[0.11, 0.17, 1.7, 9]} /></M>
      <M p={[0.18, 1.35, 0]} r={[0, 0, -0.7]} m={trunk}><cylinderGeometry args={[0.05, 0.07, 0.6, 6]} /></M>
      {Array.from({length: blobs}, (_, i) => {
        const a = (i / blobs) * 6.28 + r(), rad = i === 0 ? 0 : 0.45;
        const sz = i === 0 ? 0.85 : 0.55 + r() * 0.2;
        return <M key={i} p={[Math.cos(a) * rad, (kind === 'tall' ? 2.4 : 2.05) + (i === 0 ? 0.25 : r() * 0.3), Math.sin(a) * rad]} m={i % 2 ? leaf2 : leaf}><icosahedronGeometry args={[sz, 2]} /></M>;
      })}
    </group>
  );
};
export const Bush: React.FC<{p: V3; s?: number; color?: string}> = ({p, s = 1, color = '#4ba356'}) => (
  <group position={p} scale={s}>
    {[[0, 0.3, 0, 0.42], [0.35, 0.22, 0.05, 0.3], [-0.33, 0.2, 0, 0.32]].map(([x, y, z, r], i) => <M key={i} p={[x, y, z]} m={mat(color, {rough: 0.8})}><icosahedronGeometry args={[r, 2]} /></M>)}
  </group>
);

/** three soft blades merged into one small tuft (~16cm) */
function grassTuft() {
  const parts = [[-0.03, -0.25], [0.0, 0.0], [0.035, 0.3]].map(([x, tilt]) => {
    const g = new THREE.ConeGeometry(0.022, 0.17, 3); g.translate(0, 0.085, 0); g.rotateZ(tilt); g.translate(x, 0, 0); return g;});
  const pos: number[] = [];
  for (const g of parts) {const ng = g.toNonIndexed(); pos.push(...(ng.attributes.position.array as Float32Array));}
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.computeVertexNormals();
  return out;
}

/** Instanced grass tufts / flowers scattered in a rectangle (deterministic). */
export const Scatter: React.FC<{kind: 'grass' | 'flower' | 'pebble'; count: number; x: [number, number]; z: [number, number]; seed?: number; color?: string; avoid?: (x: number, z: number) => boolean}> = ({kind, count, x, z, seed = 7, color, avoid}) => {
  const {geo, m, mats} = useMemo(() => {
    const geo = kind === 'grass' ? grassTuft() : kind === 'flower' ? new THREE.SphereGeometry(0.06, 8, 6) : new THREE.DodecahedronGeometry(0.08, 0);
    const r = rng(seed);
    const mats: THREE.Matrix4[] = [];
    for (let i = 0; i < count * 2 && mats.length < count; i++) {
      const px = x[0] + r() * (x[1] - x[0]), pz = z[0] + r() * (z[1] - z[0]);
      if (avoid?.(px, pz)) continue;
      const s = 0.6 + r() * 0.8;
      mats.push(new THREE.Matrix4().compose(new THREE.Vector3(px, kind === 'flower' ? 0.18 * s : 0, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.4, r() * 6, (r() - 0.5) * 0.4)), new THREE.Vector3(s, s * (kind === 'grass' ? 0.7 + r() * 0.6 : 1), s)));
    }
    const m = mat(color ?? (kind === 'grass' ? '#4f9e46' : kind === 'flower' ? '#ffd84a' : '#9a958c'), {rough: 0.9, flat: kind === 'pebble'});
    return {geo, m, mats};
  }, [kind, count, x[0], x[1], z[0], z[1], seed, color]);
  const ref = React.useCallback((im: THREE.InstancedMesh | null) => {if (im) {mats.forEach((mm, i) => im.setMatrixAt(i, mm)); im.instanceMatrix.needsUpdate = true;}}, [mats]);
  return <instancedMesh ref={ref} args={[geo, m, mats.length]} castShadow={kind !== 'grass'} receiveShadow />;
};

/* ---------- outdoor structures ---------- */
export const Fence: React.FC<{p: V3; length: number; r?: number; color?: string}> = ({p, length, r = 0, color = '#f1e6d2'}) => {
  const m = mat(color, {rough: 0.7});
  const n = Math.floor(length / 0.5);
  return <group position={p} rotation={[0, r, 0]}>
    {Array.from({length: n + 1}, (_, i) => <M key={i} p={[i * 0.5 - length / 2, 0.42, 0]} m={m}><boxGeometry args={[0.07, 0.84, 0.05]} /></M>)}
    {[0.3, 0.62].map((y) => <M key={y} p={[0, y, 0.03]} m={m}><boxGeometry args={[length, 0.07, 0.03]} /></M>)}
  </group>;
};
export const Bench: React.FC<{p: V3; r?: number; color?: string}> = ({p, r = 0, color = '#a8693a'}) => {
  const w = mat(color, {rough: 0.6}), metal = mat('#3b3f46', {rough: 0.4});
  return <group position={p} rotation={[0, r, 0]}>
    {[0, 1, 2].map((i) => <M key={i} p={[0, 0.45, -0.12 + i * 0.13]} m={w}><boxGeometry args={[1.6, 0.05, 0.11]} /></M>)}
    {[0, 1].map((i) => <M key={i} p={[0, 0.72 + i * 0.15, -0.25]} r={[-0.15, 0, 0]} m={w}><boxGeometry args={[1.6, 0.1, 0.04]} /></M>)}
    {[-0.7, 0.7].map((x) => <M key={x} p={[x, 0.22, 0]} m={metal}><boxGeometry args={[0.06, 0.45, 0.4]} /></M>)}
  </group>;
};
export const StreetLamp: React.FC<{p: V3; on?: boolean}> = ({p, on}) => (
  <group position={p}>
    <M p={[0, 1.7, 0]} m={mat('#2f343c', {rough: 0.4})}><cylinderGeometry args={[0.045, 0.07, 3.4, 10]} /></M>
    <M p={[0.25, 3.35, 0]} r={[0, 0, Math.PI / 2]} m={mat('#2f343c', {rough: 0.4})}><cylinderGeometry args={[0.03, 0.03, 0.5, 8]} /></M>
    <M p={[0.48, 3.25, 0]} m={mat('#fff2c4', {emissive: on ? 1.5 : 0.4, rough: 0.3})}><sphereGeometry args={[0.13, 14, 10]} /></M>
    {on && <pointLight position={[0.48, 3.1, 0]} intensity={6} distance={7} color="#ffd9a0" />}
  </group>
);
export const Building: React.FC<{p: V3; w?: number; h?: number; d?: number; color: string; seed?: number; night?: boolean; awning?: string}> = ({p, w = 3, h = 5, d = 2, color, seed = 1, night, awning}) => {
  const r = rng(seed);
  const cols = Math.max(2, Math.floor(w / 0.9)), rows = Math.max(2, Math.floor((h - 1.2) / 1.1));
  const trim = mat('#' + new THREE.Color(color).multiplyScalar(0.78).getHexString(), {rough: 0.8});
  return <group position={p}>
    <M p={[0, h / 2, 0]} m={mat(color, {rough: 0.85})}><boxGeometry args={[w, h, d]} /></M>
    <M p={[0, h + 0.08, 0]} m={trim}><boxGeometry args={[w + 0.15, 0.16, d + 0.15]} /></M>
    {Array.from({length: cols * rows}, (_, i) => {
      const cx = -w / 2 + (w / cols) * ((i % cols) + 0.5), cy = 1.6 + Math.floor(i / cols) * 1.1;
      const lit = night ? r() > 0.45 : false;
      return <group key={i} position={[cx, cy, d / 2 + 0.01]}>
        <mesh material={mat('#' + new THREE.Color(lit ? '#ffd88a' : '#bfe0f5').getHexString(), {emissive: lit ? 1.1 : 0.15, rough: 0.2})}><planeGeometry args={[0.46, 0.66]} /></mesh>
        <mesh position={[0, -0.36, 0.03]} material={trim}><boxGeometry args={[0.56, 0.06, 0.08]} /></mesh>
      </group>;
    })}
    {awning && <M p={[0, 1.05, d / 2 + 0.35]} r={[0.35, 0, 0]} m={mat(awning, {rough: 0.7})}><boxGeometry args={[w * 0.8, 0.05, 0.8]} /></M>}
    <mesh position={[w * 0.25, 0.55, d / 2 + 0.01]} material={mat('#5a3c2a', {rough: 0.6})}><planeGeometry args={[0.7, 1.1]} /></mesh>
  </group>;
};
export const Planter: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <M p={[0, 0.25, 0]} m={mat('#b9b1a3', {rough: 0.9})}><boxGeometry args={[0.7, 0.5, 0.7]} /></M>
    <Tree p={[0, 0.5, 0]} s={0.6} seed={p[0] * 10} />
  </group>
);
export const TrashBin: React.FC<{p: V3}> = ({p}) => (
  <group position={p}><M p={[0, 0.4, 0]} m={mat('#3d7a55', {rough: 0.5})}><cylinderGeometry args={[0.25, 0.22, 0.8, 14]} /></M><M p={[0, 0.82, 0]} m={mat('#2d5c40', {rough: 0.5})}><cylinderGeometry args={[0.27, 0.27, 0.06, 14]} /></M></group>
);

/* ---------- interior ---------- */
export const Sofa: React.FC<{p: V3; r?: number; color?: string}> = ({p, r = 0, color = '#5b7fb8'}) => {
  const m = mat(color, {rough: 0.9});
  return <group position={p} rotation={[0, r, 0]}>
    <M p={[0, 0.25, 0]} m={m}><boxGeometry args={[2.1, 0.4, 0.9]} /></M>
    <M p={[0, 0.7, -0.36]} m={m}><boxGeometry args={[2.1, 0.6, 0.2]} /></M>
    {[-1, 1].map((s) => <M key={s} p={[s * 1.0, 0.5, 0]} m={m}><boxGeometry args={[0.2, 0.55, 0.9]} /></M>)}
    {[-0.48, 0.48].map((x) => <M key={x} p={[x, 0.5, 0.02]} m={mat('#' + new THREE.Color(color).multiplyScalar(1.15).getHexString(), {rough: 0.95})}><boxGeometry args={[0.9, 0.12, 0.75]} /></M>)}
    <M p={[0.6, 0.72, -0.2]} r={[0.2, 0.3, 0.1]} m={mat('#f0c75e', {rough: 0.95})}><boxGeometry args={[0.38, 0.38, 0.12]} /></M>
  </group>;
};
export const Bookshelf: React.FC<{p: V3; r?: number; seed?: number}> = ({p, r = 0, seed = 4}) => {
  const rr = rng(seed), wood = mat('#8b5e3c', {rough: 0.7});
  const books = ['#c8553d', '#2d6a8e', '#e8b04b', '#5c946e', '#8e5ca8', '#e6e1d6', '#3c4f76'];
  return <group position={p} rotation={[0, r, 0]}>
    <M p={[0, 1.0, -0.16]} m={wood}><boxGeometry args={[1.3, 2, 0.04]} /></M>
    {[-0.63, 0.63].map((x) => <M key={x} p={[x, 1.0, 0]} m={wood}><boxGeometry args={[0.05, 2, 0.34]} /></M>)}
    {[0.02, 0.5, 1.0, 1.5, 1.98].map((y) => <M key={y} p={[0, y, 0]} m={wood}><boxGeometry args={[1.3, 0.04, 0.34]} /></M>)}
    {[0.04, 0.52, 1.02, 1.52].flatMap((y, row) => {
      let x = -0.58; const out: React.ReactNode[] = [];
      while (x < 0.5) {const w = 0.05 + rr() * 0.06, h = 0.3 + rr() * 0.12, lean = rr() > 0.9 ? 0.25 : 0;
        out.push(<M key={`${row}-${x}`} p={[x + w / 2, y + h / 2, 0]} r={[0, 0, -lean]} m={mat(books[Math.floor(rr() * books.length)], {rough: 0.8})} shadow={false}><boxGeometry args={[w, h, 0.24]} /></M>);
        x += w + 0.006 + (rr() > 0.85 ? 0.12 : 0);}
      return out;
    })}
  </group>;
};
export const PottedPlant: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <M p={[0, 0.22, 0]} m={mat('#d0764a', {rough: 0.8})}><cylinderGeometry args={[0.22, 0.16, 0.44, 14]} /></M>
    {Array.from({length: 7}, (_, i) => <M key={i} p={[Math.cos(i) * 0.12, 0.62 + (i % 3) * 0.1, Math.sin(i) * 0.12]} r={[Math.cos(i) * 0.5, 0, Math.sin(i) * 0.5]} s={[1, 2.2, 0.35]} m={mat(i % 2 ? '#3f8f4a' : '#58a85f', {rough: 0.7})}><sphereGeometry args={[0.12, 10, 8]} /></M>)}
  </group>
);
export const Rug: React.FC<{p: V3; w: number; d: number; color?: string; border?: string}> = ({p, w, d, color = '#c96b4f', border = '#f1d7a8'}) => (
  <group position={p}>
    <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat(border, {rough: 1})} receiveShadow><planeGeometry args={[w, d]} /></mesh>
    <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat(color, {rough: 1})} receiveShadow><planeGeometry args={[w - 0.25, d - 0.25]} /></mesh>
  </group>
);
export const Window: React.FC<{p: V3; w?: number; h?: number; sky?: string; r?: number}> = ({p, w = 1.6, h = 1.5, sky = '#9fd4ff', r = 0}) => {
  const frame = mat('#f7f3ea', {rough: 0.5});
  return <group position={p} rotation={[0, r, 0]}>
    <mesh material={mat(sky, {emissive: 0.9, rough: 1})}><planeGeometry args={[w, h]} /></mesh>
    {[[0, h / 2, w + 0.1, 0.08], [0, -h / 2, w + 0.2, 0.1], [0, 0, w, 0.05]].map(([x, y, ww, hh], i) => <M key={i} p={[x, y, 0.03]} m={frame}><boxGeometry args={[ww, hh, 0.06]} /></M>)}
    {[-w / 2, 0, w / 2].map((x) => <M key={x} p={[x, 0, 0.03]} m={frame}><boxGeometry args={[0.06, h, 0.06]} /></M>)}
  </group>;
};
export const FloorLamp: React.FC<{p: V3; on?: boolean}> = ({p, on = true}) => (
  <group position={p}>
    <M p={[0, 0.02, 0]} m={mat('#333', {rough: 0.4})}><cylinderGeometry args={[0.2, 0.2, 0.04, 16]} /></M>
    <M p={[0, 0.8, 0]} m={mat('#333', {rough: 0.4})}><cylinderGeometry args={[0.02, 0.02, 1.6, 8]} /></M>
    <M p={[0, 1.68, 0]} m={mat('#f5e3c0', {emissive: on ? 0.8 : 0, rough: 0.9, side: THREE.DoubleSide})}><cylinderGeometry args={[0.18, 0.28, 0.35, 18, 1, true]} /></M>
    {on && <pointLight position={[0, 1.6, 0]} intensity={4} distance={5} color="#ffcf8a" />}
  </group>
);
export const PictureFrame: React.FC<{p: V3; w?: number; h?: number; color?: string; art?: string}> = ({p, w = 0.8, h = 0.6, color = '#3a2b22', art = '#7fb6d8'}) => (
  <group position={p}>
    <M p={[0, 0, 0]} m={mat(color, {rough: 0.6})}><boxGeometry args={[w, h, 0.04]} /></M>
    <mesh position={[0, 0, 0.022]} material={mat('#f6efe2', {rough: 1})}><planeGeometry args={[w - 0.1, h - 0.1]} /></mesh>
    <mesh position={[0, -0.04, 0.024]} material={mat(art, {rough: 1})}><circleGeometry args={[Math.min(w, h) * 0.25, 3]} /></mesh>
    <mesh position={[w * 0.18, h * 0.12, 0.025]} material={mat('#f2c14e', {rough: 1})}><circleGeometry args={[0.05, 16]} /></mesh>
  </group>
);
export const CoffeeTable: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <M p={[0, 0.4, 0]} m={mat('#a8744a', {rough: 0.5})}><boxGeometry args={[1.1, 0.06, 0.6]} /></M>
    {[[-0.48, -0.24], [0.48, -0.24], [-0.48, 0.24], [0.48, 0.24]].map(([x, z], i) => <M key={i} p={[x, 0.19, z]} m={mat('#6e4a2f')}><cylinderGeometry args={[0.03, 0.025, 0.38, 8]} /></M>)}
    <M p={[0.25, 0.48, 0]} m={mat('#f4efe6', {rough: 0.4})}><cylinderGeometry args={[0.05, 0.04, 0.1, 12]} /></M>
    <M p={[-0.2, 0.45, 0.05]} r={[0, 0.3, 0]} m={mat('#2d6a8e')}><boxGeometry args={[0.3, 0.04, 0.22]} /></M>
  </group>
);
export const WallClock: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <M p={[0, 0, 0]} r={[Math.PI / 2, 0, 0]} m={mat('#2b2b33', {rough: 0.4})}><cylinderGeometry args={[0.26, 0.26, 0.05, 24]} /></M>
    <mesh position={[0, 0, 0.03]} material={mat('#fbf8f1', {rough: 1})}><circleGeometry args={[0.22, 24]} /></mesh>
    <mesh position={[0.04, 0.05, 0.035]} rotation={[0, 0, -0.8]} material={mat('#222')}><planeGeometry args={[0.02, 0.15]} /></mesh>
    <mesh position={[0, -0.05, 0.035]} rotation={[0, 0, 0.1]} material={mat('#222')}><planeGeometry args={[0.02, 0.1]} /></mesh>
  </group>
);
