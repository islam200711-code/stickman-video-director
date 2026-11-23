import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ACTIONS, VideoSpec, totalFrames} from '../schema/scene';
import {ACTION_FNS, evaluateCharacter, PROPORTIONS} from '../animations/library';
import {storyboardToSpec} from '../adapters/storyboardToSpec';
import {LIBRARY, resolveCast} from '../characters';
import {ENVIRONMENTS} from '../three/environments';

const finitePose = (p: object): boolean => Object.values(p).every((v) => (typeof v === 'number' ? Number.isFinite(v) : finitePose(v as object)));

test('every declared action has a deterministic, finite pose function', () => {
  for (const a of ACTIONS) {
    assert.ok(ACTION_FNS[a], `missing action ${a}`);
    for (const t of [0, 0.37, 1.2, 4.9]) {
      const c = {intensity: 1, travel: t, seed: 1.3};
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
