/**
 * Reusable environment presets. Each preset is neutral, built from primitives,
 * and its colours can be overridden per scene via environment.palette.
 * Add new presets to ENVIRONMENTS; nothing here is tied to a content niche.
 */
import React from 'react';
import * as THREE from 'three';
import {SceneProp} from './props';

type Pal = Record<string, string>;
type EnvDef = {palette: Pal; build: (p: Pal) => React.ReactNode};
const Ground: React.FC<{c: string; size?: number}> = ({c, size = 80}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[size, size]} /><meshStandardMaterial color={c} roughness={0.95} /></mesh>
);
const Wall: React.FC<{c: string; z?: number; w?: number; h?: number}> = ({c, z = -4, w = 40, h = 12}) => (
  <mesh position={[0, h / 2, z]} receiveShadow><planeGeometry args={[w, h]} /><meshStandardMaterial color={c} roughness={1} /></mesh>
);
const At: React.FC<{p: [number, number, number]; r?: number; s?: number; children: React.ReactNode}> = ({p, r = 0, s = 1, children}) => (
  <group position={p} rotation={[0, r, 0]} scale={s}>{children}</group>
);

export const ENVIRONMENTS: Record<string, EnvDef> = {
  studio: {palette: {sky: '#eef1f5', ground: '#dfe3e8', wall: '#e9edf2'},
    build: (p) => <><Ground c={p.ground} /><Wall c={p.wall} z={-6} /></>},
  street: {palette: {sky: '#bfe3ff', ground: '#9a9a9a', sidewalk: '#cfcac0', b1: '#e5a46f', b2: '#8aa1b8', b3: '#c7b6e0'},
    build: (p) => <>
      <Ground c={p.ground} />
      <mesh position={[0, 0.06, -2.2]} receiveShadow><boxGeometry args={[60, 0.12, 2.4]} /><meshStandardMaterial color={p.sidewalk} /></mesh>
      {[-12, -7.5, -3, 1.5, 6, 10.5, 15].map((x, i) => <At key={x} p={[x, 0, -5.5]} s={0.9 + (i % 3) * 0.25}><SceneProp kind="building" color={[p.b1, p.b2, p.b3][i % 3]} /></At>)}
      {[-8, 5].map((x) => <At key={x} p={[x, 0, -1.4]}><SceneProp kind="lamp" /></At>)}
      {Array.from({length: 12}).map((_, i) => <mesh key={i} position={[-15 + i * 2.8, 0.005, 1.5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.4, 0.15]} /><meshBasicMaterial color="#f4f4f4" /></mesh>)}
    </>},
  park: {palette: {sky: '#aee2ff', ground: '#7cc472', tree: '#3f8f4a', path: '#d9c79c', hill: '#69b260'},
    build: (p) => <>
      <Ground c={p.ground} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 1.8]} /><meshStandardMaterial color={p.path} /></mesh>
      <mesh position={[-6, -6, -22]}><sphereGeometry args={[12, 24, 16]} /><meshStandardMaterial color={p.hill} /></mesh>
      <mesh position={[10, -9, -26]}><sphereGeometry args={[15, 24, 16]} /><meshStandardMaterial color={p.hill} /></mesh>
      {[[-6, -4], [-2.5, -6], [3, -4.5], [7, -6], [11, -3.5], [-10, -3]].map(([x, z], i) => <At key={i} p={[x, 0, z]} s={0.9 + (i % 2) * 0.3}><SceneProp kind="tree" color={p.tree} /></At>)}
      {[[-4, -2], [5, -2.4], [9, -1.8]].map(([x, z], i) => <At key={i} p={[x, 0, z]}><SceneProp kind="bush" /></At>)}
    </>},
  office: {palette: {sky: '#dfe9f2', ground: '#c9b79c', wall: '#f1ece2', window: '#9fd4ff', trim: '#7d8a99'},
    build: (p) => <>
      <Ground c={p.ground} />
      <Wall c={p.wall} z={-3} h={6} />
      <mesh position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[12, 6]} /><meshStandardMaterial color={p.wall} /></mesh>
      {[-2.4, 2.4].map((x) => <group key={x}>
        <mesh position={[x, 2.4, -2.98]}><planeGeometry args={[2, 1.6]} /><meshBasicMaterial color={p.window} /></mesh>
        <mesh position={[x, 2.4, -2.97]}><boxGeometry args={[2.1, 0.06, 0.02]} /><meshStandardMaterial color={p.trim} /></mesh>
      </group>)}
      <mesh position={[0, 0.06, -2.95]}><boxGeometry args={[40, 0.12, 0.05]} /><meshStandardMaterial color={p.trim} /></mesh>
    </>},
  room: {palette: {sky: '#f6efe6', ground: '#b98a5e', wall: '#f3d9b1', accent: '#e07a5f'},
    build: (p) => <>
      <Ground c={p.ground} />
      <Wall c={p.wall} z={-3} h={6} />
      <mesh position={[3, 2.6, -2.97]}><planeGeometry args={[1.2, 0.9]} /><meshStandardMaterial color={p.accent} /></mesh>
      <At p={[-3, 0, -2.6]}><SceneProp kind="door" /></At>
    </>},
  cliff: {palette: {sky: '#ffcf9e', ground: '#a8865c', rock: '#8a7560', far: '#c99a78'},
    build: (p) => <>
      <Ground c={p.ground} />
      <mesh position={[0, -10, -9]} rotation={[0, 0, 0]}><boxGeometry args={[80, 20, 10]} /><meshStandardMaterial color={p.ground} /></mesh>
      {[[-14, -30, 9], [0, -36, 12], [16, -30, 8]].map(([x, z, h], i) => <mesh key={i} position={[x, h / 2 - 3, z]}><coneGeometry args={[h, h * 1.4, 5]} /><meshStandardMaterial color={p.far} flatShading /></mesh>)}
      {[[-4, -2], [4.5, -2.6], [7, -1]].map(([x, z], i) => <At key={i} p={[x, 0, z]}><SceneProp kind="rock" color={p.rock} /></At>)}
    </>},
  forest: {palette: {sky: '#cfe8d0', ground: '#5d8f4e', tree: '#2f6f3a', path: '#a98b5f'},
    build: (p) => <>
      <Ground c={p.ground} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0.12]} receiveShadow><planeGeometry args={[60, 1.5]} /><meshStandardMaterial color={p.path} /></mesh>
      {Array.from({length: 18}).map((_, i) => { const x = -14 + ((i * 37) % 29); const z = -2.5 - ((i * 53) % 13); return <At key={i} p={[x, 0, z]} s={1 + ((i * 7) % 5) * 0.12}><SceneProp kind="tree" color={p.tree} /></At>; })}
    </>},
};

