/** Deterministic keyframed camera with optional procedural shake. */
import type {Camera, Vec3} from '../schema/scene';
import {smooth} from '../animations/library';

export type CamState = {position: Vec3; lookAt: Vec3; fov: number};
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function cameraAt(cam: Camera, t: number): CamState {
  const keys = [...cam.keys].sort((a, b) => a.t - b.t);
  let s: CamState = {position: keys[0].position, lookAt: keys[0].lookAt, fov: keys[0].fov};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const raw = (t - a.t) / Math.max(1e-6, b.t - a.t);
      const k = cam.ease === 'linear' ? raw : smooth(raw);
      s = {position: lerp3(a.position, b.position, k), lookAt: lerp3(a.lookAt, b.lookAt, k), fov: a.fov + (b.fov - a.fov) * k};
      break;
    }
    if (t > b.t) s = {position: b.position, lookAt: b.lookAt, fov: b.fov};
  }
  if (cam.shake > 0) {
    const n = (f: number, o: number) => Math.sin(t * f + o) * 0.5 + Math.sin(t * f * 2.3 + o * 1.7) * 0.3;
    s = {...s, position: [s.position[0] + n(23, 1) * cam.shake * 0.05, s.position[1] + n(29, 2) * cam.shake * 0.05, s.position[2]]};
  }
  return s;
}
