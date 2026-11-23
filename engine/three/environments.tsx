/**
 * Style C environment presets: layered (foreground / midground / background),
 * cinematic three-point lighting with soft shadows, gradient sky and fog for depth.
 * Colours are overridable per scene via environment.palette. No niche-specific
 * content: these are neutral, reusable sets.
 *
 * World layout convention: actors live around x in [-6, 6], z in [-2, 2];
 * camera usually sits at +z looking towards -z. Foreground dressing is kept
 * small and outside the central acting area.
 */
import React from 'react';
import * as THREE from 'three';
import {Bench, Bookshelf, Building, Bush, Cloud, CoffeeTable, Fence, FloorLamp, Hills, mat, Mountains, PictureFrame, Planter, PottedPlant, Rug, Scatter, SkyDome, Sofa, StreetLamp, TrashBin, Tree, WallClock, Window} from './assets';
import {SceneProp} from './props';

type Pal = Record<string, string>;
type TOD = 'day' | 'dusk' | 'night';
type EnvDef = {
  palette: Pal;
  indoor?: boolean;
  fog?: [number, number];
  sky: (p: Pal, tod: TOD) => {top: string; horizon: string};
  build: (p: Pal, tod: TOD) => React.ReactNode;
};

const Ground: React.FC<{c: string; size?: number}> = ({c, size = 260}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat(c, {rough: 0.95})}><planeGeometry args={[size, size]} /></mesh>
);
const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; c: string; rough?: number}> = ({p, s, c, rough}) => (
  <mesh position={p} material={mat(c, {rough: rough ?? 0.85})} castShadow receiveShadow><boxGeometry args={s} /></mesh>
);
const outdoorSky = (p: Pal, tod: TOD) => tod === 'night' ? {top: '#0d1430', horizon: '#2a3766'} : tod === 'dusk' ? {top: '#5b6fb5', horizon: '#ffb37a'} : {top: p.skyTop ?? '#5fa8f0', horizon: p.sky ?? '#cfe9ff'};
const nearPath = (x: number, z: number) => Math.abs(z) < 2.2 && Math.abs(x) < 7;

