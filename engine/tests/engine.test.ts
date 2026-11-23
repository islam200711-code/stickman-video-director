import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ACTIONS, VideoSpec, totalFrames} from '../schema/scene';
import {ACTION_FNS, evaluateCharacter, PROPORTIONS} from '../animations/library';
import {storyboardToSpec} from '../adapters/storyboardToSpec';
import {LIBRARY, resolveCast} from '../characters';
import {ENVIRONMENTS} from '../three/environments';
import {solveSkeleton} from '../three/skeleton';
import * as THREE from 'three';

const finitePose = (p: object): boolean => Object.values(p).every((v) => (typeof v === 'number' ? Number.isFinite(v) : typeof v === 'string' ? true : finitePose(v as object)));

test('every declared action has a deterministic, finite pose function', () => {
  for (const a of ACTIONS) {
    assert.ok(ACTION_FNS[a], `missing action ${a}`);
    for (const t of [0, 0.37, 1.2, 4.9]) {
      const c = {intensity: 1, travel: t, seed: 1.3, speed: 1, accel: 0};
      const p1 = ACTION_FNS[a](t, c), p2 = ACTION_FNS[a](t, c);
      assert.deepEqual(p1, p2, `${a} not deterministic`);
      assert.ok(finitePose(p1), `${a} produced NaN at ${t}`);
    }
  }
});

test('locomotion moves the character to its target and blends between cues', () => {
  const ch = {id: 'x', position: [0, 0, 0] as [number, number, number], facing: 0, expression: 'neutral' as const,
    track: [{action: 'walk' as const, start: 0, end: 2, to: [4, 0, 0] as [number, number, number], speed: 1, intensity: 1}, {action: 'wave' as const, start: 2, speed: 1, intensity: 1}]};
  assert.deepEqual(evaluateCharacter(ch, 0, 4).position, [0, 0, 0]);
  const end = evaluateCharacter(ch, 3, 4);
  assert.ok(Math.abs(end.position[0] - 4) < 1e-9);
  assert.equal(end.action, 'wave');
  assert.ok(Math.abs(evaluateCharacter(ch, 1, 4).facing - 90) < 1e-6, 'walker faces travel direction');
});

test('character library keeps fixed proportions and resolves overrides', () => {
  assert.ok(LIBRARY.length >= 2);
  const cast = resolveCast([{id: 'sam', name: 'Sam', color: '#ff0000', accessory: 'none', build: 'standard', scale: 1}]);
  assert.equal(cast.sam.color, '#ff0000');
  assert.ok(cast.riley);
  assert.equal(PROPORTIONS.hip, PROPORTIONS.thigh + PROPORTIONS.shin);
});

test('adapter retimes to an exact frame count including transition overlaps', () => {
  const board = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../projects/ordinary-challenge/storyboard.json'), 'utf8'));
  const {spec} = storyboardToSpec(board, {narration: {}, sfx: {}});
  const parsed = VideoSpec.parse(spec);
  assert.equal(totalFrames(parsed), 30 * 24);
  for (const s of parsed.scenes) {
    assert.ok(ENVIRONMENTS[s.environment.preset], `unknown env ${s.environment.preset}`);
    assert.ok(s.camera.keys.length >= 1);
  }
  const envs = new Set(parsed.scenes.map((s) => s.environment.preset));
  assert.ok(envs.size >= 3, 'test video uses at least 3 environments');
});

test('niche is data, not engine logic', () => {
  const src = ['adapters/storyboardToSpec.ts', 'remotion/StickmanVideo.tsx', 'three/StageCanvas.tsx']
    .map((f) => fs.readFileSync(path.join(import.meta.dirname, '..', f), 'utf8')).join('\n');
  assert.ok(!/category\s*===|meta\.category\s*\?/.test(src), 'renderer must not branch on category');
});