const SKY_TINT = {day: 1, dusk: 0.75, night: 0.32};

export const EnvironmentView: React.FC<{preset: string; palette?: Pal; timeOfDay: 'day' | 'dusk' | 'night'}> = ({preset, palette, timeOfDay}) => {
  const def = ENVIRONMENTS[preset];
  if (!def) throw new Error(`Unknown environment "${preset}". Known: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  const pal = {...def.palette, ...(palette ?? {})};
  const k = SKY_TINT[timeOfDay];
  const sky = new THREE.Color(pal.sky).multiplyScalar(k);
  if (timeOfDay === 'dusk') sky.lerp(new THREE.Color('#ff9a6a'), 0.35);
  if (timeOfDay === 'night') sky.lerp(new THREE.Color('#1b2448'), 0.6);
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 18, 60]} />
      <hemisphereLight args={['#ffffff', '#8a8a8a', timeOfDay === 'night' ? 0.6 : 1.25]} />
      <directionalLight
        position={[5, 9, 6]} intensity={timeOfDay === 'night' ? 0.7 : 1.8} castShadow
        color={timeOfDay === 'dusk' ? '#ffd2a8' : timeOfDay === 'night' ? '#aab8ff' : '#ffffff'}
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={10} shadow-camera-bottom={-6} shadow-bias={-0.0005}
      />
      {def.build(pal)}
    </>
  );
};
