/**
 * Title & caption safe zones.
 * Projects every character (and every moving prop = important action) through the
 * scene camera to screen rectangles, then places each text block in the candidate
 * band that overlaps them least over the block's whole lifetime. Placement is
 * decided once per text block, so text never jumps around mid-read.
 * Pure + deterministic: shared by the renderer (Overlays) and QC (`sve safezones`).
 */
import * as THREE from 'three';
import type {Scene} from '../schema/scene';
import {evaluateCharacter} from '../animations/library';
import {cameraAt} from '../three/camera';
import {propMotion} from '../animations/weight';
import {headWorld} from '../animations/head';

export type Rect = {x0: number; y0: number; x1: number; y1: number; weight: number; kind: 'head' | 'body' | 'action'};
export type Slot = 'top' | 'center' | 'bottom' | 'top-left' | 'bottom-left' | 'side-left' | 'side-right';
export type Placement = {slot: Slot; box: Rect; score: number; headHits: number; bodyHits: number; samples: number};

/** Broadcast-style margins: action-safe 5%, title-safe 10% (fractions of frame). */
export const TITLE_SAFE = 0.06;

const cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 300);
const v = new THREE.Vector3();
function project(p: [number, number, number], w: number, h: number) {
  v.set(p[0], p[1], p[2]).project(cam);
  return {x: (v.x * 0.5 + 0.5) * w, y: (1 - (v.y * 0.5 + 0.5)) * h, behind: v.z > 1};
}
function bbox(points: [number, number, number][], w: number, h: number, kind: Rect['kind'], weight: number): Rect | null {
  const ps = points.map((p) => project(p, w, h)).filter((p) => !p.behind);
  if (!ps.length) return null;
  const r = {x0: Math.min(...ps.map((p) => p.x)), y0: Math.min(...ps.map((p) => p.y)), x1: Math.max(...ps.map((p) => p.x)), y1: Math.max(...ps.map((p) => p.y)), weight, kind};
  if (r.x1 < 0 || r.y1 < 0 || r.x0 > w || r.y0 > h) return null;
  return {...r, x0: Math.max(0, r.x0), y0: Math.max(0, r.y0), x1: Math.min(w, r.x1), y1: Math.min(h, r.y1)};
}

/** Screen-space rectangles of everything text must not cover, at scene time t. */
export function protectedRects(scene: Scene, t: number, w: number, h: number): Rect[] {
  const c = cameraAt(scene.camera, t);
  cam.fov = c.fov; cam.aspect = w / h; cam.position.set(...c.position); cam.lookAt(...c.lookAt); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const rects: Rect[] = [];
  for (const ch of scene.characters) {
    const f = evaluateCharacter(ch, t, scene.duration);
    const [x, , z] = f.position, s = 1, lying = f.pose.tilt !== 0;
    const top = lying ? 0.5 : 2.05 * s;
    const body: [number, number, number][] = [];
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.4, 0.4]) for (const y of [0, top]) body.push([x + dx * (lying ? 2 : 1), y, z + dz * (lying ? 3 : 1)]);
    const b = bbox(body, w, h, 'body', 1); if (b) rects.push(b);
    if (!lying) {
      const head: [number, number, number][] = [];
      const hc = headWorld(ch, t, scene.duration);
      for (const dx of [-0.23, 0.23]) for (const dy of [-0.23, 0.27]) for (const dz of [-0.23, 0.23]) head.push([hc[0] + dx, hc[1] + dy, hc[2] + dz]);
      const hb = bbox(head, w, h, 'head', 4); if (hb) rects.push(hb);
    }
  }
  for (const p of scene.props) {
    if (!p.move) continue;
    const u = (t - p.move.start) / Math.max(0.01, p.move.end - p.move.start);
    if (u < -0.2 || u > 1.1) continue;
    const k = propMotion(p.move.weight, u).k, r = 0.9 * p.scale;
    const pos = [0, 1, 2].map((i) => p.position[i] + (p.move!.to[i] - p.position[i]) * k);
    const pts: [number, number, number][] = [];
    for (const dx of [-r, r]) for (const dy of [0, 2 * r]) for (const dz of [-r, r]) pts.push([pos[0] + dx, pos[1] + dy, pos[2] + dz]);
    const pb = bbox(pts, w, h, 'action', 2); if (pb) rects.push(pb);
  }
  return rects;
}