export const ENVIRONMENTS: Record<string, EnvDef> = {
  studio: {
    palette: {sky: '#e9edf3', skyTop: '#f7f9fc', ground: '#e4e8ef'},
    sky: (p) => ({top: p.skyTop, horizon: p.sky}),
    fog: [7, 26],
    build: (p) => <Ground c={p.ground} />,
  },
  park: {
    palette: {ground: '#78c06a', grass: '#4f9e46', path: '#e2cf9f', hill: '#69b25d', hill2: '#8cc77b', mountain: '#8fa8c8', tree: '#3f9a4e', tree2: '#5bb35a', flower: '#ffd84a', flower2: '#ff8fb1'},
    sky: outdoorSky,
    build: (p, tod) => <>
      <Ground c={p.ground} />
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat(p.path, {rough: 1})} receiveShadow><planeGeometry args={[90, 2.2]} /></mesh>
      {/* background */}
      <Mountains z={-70} color={p.mountain} count={9} h={18} spread={160} />
      <Hills z={-34} color={p.hill} />
      <Hills z={-22} color={p.hill2} seed={11} />
      {[[-18, 14, -60, 2.2], [8, 17, -70, 2.8], [30, 13, -55, 1.8], [-40, 16, -75, 2.5]].map(([x, y, z, s], i) => <Cloud key={i} p={[x, y, z]} s={s} color={tod === 'dusk' ? '#ffd9c2' : '#ffffff'} />)}
      {/* midground */}
      {[[-9, -6, 1.2, 'round'], [-4.5, -8, 1.4, 'tall'], [1.5, -7.5, 1.1, 'round'], [6.5, -6.5, 1.3, 'round'], [11, -8, 1.5, 'pine'], [-14, -7, 1.3, 'pine'], [15, -5, 1.1, 'round'], [-2, -12, 1.4, 'pine'], [4, -13, 1.6, 'tall']].map(([x, z, s, k], i) =>
        <Tree key={i} p={[x as number, 0, z as number]} s={s as number} kind={k as 'round'} seed={i + 1} color={i % 2 ? p.tree : p.tree2} />)}
      {[[-6.5, -3.2], [3.6, -3.6], [9, -3], [-11, -3.4]].map(([x, z], i) => <Bush key={i} p={[x, 0, z]} s={0.9 + (i % 2) * 0.3} />)}
      <Bench p={[-3.2, 0, -2.6]} />
      <Fence p={[6, 0, -4.4]} length={6} />
      <Scatter kind="grass" count={900} x={[-22, 22]} z={[-14, 6]} seed={3} color={p.grass} avoid={nearPath} />
      <Scatter kind="flower" count={120} x={[-20, 20]} z={[-12, -2.6]} seed={8} color={p.flower} />
      <Scatter kind="flower" count={80} x={[-20, 20]} z={[-12, -2.6]} seed={9} color={p.flower2} />
      {/* foreground (outside the acting lane) */}
      <Scatter kind="grass" count={120} x={[-10, 10]} z={[2.6, 5]} seed={21} color={p.grass} />
      <Scatter kind="pebble" count={30} x={[-8, 8]} z={[1.2, 2.2]} seed={5} />
    </>,
  },
  forest: {
    palette: {ground: '#5e8f4c', grass: '#4a8040', path: '#b39467', tree: '#2f7a3d', tree2: '#3f8f4a', mountain: '#6f8f86'},
    sky: (p, tod) => tod === 'day' ? {top: '#7fb7d6', horizon: '#d6ecd8'} : outdoorSky(p, tod),
    build: (p) => <>
      <Ground c={p.ground} />
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0.1]} material={mat(p.path, {rough: 1})} receiveShadow><planeGeometry args={[90, 1.8]} /></mesh>
      <Mountains z={-60} color={p.mountain} count={8} h={14} spread={140} />
      {Array.from({length: 34}, (_, i) => {const x = -22 + ((i * 37) % 44), z = -3 - ((i * 53) % 22); return <Tree key={i} p={[x, 0, z]} s={1 + ((i * 7) % 5) * 0.15} kind={i % 3 ? 'pine' : 'tall'} seed={i} color={i % 2 ? p.tree : p.tree2} />;})}
      {[[-5, 4.5], [6, 5]].map(([x, z], i) => <Tree key={`f${i}`} p={[x, 0, z]} s={1.1} kind="pine" seed={40 + i} color={p.tree} />)}
      <Scatter kind="grass" count={700} x={[-20, 20]} z={[-12, 6]} seed={4} color={p.grass} avoid={nearPath} />
      <Scatter kind="pebble" count={40} x={[-10, 10]} z={[-3, 3]} seed={6} avoid={(x, z) => Math.abs(z) < 1}/>
    </>,
  },
  street: {
    palette: {ground: '#8e9096', sidewalk: '#d3cec4', curb: '#b9b4aa', b1: '#e8a46f', b2: '#8fa8c4', b3: '#c9b4e0', b4: '#f0d48a', skyline: '#9fb2c9'},
    sky: outdoorSky,
    build: (p, tod) => <>
      <Ground c={p.ground} />
      <Box p={[0, 0.07, -2.4]} s={[90, 0.14, 2.6]} c={p.sidewalk} />
      <Box p={[0, 0.08, -1.08]} s={[90, 0.16, 0.12]} c={p.curb} />
      {/* skyline (background) */}
      {Array.from({length: 18}, (_, i) => <mesh key={i} position={[-45 + i * 5.2, 4 + ((i * 7) % 5) * 1.6, -30]} material={mat(p.skyline, {rough: 1})}><boxGeometry args={[4.5, 8 + ((i * 7) % 5) * 3.2, 3]} /></mesh>)}
      {/* building row (midground) */}
      {[-14, -10.2, -6.6, -3, 0.8, 4.4, 8.2, 12, 15.6].map((x, i) =>
        <Building key={x} p={[x, 0, -5.4]} w={3.4 + (i % 2) * 0.4} h={5 + (i % 3) * 1.6} color={[p.b1, p.b2, p.b3, p.b4][i % 4]} seed={i + 1} night={tod === 'night'} awning={i % 3 === 1 ? ['#d24c4c', '#2f8f6a', '#3b6fd1'][i % 3] : undefined} />)}
      {[-8, 5].map((x) => <StreetLamp key={x} p={[x, 0.14, -1.5]} on={tod !== 'day'} />)}
      <Planter p={[-4.6, 0.14, -2.9]} />
      <Planter p={[9.5, 0.14, -2.9]} />
      <TrashBin p={[2.6, 0.14, -2.9]} />
      <Bench p={[-11.5, 0.14, -2.8]} />
      {/* lane markings */}
      {Array.from({length: 16}, (_, i) => <mesh key={i} position={[-30 + i * 4, 0.006, 2.2]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#f4f4f4', {rough: 1})}><planeGeometry args={[1.8, 0.14]} /></mesh>)}
      <Box p={[0, 0.07, 6.4]} s={[90, 0.14, 2.6]} c={p.sidewalk} />
    </>,
  },
  cliff: {
    palette: {ground: '#c09463', rock: '#8c7358', far: '#b48c78', far2: '#9b7f86', valley: '#8aa07a', grass: '#a8a35a'},
    sky: outdoorSky,
    fog: [20, 170],
    build: (p, tod) => <>
      {/* plateau that ends in a cliff edge at z = -3.5 */}
      <mesh position={[0, -15, 8]} material={mat(p.ground, {rough: 1})} receiveShadow castShadow><boxGeometry args={[80, 30, 23]} /></mesh>
      <mesh position={[0, -20, -3.6]} rotation={[0.08, 0, 0]} material={mat('#' + new THREE.Color(p.ground).multiplyScalar(0.8).getHexString(), {rough: 1, flat: true})}><boxGeometry args={[80, 40, 0.8, 30, 8, 1]} /></mesh>
      <mesh position={[0, -34, -80]} rotation={[-Math.PI / 2, 0, 0]} material={mat(tod === 'dusk' ? '#a08070' : p.valley, {rough: 1})}><planeGeometry args={[500, 160]} /></mesh>
      <Mountains z={-110} color={p.far} count={9} h={30} spread={220} seed={7} />
      <Mountains z={-150} color={p.far2} count={11} h={48} spread={320} seed={9} />
      {[[-30, 16, -90, 3], [25, 20, -110, 4], [0, 26, -130, 3.5]].map(([x, y, z, s], i) => <Cloud key={i} p={[x, y, z]} s={s} color={tod === 'dusk' ? '#ffc9a8' : '#ffffff'} />)}
      {[[-4.5, 1.5], [5, 0.6], [7.5, 2.5], [-7, 3]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><SceneProp kind="rock" color={p.rock} /></group>)}
      <Tree p={[-5.5, 0, -1.8]} s={1.2} kind="round" seed={3} color="#8a9c46" />
      <Bush p={[4.2, 0, -2.2]} color="#8c9a48" />
      <Scatter kind="grass" count={240} x={[-12, 12]} z={[-3.2, 6]} seed={12} color={p.grass} avoid={nearPath} />
    </>,
  },
  office: {
    indoor: true,
    palette: {floor: '#c8a57c', wall: '#eef0ea', accent: '#3d6fb6', trim: '#7d8a99', desk: '#b88b5a', window: '#a9dcff'},
    sky: () => ({top: '#dfe9f2', horizon: '#eef3f7'}),
    build: (p, tod) => <>
      <Ground c={p.floor} />
      {Array.from({length: 30}, (_, i) => <mesh key={i} position={[-15 + i, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#' + new THREE.Color(p.floor).multiplyScalar(i % 2 ? 0.96 : 1.03).getHexString(), {rough: 0.9})} receiveShadow><planeGeometry args={[0.98, 40]} /></mesh>)}
      <Box p={[0, 3, -3.1]} s={[30, 6, 0.2]} c={p.wall} rough={1} />
      <Box p={[-7.1, 3, 0]} s={[0.2, 6, 12]} c={p.wall} rough={1} />
      <Box p={[0, 0.08, -2.98]} s={[30, 0.16, 0.06]} c={p.trim} />
      <Box p={[0, 4.4, -2.98]} s={[30, 0.9, 0.04]} c={p.accent} />
      <Window p={[-2.6, 2.2, -2.98]} w={2.2} h={1.6} sky={tod === 'night' ? '#26345e' : p.window} />
      <Window p={[2.6, 2.2, -2.98]} w={2.2} h={1.6} sky={tod === 'night' ? '#26345e' : p.window} />
      <group position={[5.6, 0, -2.2]}><SceneProp kind="desk" color={p.desk} /><group position={[0, 0, -0.1]}><SceneProp kind="computer" /></group></group>
      <group position={[5.6, 0, -1.2]} rotation={[0, Math.PI, 0]}><SceneProp kind="chair" /></group>
      <Bookshelf p={[-5.4, 0, -2.75]} />
      <PottedPlant p={[-6.4, 0, -2.3]} s={1.2} />
      <PottedPlant p={[0, 0, -2.6]} s={0.9} />
      <WallClock p={[0, 3.2, -2.98]} />
      <PictureFrame p={[4.2, 2.6, -2.98]} />
      {/* soft ceiling light pools */}
      {[-3, 3].map((x) => <pointLight key={x} position={[x, 4.5, 0.5]} intensity={9} distance={12} decay={1.4} color="#fff4e0" />)}
    </>,
  },
  'living-room': {
    indoor: true,
    palette: {floor: '#b98a5e', wall: '#f3dcb8', wall2: '#e9c99c', rug: '#c96b4f', sofa: '#5b7fb8', window: '#bfe6ff'},
    sky: () => ({top: '#f6efe6', horizon: '#fbf5ec'}),
    build: (p, tod) => <>
      <Ground c={p.floor} />
      {Array.from({length: 40}, (_, i) => <mesh key={i} position={[-10 + i * 0.5, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#' + new THREE.Color(p.floor).multiplyScalar(i % 3 === 0 ? 0.93 : i % 3 === 1 ? 1.0 : 1.05).getHexString(), {rough: 0.85})} receiveShadow><planeGeometry args={[0.49, 40]} /></mesh>)}
      <Box p={[0, 3, -3.1]} s={[24, 6, 0.2]} c={p.wall} rough={1} />
      <Box p={[0, 0.6, -2.98]} s={[24, 1.2, 0.04]} c={p.wall2} rough={1} />
      <Box p={[0, 1.22, -2.95]} s={[24, 0.05, 0.06]} c="#ffffff" />
      <Box p={[-6.6, 3, 0]} s={[0.2, 6, 12]} c={p.wall} rough={1} />
      <Window p={[-3.4, 2.3, -2.98]} w={1.8} h={1.7} sky={tod === 'night' ? '#26345e' : p.window} />
      <Rug p={[0.2, 0, -0.4]} w={4.4} d={2.8} color={p.rug} />
      <Sofa p={[0.4, 0, -2.3]} color={p.sofa} />
      <CoffeeTable p={[0.4, 0, -0.9]} />
      <Bookshelf p={[4.2, 0, -2.75]} seed={9} />
      <FloorLamp p={[-1.6, 0, -2.5]} on={tod !== 'day'} />
      <PottedPlant p={[-5.6, 0, -2.4]} s={1.3} />
      <PottedPlant p={[2.1, 0, -2.6]} s={0.8} />
      <PictureFrame p={[0.4, 3.1, -2.98]} w={1.2} h={0.8} art="#e07a5f" />
      <PictureFrame p={[-1.3, 3.0, -2.98]} w={0.5} h={0.65} art="#5c946e" />
      <WallClock p={[2.6, 3.3, -2.98]} />
      <group position={[-6.45, 0, 0.8]} rotation={[0, Math.PI / 2, 0]}><SceneProp kind="door" /></group>
      <pointLight position={[0, 4.6, 0.8]} intensity={10} distance={12} decay={1.4} color="#fff0d8" />
    </>,
  },
};
ENVIRONMENTS.room = ENVIRONMENTS['living-room'];

const LIGHT = {
  day: {key: '#fff4e2', keyI: 2.4, fill: 1.0, sky: '#cfe6ff', ground: '#8a7a60', rim: '#cfe0ff', rimI: 1.0},
  dusk: {key: '#ffb27a', keyI: 2.0, fill: 0.7, sky: '#9fa8e0', ground: '#7a5a50', rim: '#ffd0a0', rimI: 1.3},
  night: {key: '#9fb2ff', keyI: 0.8, fill: 0.45, sky: '#3a4a8a', ground: '#202030', rim: '#7fa0ff', rimI: 0.9},
};

export const EnvironmentView: React.FC<{preset: string; palette?: Pal; timeOfDay: TOD}> = ({preset, palette, timeOfDay}) => {
  const def = ENVIRONMENTS[preset];
  if (!def) throw new Error(`Unknown environment "${preset}". Known: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  const pal = {...def.palette, ...(palette ?? {})};
  const sky = def.sky(pal, timeOfDay);
  const L = LIGHT[timeOfDay];
  const keyPos: [number, number, number] = timeOfDay === 'dusk' ? [-9, 5, 4] : [6, 10, 7];
  return (
    <>
      <color attach="background" args={[sky.horizon]} />
      <fog attach="fog" args={[sky.horizon, def.fog?.[0] ?? (def.indoor ? 30 : 28), def.fog?.[1] ?? (def.indoor ? 80 : 140)]} />
      {!def.indoor && <SkyDome top={sky.top} horizon={sky.horizon} />}
      <hemisphereLight args={[L.sky, L.ground, def.indoor ? L.fill * 1.8 : L.fill]} />
      <directionalLight position={keyPos} intensity={def.indoor ? L.keyI * 0.8 : L.keyI} color={L.key} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={12} shadow-camera-bottom={-8} shadow-camera-far={60} shadow-bias={-0.0004} shadow-normalBias={0.02} />
      {/* rim light from behind separates characters from the background */}
      <directionalLight position={[-4, 6, -9]} intensity={L.rimI} color={L.rim} />
      <ambientLight intensity={0.15} />
      {def.build(pal, timeOfDay)}
    </>
  );
};