test('Style C rig keeps locked bone lengths and feet on/above ground for every action', () => {
  const eq = (a: number, b: number, what: string) => assert.ok(Math.abs(a - b) < 1e-6, `${what}: ${a} vs ${b}`);
  for (const a of ACTIONS) for (const t of [0.1, 0.6, 1.3]) {
    const sk = solveSkeleton(ACTION_FNS[a](t, {intensity: 1, travel: 0, seed: 2, speed: 1, accel: 0}));
    for (const arm of [sk.lArm, sk.rArm]) {eq(arm.shoulder.distanceTo(arm.elbow), PROPORTIONS.upperArm, `${a} upper arm`); eq(arm.elbow.distanceTo(arm.wrist), PROPORTIONS.forearm, `${a} forearm`);}
    for (const leg of [sk.lLeg, sk.rLeg]) {eq(leg.hip.distanceTo(leg.knee), PROPORTIONS.thigh, `${a} thigh`); eq(leg.knee.distanceTo(leg.ankle), PROPORTIONS.shin, `${a} shin`);}
    if (!['fall', 'lying', 'knockdown', 'thrown'].includes(a)) assert.ok(Math.min(sk.lLeg.ankle.y, sk.rLeg.ankle.y) >= 0.045 - 1e-6, `${a} foot below ground`);
    if (a === 'lying') assert.ok(sk.headCenter.y >= PROPORTIONS.head - 0.02, 'lying head must not sink into the floor');
  }
});

test('two-bone IK places the hand on a reachable target and preserves bone lengths', () => {
  const pose = ACTION_FNS.push(0, {intensity: 1, travel: 0, seed: 1, speed: 0, accel: 0});
  const target = new THREE.Vector3(-0.1, 1.05, 0.55);
  const sk = solveSkeleton(pose, {reachLocal: {right: target}, reachWeight: 1});
  assert.ok(sk.rArm.wrist.distanceTo(target) < 1e-3, `wrist ${sk.rArm.wrist.toArray()} vs target`);
  assert.ok(Math.abs(sk.rArm.shoulder.distanceTo(sk.rArm.elbow) - PROPORTIONS.upperArm) < 1e-6);
  assert.ok(Math.abs(sk.rArm.elbow.distanceTo(sk.rArm.wrist) - PROPORTIONS.forearm) < 1e-6);
});

import {propMotion} from '../animations/weight';
import {cameraAt} from '../three/camera';
import {planShots} from '../director/coverage';
import {Storyboard} from '../director/storyboard';
import {protectedRects, textBox} from '../remotion/safezones';

test('object weight curves: heavy strains before moving and settles; drop lands with bounces', () => {
  assert.equal(propMotion('heavy', 0.1).k, 0, 'heavy object must not travel during the strain phase');
  assert.ok(propMotion('heavy', 0.1).wobble !== 0);
  assert.ok(propMotion('heavy', 1).k > 0.99 && propMotion('heavy', 1).k < 1.03);
  assert.ok(propMotion('drop', 0.2, 5).lift > propMotion('drop', 0.5, 5).lift, 'falls');
  assert.ok(propMotion('drop', 0.7, 5).lift > 0, 'bounces after landing');
  for (const w of ['smooth', 'heavy', 'light', 'drop'] as const) for (let u = 0; u <= 1; u += 0.05) assert.ok(Number.isFinite(propMotion(w, u, 3).k));
});

test('camera: hard cuts hold then jump; impacts add decaying shake', () => {
  const cam = {keys: [{t: 0, position: [0, 1, 5] as [number, number, number], lookAt: [0, 1, 0] as [number, number, number], fov: 40, cut: false}, {t: 2, position: [3, 1, 5] as [number, number, number], lookAt: [0, 1, 0] as [number, number, number], fov: 30, cut: true}], shake: 0, impacts: [{t: 1, strength: 1}], ease: 'inOut' as const};
  assert.deepEqual(cameraAt(cam, 1.9).position.map((x) => Math.round(x)), [0, 1, 5], 'holds until the cut');
  assert.equal(cameraAt(cam, 2).fov, 30);
  assert.notDeepEqual(cameraAt(cam, 1.05).position, [0, 1, 5], 'shake burst after impact');
  assert.deepEqual(cameraAt(cam, 1.95).position, [0, 1, 5], 'burst has decayed');
});

