/**
 * Hybrid character renderer — FLAT_2D and HYBRID_2_5D.
 *
 * Uses the SAME skeleton solver + animation data as Style C. The solved world
 * joints are flattened onto a camera-facing plane through the character, so the
 * figure is a clean 2D drawing that still lives at the right depth in the 3D set
 * (occluded by foreground set pieces, correct scale/parallax).
 *
 * Lighting rule: characters use unlit materials — scene lights never shade them.
 *  - flat_2d:     flat fills + dark outline
 *  - hybrid_2_5d: flat fills + baked cel shade/highlight from a fixed per-character
 *                 light direction (independent of the environment's lights)
 */
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {PROPORTIONS as P, type CharacterFrame, type HandShape} from '../animations/library';
import type {CharacterProfile, Vec3} from '../schema/scene';
import {BUILD_THICKNESS} from '../characters';
import {solveSkeleton} from '../three/skeleton';
import {FACE, blendFace, type FaceDef} from '../three/Stickman';
import {HandProp} from '../three/props';
import {ContactShadow} from '../three/ContactShadow';

export type CharacterMode2D = 'flat_2d' | 'hybrid_2_5d';
const V = THREE.Vector3;
const INK = '#17171c';

const col = (c: string, k: number) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();
const lighten = (c: string, k: number) => '#' + new THREE.Color(c).lerp(new THREE.Color('#ffffff'), k).getHexString();

/** Plane basis: points are expressed as origin + u*right + v*up + d*normal(toward camera). */
type Basis = {o: THREE.Vector3; r: THREE.Vector3; u: THREE.Vector3; n: THREE.Vector3};
const at = (b: Basis, x: number, y: number, d: number) => b.o.clone().addScaledVector(b.r, x).addScaledVector(b.u, y).addScaledVector(b.n, d);

/** Accumulates flat triangles for one colour layer. */
class Layer {
  pos: number[] = [];
  tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);}
  disc(b: Basis, x: number, y: number, rx: number, ry: number, d: number, seg = 20, a0 = 0, a1 = Math.PI * 2) {
    const c = at(b, x, y, d);
    for (let i = 0; i < seg; i++) {
      const t0 = a0 + ((a1 - a0) * i) / seg, t1 = a0 + ((a1 - a0) * (i + 1)) / seg;
      this.tri(c, at(b, x + Math.cos(t0) * rx, y + Math.sin(t0) * ry, d), at(b, x + Math.cos(t1) * rx, y + Math.sin(t1) * ry, d));
    }
  }
  /** round-capped polyline stroke in plane coordinates */
  stroke(b: Basis, pts: [number, number][], hw: number, d: number) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6;
      const px = (-dy / L) * hw, py = (dx / L) * hw;
      const a = at(b, x0 + px, y0 + py, d), a2 = at(b, x0 - px, y0 - py, d), c = at(b, x1 + px, y1 + py, d), c2 = at(b, x1 - px, y1 - py, d);
      this.tri(a, a2, c); this.tri(c, a2, c2);
    }
    for (const [x, y] of pts) this.disc(b, x, y, hw, hw, d, 12);
  }
  geometry() {const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); return g;}
}

const matCache = new Map<string, THREE.MeshBasicMaterial>();
const flat = (c: string) => {if (!matCache.has(c)) matCache.set(c, new THREE.MeshBasicMaterial({color: c, side: THREE.DoubleSide, toneMapped: false})); return matCache.get(c)!;};

