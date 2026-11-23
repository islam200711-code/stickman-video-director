/**
 * Deterministic camera: keyframes with eased moves, hard cuts, constant
 * hand-held shake and decaying impact bursts. Pure function of time.
 */
import type {Camera, Vec3} from '../schema/scene';
import {smooth} from '../animations/library';

export type CamState = {position: Vec3; lookAt: Vec3; fov: number; label?: string};
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function cameraAt(cam: Camera, t: number): CamState {
  const keys = [...cam.keys].sort((a, b) => a.t - b.t);
  const k0 = keys[0];
  let s: CamState = {position: k0.position, lookAt: k0.lookAt, fov: k0.fov, label: k0.label};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.t && t < b.t) {
      if (b.cut) {s = {position: a.position, lookAt: a.lookAt, fov: a.fov, label: a.label}; break;} // hold until the cut
      const raw = (t - a.t) / Math.max(1e-6, b.t - a.t);
      const k = cam.ease === 'linear' ? raw : smooth(raw);
      s = {position: lerp3(a.position, b.position, k), lookAt: lerp3(a.lookAt, b.lookAt, k), fov: a.fov + (b.fov - a.fov) * k, label: a.label};
      break;
    }
    if (t >= b.t) s = {position: b.position, lookAt: b.lookAt, fov: b.fov, label: b.label};
  }
  const n = (f: number, o: number) => Math.sin(t * f + o) * 0.5 + Math.sin(t * f * 2.3 + o * 1.7) * 0.3;
  let shake = cam.shake * 0.05;
  for (const im of cam.impacts) {
    const dt = t - im.t;
    if (dt >= 0 && dt < 0.8) shake += im.strength * 0.09 * Math.exp(-dt * 6);
  }
  if (shake > 0) {
    s = {...s, position: [s.position[0] + n(23, 1) * shake, s.position[1] + n(29, 2) * shake, s.position[2]], lookAt: [s.lookAt[0] + n(31, 3) * shake * 0.5, s.lookAt[1] + n(37, 4) * shake * 0.5, s.lookAt[2]]};
  }
  return s;
}