test('auto coverage: establish, dialogue singles/OTS, reaction close-up, min hold, title widening', () => {
  const board = Storyboard.parse(JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../projects/cinematic-benchmark/storyboard.json'), 'utf8')));
  const {spec} = storyboardToSpec(board, {narration: {}, sfx: {}});
  const sh = board.shots[0];
  const {plan} = planShots(sh, spec.scenes[0].characters, spec.scenes[0].duration, 1, 'establishing');
  assert.equal(plan[0].type, 'establishing');
  assert.ok(plan.some((p) => p.type === 'over-shoulder'), 'reverse dialogue uses OTS');
  assert.ok(plan.some((p) => p.type === 'close'), 'strong emotion gets a close-up');
  for (let i = 1; i < plan.length; i++) assert.ok(plan[i].t - plan[i - 1].t >= 1.25 - 1e-9, 'minimum shot length');
  const last = board.shots[3];
  const p4 = planShots(last, spec.scenes[3].characters, spec.scenes[3].duration, 1, 'establishing').plan;
  assert.ok(!p4.some((p) => (p.type === 'close' || p.type === 'extreme-close') && p.t + 0.1 > 4.6), 'no close-up under the title');
});

test('safe zones: projected heads are found and text boxes stay inside title-safe margins', () => {
  const board = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../projects/cinematic-benchmark/storyboard.json'), 'utf8'));
  const {spec} = storyboardToSpec(board, {narration: {}, sfx: {}});
  const rects = protectedRects(VideoSpec.parse(spec).scenes[0], 4, 1280, 720);
  assert.ok(rects.filter((r) => r.kind === 'head').length >= 2);
  for (const sl of ['top', 'bottom', 'side-left', 'side-right'] as const) {
    const b = textBox('A reasonably long caption line for testing', 'caption', sl, 1280, 720);
    assert.ok(b.x0 >= 1280 * 0.06 - 1 && b.x1 <= 1280 * 0.94 + 1 && b.y0 >= 720 * 0.06 - 1 && b.y1 <= 720 * 0.94 + 1, `${sl} outside title-safe`);
  }
});

import {choreograph} from '../choreography/director';
import {Shot as ShotSchema} from '../director/storyboard';
import {ACTION_TIMING} from '../animations/library';

const mkShot = (actions: unknown[], blocking: Record<string, unknown>) => ShotSchema.parse({id: 't', environment: 'studio', blocking, actions});

test('action director: reaction, VFX, SFX and camera impact land exactly on the contact frame', () => {
  const {shot, report} = choreograph(mkShot([{type: 'punch', at: 1, actor: 'a', target: 'b'}], {a: {at: [-0.46, 0, 0]}, b: {at: [0.46, 0, 0]}}));
  assert.equal(report.errors.length, 0, report.errors.join('; '));
  const tc = 1 + ACTION_TIMING.punch.contact;
  assert.ok(shot.beats.some((b) => b.who === 'b' && b.do === 'hit' && Math.abs(b.at - tc) < 1e-6), 'target reacts at contact');
  assert.ok(shot.vfx.some((v) => v.type === 'impact-flash' && Math.abs(v.at - tc) < 1e-6));
  assert.ok(shot.sfx.some((s) => s.sound.includes('impact') && Math.abs(s.at - tc) < 1e-6));
  assert.ok(shot.cameraImpacts.some((c) => Math.abs(c.at - tc) < 1e-6));
  const strike = shot.beats.find((b) => b.who === 'a' && b.do === 'punch')!;
  assert.ok(strike.reach?.right && strike.facing === 90, 'attacker faces target and aims an IK contact point');
  assert.equal(shot.actions.length, 0, 'idempotent: actions consumed');
});

test('action director: validation — unknown character, double booking, auto-approach', () => {
  assert.ok(choreograph(mkShot([{type: 'punch', at: 1, actor: 'a', target: 'ghost'}], {a: {at: [0, 0, 0]}})).report.errors.some((e) => e.includes('unknown character')));
  const dbl = choreograph(mkShot([{type: 'punch', at: 1, actor: 'a', target: 'b'}, {type: 'kick', at: 1.3, actor: 'a', target: 'b'}], {a: {at: [-0.46, 0, 0]}, b: {at: [0.46, 0, 0]}}));
  assert.ok(dbl.report.errors.some((e) => e.includes('double-booked')));
  const far = choreograph(mkShot([{type: 'handshake', at: 2, actor: 'a', target: 'b'}], {a: {at: [-3, 0, 0]}, b: {at: [3, 0, 0]}}));
  assert.equal(far.report.errors.length, 0);
  assert.ok(far.report.warnings.some((w) => w.includes('auto-approach')));
  assert.ok(far.shot.beats.some((b) => b.who === 'a' && (b.do === 'walk' || b.do === 'run') && b.until === 2));
});

test('action director: every interaction type expands without errors', () => {
  for (const type of ['punch', 'kick', 'grab', 'throw', 'push', 'pull', 'rescue', 'handshake', 'highfive', 'transfer']) {
    const {report, shot} = choreograph(mkShot([{type, at: 1, actor: 'a', target: 'b', object: 'coffee'}], {a: {at: [-0.45, 0, 0]}, b: {at: [0.45, 0, 0]}}));
    assert.equal(report.errors.length, 0, `${type}: ${report.errors.join('; ')}`);
    assert.ok(shot.beats.some((b) => b.who === 'b'), `${type}: partner reacts`);
  }
});