const area = (r: {x0: number; y0: number; x1: number; y1: number}) => Math.max(0, r.x1 - r.x0) * Math.max(0, r.y1 - r.y0);
const inter = (a: Rect, b: Rect) => area({x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1)});

/** Estimated rendered text box (matches Overlays typography). */
export function textBox(text: string, style: string, slot: Slot, w: number, h: number): Rect {
  const u = h / 720;
  const size = (style === 'title' ? 64 : style === 'caption' ? 34 : 34) * u;
  const padX = (style === 'title' ? 24 : 20) * u, padY = (style === 'title' ? 10 : 8) * u;
  const narrow = slot === 'side-left' || slot === 'side-right';
  const maxW = w * (narrow ? 0.29 : style === 'caption' ? 0.82 : 0.86);
  const raw = text.length * size * 0.56 + padX * 2;
  const lines = Math.ceil(raw / maxW);
  const bw = Math.min(raw, maxW), bh = lines * size * 1.2 + padY * 2;
  const margin = w * TITLE_SAFE;
  const yTop = h * TITLE_SAFE, yBottom = h * (1 - TITLE_SAFE) - bh, yCenter = h * 0.45 - bh / 2;
  const cx = (w - bw) / 2;
  const pos: Record<Slot, [number, number]> = {top: [cx, yTop], center: [cx, yCenter], bottom: [cx, yBottom], 'top-left': [margin, yTop], 'bottom-left': [margin, yBottom], 'side-left': [margin, yBottom], 'side-right': [w - margin - bw, yBottom]};
  const [x, y] = pos[slot];
  return {x0: x, y0: y, x1: x + bw, y1: y + bh, weight: 1, kind: 'body'};
}

const ORDER: Record<string, Slot[]> = {
  title: ['top', 'bottom', 'center', 'side-left', 'side-right'],
  label: ['top', 'bottom', 'top-left', 'bottom-left'],
  'lower-third': ['bottom-left', 'top-left', 'bottom', 'top'],
  caption: ['bottom', 'side-left', 'side-right', 'top'],
};

export function placeText(scene: Scene, text: string, style: string, preferred: string, start: number, end: number, w: number, h: number, fps: number): Placement {
  const pref = preferred !== 'auto' ? [preferred as Slot] : [];
  const cands = [...pref, ...ORDER[style] ?? ORDER.label].filter((x, i, a) => a.indexOf(x) === i);
  const step = 3 / fps;
  const times: number[] = [];
  for (let t = Math.max(0, start); t <= Math.min(scene.duration, end); t += step) times.push(t);
  const rectsAt = times.map((t) => protectedRects(scene, t, w, h));
  let best: Placement | null = null;
  cands.forEach((slot, i) => {
    const box = textBox(text, style, slot, w, h);
    const a = area(box) || 1;
    let score = 0, headHits = 0, bodyHits = 0;
    rectsAt.forEach((rs) => {
      let hitH = false, hitB = false;
      for (const r of rs) {const o = inter(box, r); if (o > 0) {score += (o / a) * r.weight; if (r.kind === 'head') hitH = true; else hitB = true;}}
      if (hitH) {headHits++; score += 25;} if (hitB) bodyHits++; // heads are a hard constraint
    });
    score = score / Math.max(1, rectsAt.length) + i * 0.002; // tiny preference for the earlier slot on ties
    if (!best || score < best.score) best = {slot, box, score, headHits, bodyHits, samples: rectsAt.length};
  });
  return best!;
}
