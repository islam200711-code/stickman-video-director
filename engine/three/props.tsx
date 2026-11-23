/** Prop registry. Each prop is built from primitives, so no external models are needed. Add new kinds to PROPS. */
import React from 'react';

const M: React.FC<{c: string; e?: number}> = ({c, e = 0}) => <meshStandardMaterial color={c} roughness={0.7} emissive={c} emissiveIntensity={e} />;
type P = {color?: string};

export const PROPS: Record<string, React.FC<P>> = {
  box: ({color = '#c8a06a'}) => <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.5, 0.5, 0.5]} /><M c={color} /></mesh>,
  crate: ({color = '#9c6b3c'}) => <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[0.7, 0.7, 0.7]} /><M c={color} /></mesh>,
  boulder: ({color = '#8a8580'}) => <mesh position={[0, 0.6, 0]} castShadow><dodecahedronGeometry args={[0.75, 0]} /><M c={color} /></mesh>,
  rock: ({color = '#8a8580'}) => <mesh position={[0, 0.2, 0]} castShadow><dodecahedronGeometry args={[0.28, 0]} /><M c={color} /></mesh>,
  desk: ({color = '#b88b5a'}) => (<group>
    <mesh position={[0, 0.74, 0]} castShadow receiveShadow><boxGeometry args={[1.4, 0.06, 0.7]} /><M c={color} /></mesh>
    {[[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]].map(([x, z], i) => <mesh key={i} position={[x, 0.36, z]}><boxGeometry args={[0.05, 0.72, 0.05]} /><M c="#444" /></mesh>)}
  </group>),
  computer: ({color = '#2b2f36'}) => (<group position={[0, 0.77, 0]}>
    <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.6, 0.38, 0.04]} /><M c={color} /></mesh>
    <mesh position={[0, 0.25, 0.021]}><planeGeometry args={[0.54, 0.32]} /><meshBasicMaterial color="#7fd3ff" /></mesh>
    <mesh position={[0, 0.03, 0]}><boxGeometry args={[0.08, 0.06, 0.08]} /><M c={color} /></mesh>
    <mesh position={[0, 0.01, 0.25]}><boxGeometry args={[0.45, 0.02, 0.15]} /><M c="#555" /></mesh>
  </group>),
  chair: ({color = '#555b66'}) => (<group>
    <mesh position={[0, 0.47, 0]} castShadow><boxGeometry args={[0.5, 0.05, 0.5]} /><M c={color} /></mesh>
    <mesh position={[0, 0.8, -0.23]}><boxGeometry args={[0.5, 0.6, 0.05]} /><M c={color} /></mesh>
    <mesh position={[0, 0.23, 0]}><cylinderGeometry args={[0.03, 0.03, 0.46, 8]} /><M c="#333" /></mesh>
  </group>),
  tree: ({color = '#3f8f4a'}) => (<group>
    <mesh position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.12, 0.16, 1.6, 10]} /><M c="#7a5230" /></mesh>
    <mesh position={[0, 2.1, 0]} castShadow><sphereGeometry args={[0.9, 16, 12]} /><M c={color} /></mesh>
  </group>),
  bush: ({color = '#4c9c55'}) => <mesh position={[0, 0.3, 0]} castShadow><sphereGeometry args={[0.45, 14, 10]} /><M c={color} /></mesh>,
  door: ({color = '#8b5a2b'}) => (<group>
    <mesh position={[0, 1.05, 0]} castShadow><boxGeometry args={[0.95, 2.1, 0.08]} /><M c={color} /></mesh>
    <mesh position={[0.35, 1.0, 0.06]}><sphereGeometry args={[0.04, 8, 8]} /><M c="#e2c044" /></mesh>
  </group>),
  sign: ({color = '#f2d14b'}) => (<group>
    <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.03, 0.03, 1.6, 8]} /><M c="#555" /></mesh>
    <mesh position={[0, 1.5, 0.03]} rotation={[0, 0, Math.PI / 4]} castShadow><boxGeometry args={[0.5, 0.5, 0.04]} /><M c={color} /></mesh>
  </group>),
  lamp: ({color = '#ffe9a8'}) => (<group>
    <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.04, 0.05, 3.2, 8]} /><M c="#333" /></mesh>
    <mesh position={[0, 3.25, 0]}><sphereGeometry args={[0.18, 12, 10]} /><M c={color} e={1.2} /></mesh>
  </group>),
  building: ({color = '#8aa1b8'}) => (<group>
    <mesh position={[0, 2.5, 0]} castShadow receiveShadow><boxGeometry args={[3, 5, 2]} /><M c={color} /></mesh>
    {Array.from({length: 8}).map((_, i) => <mesh key={i} position={[-0.9 + (i % 3) * 0.9, 1.2 + Math.floor(i / 3) * 1.3, 1.01]}><planeGeometry args={[0.5, 0.7]} /><meshBasicMaterial color="#f7f2c8" /></mesh>)}
  </group>),
  phone: () => <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.07, 0.14, 0.015]} /><M c="#222" /></mesh>,
  ball: ({color = '#e24b3b'}) => <mesh position={[0, 0.15, 0]} castShadow><sphereGeometry args={[0.15, 16, 12]} /><M c={color} /></mesh>,
  umbrella: ({color = '#d33'}) => (<group>
    <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.012, 0.012, 1, 6]} /><M c="#333" /></mesh>
    <mesh position={[0, 1.0, 0]}><coneGeometry args={[0.6, 0.3, 16, 1, true]} /><meshStandardMaterial color={color} side={2} /></mesh>
  </group>),
  briefcase: ({color = '#5a3a22'}) => <mesh position={[0, -0.15, 0]} castShadow><boxGeometry args={[0.36, 0.26, 0.1]} /><M c={color} /></mesh>,
  coffee: () => <mesh position={[0, 0.05, 0.03]}><cylinderGeometry args={[0.045, 0.035, 0.11, 12]} /><M c="#f4efe6" /></mesh>,
  map: ({color = '#efe2b8'}) => <mesh position={[0, 0.05, 0.1]} rotation={[-0.6, 0, 0]}><planeGeometry args={[0.4, 0.3]} /><meshStandardMaterial color={color} side={2} /></mesh>,
  stairs: ({color = '#bbb'}) => (<group>{Array.from({length: 5}).map((_, i) => <mesh key={i} position={[0, 0.1 + i * 0.2, -i * 0.3]} castShadow receiveShadow><boxGeometry args={[1.5, 0.2 + i * 0.4, 0.3]} /><M c={color} /></mesh>)}</group>),
  river: ({color = '#4aa3df'}) => <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.2, 30]} /><meshStandardMaterial color={color} roughness={0.2} /></mesh>,
  tank: ({color = '#5f6b3a'}) => (<group>
    <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[3.0, 0.7, 1.7]} /><M c={color} /></mesh>
    <mesh position={[0, 0.3, 0.92]} castShadow><boxGeometry args={[3.2, 0.5, 0.35]} /><M c="#2f3328" /></mesh>
    <mesh position={[0, 0.3, -0.92]} castShadow><boxGeometry args={[3.2, 0.5, 0.35]} /><M c="#2f3328" /></mesh>
    {[-1.2, -0.6, 0, 0.6, 1.2].flatMap((x) => [0.92, -0.92].map((z) => <mesh key={`${x}${z}`} position={[x, 0.28, z * 1.12]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.06, 12]} /><M c="#1f221c" /></mesh>))}
    <mesh position={[-0.2, 1.15, 0]} castShadow><cylinderGeometry args={[0.62, 0.75, 0.5, 10]} /><M c={color} /></mesh>
    <mesh position={[1.05, 1.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.08, 0.1, 1.9, 10]} /><M c={color} /></mesh>
    <mesh position={[-0.2, 1.42, 0]}><cylinderGeometry args={[0.18, 0.2, 0.1, 10]} /><M c="#4c5530" /></mesh>
    <mesh position={[-0.2, 0.92, 0.86]} rotation={[0, 0, 0]}><circleGeometry args={[0.22, 5]} /><meshBasicMaterial color="#f2f2f2" /></mesh>
  </group>),
  speaker: ({color = '#3d4148'}) => (<group><mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.9, 1.2, 0.8]} /><M c={color} /></mesh>
    <mesh position={[0, 0.75, 0.41]}><circleGeometry args={[0.3, 20]} /><meshBasicMaterial color="#15171a" /></mesh><mesh position={[0, 0.3, 0.41]}><circleGeometry args={[0.14, 16]} /><meshBasicMaterial color="#15171a" /></mesh></group>),
  log: ({color = '#7a5230'}) => <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.15, 0.15, 2.8, 10]} /><M c={color} /></mesh>,
};

export const SceneProp: React.FC<{kind: string; color?: string}> = ({kind, color}) => {
  const C = PROPS[kind];
  if (!C) throw new Error(`Unknown prop kind "${kind}". Known: ${Object.keys(PROPS).join(', ')}`);
  return <C color={color} />;
};

/** Small props carried in the right hand (attached at the wrist). */
export const HandProp: React.FC<{kind: string}> = ({kind}) => {
  const C = PROPS[kind];
  if (!C) return null;
  const s = ['phone', 'coffee', 'briefcase', 'map', 'ball', 'umbrella'].includes(kind) ? 1 : 0.35;
  return <group scale={s}><C /></group>;
};
