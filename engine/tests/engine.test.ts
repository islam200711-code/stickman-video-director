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
    if (a !== 'fall' && a !== 'lying') assert.ok(Math.min(sk.lLeg.ankle.y, sk.rLeg.ankle.y) >= 0.045 - 1e-6, `${a} foot below ground`);
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