const LayerMesh: React.FC<{layer: Layer; color: string; order: number}> = ({layer, color, order}) => {
  const geo = useMemo(() => layer.geometry(), [layer]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={flat(color)} renderOrder={order} frustumCulled={false} />;
};

const MOUTH: Record<string, [number, number][]> = {
  line: [[-0.32, 0], [0, -0.03], [0.32, 0]],
  smile: [[-0.42, 0.08], [-0.2, -0.1], [0.2, -0.1], [0.42, 0.08]],
  frown: [[-0.36, -0.08], [-0.15, 0.06], [0.15, 0.06], [0.36, -0.08]],
  wavy: [[-0.36, -0.03], [-0.18, 0.05], [0, -0.03], [0.18, 0.05], [0.36, -0.03]],
  smirk: [[-0.3, -0.04], [0.08, -0.05], [0.36, 0.09]],
  flat: [[-0.36, 0], [0.36, 0]],
};

export const Stickman2D: React.FC<{
  profile: CharacterProfile; frame: CharacterFrame; time: number; lineWidth?: number; gaze?: Vec3;
  cameraPos: Vec3; mode: CharacterMode2D;
}> = ({profile, frame: frame0, time, lineWidth = 1, gaze, cameraPos, mode}) => {
  // --- gaze (same behaviour as Style C) ---
  let frame = frame0; let eyeLook = 0;
  const yaw = (frame0.facing * Math.PI) / 180;
  if (gaze && frame0.pose.tilt === 0) {
    const d = new V(gaze[0] - frame0.position[0], 0, gaze[2] - frame0.position[2]).applyAxisAngle(new V(0, 1, 0), -yaw);
    const want = Math.atan2(d.x, d.z);
    const turn = THREE.MathUtils.clamp(want - frame0.pose.twist, -0.85, 0.85) * 0.75;
    frame = {...frame0, pose: {...frame0.pose, headYaw: frame0.pose.headYaw * 0.4 + turn}};
    eyeLook = THREE.MathUtils.clamp(want - turn, -0.6, 0.6);
  }
  const toLocal = (w?: Vec3) => w ? new V(w[0] - frame.position[0], w[1] - frame.position[1], w[2] - frame.position[2]).applyAxisAngle(new V(0, 1, 0), -yaw).multiplyScalar(1 / profile.scale) : undefined;
  const sk = solveSkeleton(frame.pose, {reachLocal: {left: toLocal(frame.reach?.left), right: toLocal(frame.reach?.right)}, reachWeight: frame.reach?.weight ?? 0});

  // local -> world
  const root = new V(...frame.position);
  const W = (p: THREE.Vector3) => p.clone().multiplyScalar(profile.scale).applyAxisAngle(new V(0, 1, 0), yaw).add(root);

  // camera-facing plane through the pelvis
  const pelvisW = W(sk.pelvis);
  const cam = new V(...cameraPos);
  const n = cam.clone().sub(pelvisW); n.y = 0; if (n.lengthSq() < 1e-6) n.set(0, 0, 1); n.normalize();
  const r = new V(0, 1, 0).cross(n).normalize(); // camera right on the plane
  const b: Basis = {o: pelvisW, r, u: new V(0, 1, 0), n};
  // project a world point into plane coords (x,y) + depth (toward camera)
  const pr = (w: THREE.Vector3): [number, number, number] => {const d = w.clone().sub(pelvisW); return [d.dot(r), d.dot(b.u), d.dot(n)];};
  const L = (p: THREE.Vector3) => pr(W(p));

  const s = profile.scale;
  const thick = BUILD_THICKNESS[profile.build] * lineWidth;
  const hw = 0.036 * thick * s, ow = hw + 0.016 * s; // fill half-width, outline half-width
  const fill = profile.color, outline = col(profile.color, 0.38);
  const shade = col(profile.color, 0.84), hilite = lighten(profile.color, 0.22);
  const headFill = profile.headColor ?? '#fbf6ee';

  // character facing relative to camera: -1 (profile left) .. 0 (front) .. 1 (profile right)
  const fwdW = new V(Math.sin(yaw + frame.pose.headYaw), 0, Math.cos(yaw + frame.pose.headYaw));
  const side = THREE.MathUtils.clamp(fwdW.dot(r), -1, 1);
  const away = fwdW.dot(n) < -0.2; // facing away from camera: no face

  const layers = useMemo(() => {
    const out = new Layer(), body = new Layer(), sh = new Layer(), hl = new Layer(), head = new Layer(), headOut = new Layer(), headSh = new Layer(), ink = new Layer(), white = new Layer(), mouthIn = new Layer(), acc = new Layer();
    // depth layering inside the figure: compress real depth so limbs order correctly without leaving the plane
    const dz = (z: number) => z * 0.18;
    type Limb = {pts: [number, number][]; z: number};
    const limb = (ps: THREE.Vector3[]): Limb => {const q = ps.map(L); return {pts: q.map(([x, y]) => [x, y] as [number, number]), z: q.reduce((a, c) => a + c[2], 0) / q.length};};
    const chest = sk.chest, neckTop = sk.neck.clone().add(new V(0, P.neck, 0).applyQuaternion(sk.bodyQuat));
    const torso = limb([sk.pelvis, sk.pelvis.clone().lerp(neckTop, 0.5), chest, neckTop]);
    const arms = [sk.lArm, sk.rArm].map((a) => limb([chest.clone().lerp(a.shoulder, 0.4), a.shoulder, a.elbow, a.wrist]));
    const legs = [sk.lLeg, sk.rLeg].map((l) => limb([sk.pelvis.clone().lerp(l.hip, 0.5), l.hip, l.knee, l.ankle]));
    const parts = [torso, ...arms, ...legs].sort((a, c) => a.z - c.z); // far -> near
    // one continuous silhouette: every outline sits behind every fill, so no internal seams
    const backD = Math.min(...parts.map((p) => dz(p.z))) - 0.004;
    parts.forEach((p, i) => {
      const d = dz(p.z) + i * 0.0015;
      out.stroke(b, p.pts, ow, backD);
      body.stroke(b, p.pts, hw, d);
      if (mode === 'hybrid_2_5d') {
        // cel shade: darker lower-right band + lighter upper-left highlight (fixed character light)
        sh.stroke(b, p.pts.map(([x, y]) => [x + hw * 0.45, y - hw * 0.45] as [number, number]), hw * 0.5, d + 0.0003);
        hl.stroke(b, p.pts.map(([x, y]) => [x - hw * 0.42, y + hw * 0.42] as [number, number]), hw * 0.16, d + 0.0005);
      }
    });
    // hands + feet
    const hands: [THREE.Vector3, HandShape][] = [[sk.lArm.wrist, frame.pose.lHand], [sk.rArm.wrist, frame.pose.rHand]];
    hands.forEach(([w, shape], i) => {
      const [x, y, z] = L(w); const d = dz(z) + 0.012 + i * 0.001; const hr = hw * (shape === 'fist' ? 1.55 : 1.4);
      out.disc(b, x, y, hr + 0.016 * s, hr + 0.016 * s, backD); body.disc(b, x, y, hr, hr, d);
      const dirArm = (i === 0 ? sk.lArm : sk.rArm).handDir.clone().applyAxisAngle(new V(0, 1, 0), yaw);
      const hx = dirArm.dot(r), hy = dirArm.y;
      if (shape === 'point') {const tip: [number, number] = [x + hx * hr * 2.6, y + hy * hr * 2.6]; out.stroke(b, [[x, y], tip], hw * 0.55 + 0.012 * s, backD); body.stroke(b, [[x, y], tip], hw * 0.55, d + 0.0002);}
      if (shape === 'thumb') {const tip: [number, number] = [x, y + hr * 2.4]; out.stroke(b, [[x, y], tip], hw * 0.55 + 0.012 * s, backD); body.stroke(b, [[x, y], tip], hw * 0.55, d + 0.0002);}
      if (shape === 'open') {[-0.9, 0, 0.9].forEach((a) => {const tip: [number, number] = [x + (hx * Math.cos(a) - hy * Math.sin(a)) * hr * 1.9, y + (hx * Math.sin(a) + hy * Math.cos(a)) * hr * 1.9]; out.stroke(b, [[x, y], tip], hw * 0.4 + 0.012 * s, backD); body.stroke(b, [[x, y], tip], hw * 0.4, d + 0.0002);});}
    });
    [sk.lLeg.ankle, sk.rLeg.ankle].forEach((a, i) => {
      const [x, y, z] = L(a); const d = dz(z) + 0.01 + i * 0.001; const fx = side * 0.09 * s;
      const toe: [number, number] = [x + fx + (Math.abs(side) < 0.3 ? (i ? 0.03 : -0.03) * s : 0), y - 0.012 * s];
      out.stroke(b, [[x, y], toe], hw * 1.25 + 0.016 * s, backD); body.stroke(b, [[x, y], toe], hw * 1.25, d);
    });
    // head
    const [hx, hy, hz] = L(sk.headCenter); const R = P.head * s; const hd = dz(hz) + 0.03;
    headOut.disc(b, hx, hy, R + 0.022 * s, (R + 0.022 * s) * 1.04, hd - 0.001, 40);
    head.disc(b, hx, hy, R, R * 1.04, hd, 40);
    if (mode === 'hybrid_2_5d') {
      headSh.disc(b, hx + R * 0.1, hy - R * 0.1, R * 0.98, R * 1.0, hd + 0.0004, 40, -Math.PI * 0.75, Math.PI * 0.25); // lower-right shade crescent
    }
    // accessories (flat)
    const accCol = profile.accent ?? '#e33';
    if (profile.accessory === 'cap') {acc.disc(b, hx, hy + R * 0.32, R * 1.06, R * 0.8, hd + 0.004, 24, 0, Math.PI); acc.stroke(b, [[hx + side * R * 0.2, hy + R * 0.36], [hx + (side >= 0 ? 1 : -1) * R * 1.35, hy + R * 0.3]], R * 0.1, hd + 0.0045);}
    if (profile.accessory === 'bow') {[-1, 1].forEach((k) => acc.disc(b, hx + R * 0.62 + k * R * 0.24, hy + R * 0.82, R * 0.22, R * 0.15, hd + 0.004, 14));}
    if (profile.accessory === 'scarf') {const [nx, ny] = L(sk.neck); acc.stroke(b, [[nx - R * 0.45, ny + R * 0.12], [nx + R * 0.45, ny + R * 0.12]], R * 0.17, hd - 0.002); acc.stroke(b, [[nx + R * 0.25, ny + R * 0.08], [nx + R * 0.4, ny - R * 0.6]], R * 0.12, hd - 0.0015);}
    if (profile.accessory === 'tie') {const [cx, cy] = L(chest); acc.stroke(b, [[cx, cy], [cx, cy - R * 1.1]], R * 0.12, dz(L(chest)[2]) + 0.006);}
    // face (hidden when facing away)
    if (!away) {
      const f: FaceDef = blendFace(FACE[frame.exprFrom ?? frame.expression], FACE[frame.expression], frame.exprK ?? 1);
      const fx = hx + side * R * 0.42, fy = hy;              // face centre slides toward the facing side
      const both = Math.abs(side) < 0.85;                    // profile => one eye
      const seed = profile.id.length * 0.77 + profile.id.charCodeAt(0) * 0.13;
      const bp = (time + seed) % 3.6; const blink = bp < 0.13 ? Math.sin((bp / 0.13) * Math.PI) : 0;
      const lid = Math.max(blink, f.lid ?? 0); const eyeH = Math.max(0.08, f.eyeH * (1 - lid));
      const fd = hd + 0.006;
      const eyes = both ? [-1, 1] : [Math.sign(side) || 1];
      eyes.forEach((k) => {
        const ex = fx + k * R * 0.34 * (both ? 1 - Math.abs(side) * 0.4 : 0.2), ey = fy + R * 0.12;
        white.disc(b, ex, ey, R * 0.21, R * 0.27 * eyeH, fd, 18);
        if (eyeH > 0.15) {
          const px = ex + (f.pupil[0] * 5 + eyeLook * 0.06 + side * 0.04) * R, py = ey + f.pupil[1] * 5 * R - R * 0.02;
          ink.disc(b, px, py, R * 0.11, R * 0.14 * Math.min(1, eyeH), fd + 0.0005, 14);
          white.disc(b, px + R * 0.04, py + R * 0.05, R * 0.035, R * 0.035, fd + 0.001, 8);
        }
        const by = ey + R * (0.4 + f.browY * 5), bx = ex, a = k * f.brow;
        ink.stroke(b, [[bx - Math.cos(a) * R * 0.16, by - Math.sin(a) * R * 0.16], [bx + Math.cos(a) * R * 0.16, by + Math.sin(a) * R * 0.16]], R * 0.045, fd + 0.0007);
      });
      const talk = frame.talking ? Math.max(0, Math.sin(time * 16) * 0.5 + Math.sin(time * 10.7) * 0.5) : 0;
      const open = f.mouth === 'grin' ? 0.75 + talk * 0.25 : f.mouth === 'o' ? 0.7 + talk * 0.2 : talk;
      const mx = fx + side * R * 0.08, my = fy - R * 0.36;
      if (open > 0.05) {
        ink.disc(b, mx, my, R * 0.2, R * 0.17 * open + R * 0.02, fd, 18);
        if (open > 0.4) mouthIn.disc(b, mx, my - R * 0.07 * open, R * 0.1, R * 0.05 * open, fd + 0.0005, 10);
      } else {
        const m = MOUTH[f.mouth === 'grin' ? 'smile' : f.mouth === 'o' ? 'line' : f.mouth] ?? MOUTH.line;
        ink.stroke(b, m.map(([x, y]) => [mx + x * R * 0.55, my + y * R * 0.55] as [number, number]), R * 0.045, fd);
      }
      if (f.blush) [-1, 1].forEach((k) => mouthIn.disc(b, fx + k * R * 0.55, fy - R * 0.14, R * 0.13, R * 0.07, fd - 0.0002, 10));
    }
    return {out, body, sh, hl, head, headOut, headSh, ink, white, mouthIn, acc};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, frame, cameraPos[0], cameraPos[1], cameraPos[2], mode]);

  const ground = [frame.position[0], frame.position[2]] as [number, number];
  return (
    <group>
      <ContactShadow center={ground} lying={frame.pose.tilt !== 0} size={0.6 * s} />
      <LayerMesh layer={layers.out} color={outline} order={2} />
      <LayerMesh layer={layers.body} color={fill} order={3} />
      {mode === 'hybrid_2_5d' && <LayerMesh layer={layers.sh} color={shade} order={4} />}
      {mode === 'hybrid_2_5d' && <LayerMesh layer={layers.hl} color={hilite} order={5} />}
      <LayerMesh layer={layers.acc} color={profile.accent ?? '#e33'} order={6} />
      <LayerMesh layer={layers.headOut} color={outline} order={7} />
      <LayerMesh layer={layers.head} color={headFill} order={8} />
      {mode === 'hybrid_2_5d' && <LayerMesh layer={layers.headSh} color={col(headFill, 0.88)} order={9} />}
      <LayerMesh layer={layers.white} color="#ffffff" order={10} />
      <LayerMesh layer={layers.ink} color={INK} order={11} />
      <LayerMesh layer={layers.mouthIn} color={frame.expression === 'happy' || frame.expression === 'excited' ? '#ff8a9a' : '#e0607a'} order={12} />
      {frame.prop && <group position={W(sk.rArm.wrist)}><HandProp kind={frame.prop} /></group>}
    </group>
  );
};
