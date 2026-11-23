/**
 * Screen-space (2D) event effects drawn by Remotion above the 3D stage:
 * radial impact flash, ink burst, full-frame impact frame, single-frame colour flash.
 * World positions are projected through the scene camera, so the effect sits on the
 * contact point. Original designs: procedural jagged polygons, no assets.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import type {Scene} from '../schema/scene';
import {cameraAt} from '../three/camera';
import {rng} from '../three/assets';

type Ev = Scene['vfx'][number];
export const EFFECT_LIFE_2D: Record<string, number> = {'impact-flash': 0.13, 'ink-burst': 0.32, 'impact-frame': 0.09, 'color-flash': 0.05};

const cam = new THREE.PerspectiveCamera();
export function project(scene: Scene, t: number, p: [number, number, number], w: number, h: number) {
  const c = cameraAt(scene.camera, t);
  cam.fov = c.fov; cam.aspect = w / h; cam.near = 0.1; cam.far = 300; cam.position.set(...c.position); cam.lookAt(...c.lookAt); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(cam);
  const dist = cam.position.distanceTo(new THREE.Vector3(...p));
  return {x: (v.x * 0.5 + 0.5) * w, y: (1 - (v.y * 0.5 + 0.5)) * h, visible: v.z < 1, pxPerM: h / (2 * Math.tan(((c.fov / 2) * Math.PI) / 180) * dist)};
}

function star(cx: number, cy: number, rIn: number, rOut: number, n: number, seed: number, jag = 0.35) {
  const r = rng(seed); const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + r() * 0.08;
    const rad = i % 2 ? rIn * (0.8 + r() * 0.4) : rOut * (1 - jag + r() * jag * 1.4);
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return pts.join(' ');
}

export const Effects2D: React.FC<{scene: Scene}> = ({scene}) => {
  const {fps, width: w, height: h} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const els: React.ReactNode[] = [];
  scene.vfx.forEach((e: Ev, i) => {
    const life = e.duration ?? EFFECT_LIFE_2D[e.type];
    if (!life) return;
    const dt = t - e.at; if (dt < 0 || dt > life) return;
    const u = dt / life, seed = Math.round(e.at * 1000) + i;
    if (e.type === 'color-flash') {els.push(<AbsoluteFill key={i} style={{backgroundColor: e.color ?? '#ffffff', opacity: 0.92}} />); return;}
    if (e.type === 'impact-frame') {
      // full-frame graphic beat: white field + black jagged burst at the contact point (1–2 frames)
      const p = e.position ? project(scene, e.at, e.position, w, h) : {x: w / 2, y: h / 2, visible: true, pxPerM: h / 3};
      els.push(<AbsoluteFill key={i}><svg width={w} height={h}><rect width={w} height={h} fill={e.color ?? '#ffffff'} />
        <polygon points={star(p.x, p.y, h * 0.06, h * 0.55, 26, seed, 0.55)} fill="#111" /><circle cx={p.x} cy={p.y} r={h * 0.07} fill={e.color ?? '#ffffff'} /></svg></AbsoluteFill>);
      return;
    }
    if (!e.position) return;
    const p = project(scene, e.at, e.position, w, h);
    if (!p.visible) return;
    const base = Math.min(h * 0.45, Math.max(h * 0.05, p.pxPerM * 0.55)) * e.scale;
    if (e.type === 'impact-flash') {
      const grow = 0.6 + 0.6 * u, op = 1 - u * 0.6;
      els.push(<svg key={i} width={w} height={h} style={{position: 'absolute', inset: 0, opacity: op}}>
        <polygon points={star(p.x, p.y, base * 0.18 * grow, base * grow, 12, seed)} fill="#ffffff" stroke="#17171c" strokeWidth={Math.max(2, base * 0.04)} strokeLinejoin="round" />
        <polygon points={star(p.x, p.y, base * 0.1 * grow, base * 0.55 * grow, 8, seed + 7)} fill="#fff27a" />
      </svg>);
    }
    if (e.type === 'ink-burst') {
      const grow = 0.5 + 1.0 * Math.min(1, u * 2.5), op = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
      const r = rng(seed + 3);
      els.push(<svg key={i} width={w} height={h} style={{position: 'absolute', inset: 0, opacity: op}}>
        {u < 0.15 && <circle cx={p.x} cy={p.y} r={base * 1.2} fill="#ffffff" />}
        <polygon points={star(p.x, p.y, base * 0.25 * grow, base * 1.1 * grow, 18, seed, 0.6)} fill="#17171c" />
        {Array.from({length: 9}, (_, k) => {const a = r() * Math.PI * 2, d = base * (1.1 + r() * 0.9) * grow; return <circle key={k} cx={p.x + Math.cos(a) * d} cy={p.y + Math.sin(a) * d} r={base * (0.04 + r() * 0.08)} fill="#17171c" />;})}
      </svg>);
    }
  });
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{els}</AbsoluteFill>;
};
