/**
 * Event-driven sound design (no narration by default).
 *
 *  - CUE_MAP: semantic cue names -> exact licensed catalog ids (deterministic, reviewable)
 *  - autoFoley(board): adds, in storyboard time, before the audio stage resolves files:
 *      footsteps   from actual gait distance (half-stride spacing), surface per environment
 *      HUD sounds  from ui events (terminal typing ticks, stamp, alert, glitch, target lock, map)
 *      ambience    one loop per shot chosen from the environment (overridable / 'none')
 *  - importance: sfx marked important (heavy impacts) get pre-hit music silence + ducking
 *    (applied in remotion/StickmanVideo.tsx).
 * All sources are CC0/CC-BY from the bundled catalog; credits are written by the audio stage.
 */
import type {Storyboard, Shot} from '../director/storyboard';
import {evaluateCharacter} from '../animations/library';
import type {SceneCharacter, Vec3} from '../schema/scene';

export const CUE_MAP: Record<string, string> = {
  'footstep grass': 'kenney-impact-footstep-grass-000', 'footstep concrete': 'kenney-impact-footstep-concrete-000',
  'footstep wood': 'kenney-impact-footstep-wood-000', 'footstep carpet': 'kenney-impact-footstep-carpet-000',
  'impact punch': 'kenney-impact-impact-punch-heavy-001', 'impact heavy': 'kenney-impact-impact-punch-heavy-000',
  'impact wood': 'kenney-impact-impact-wood-heavy-001', 'impact wood heavy': 'kenney-impact-impact-wood-heavy-000',
  'impact metal': 'kenney-impact-impact-metal-heavy-001', clap: 'kenney-impact-impact-soft-heavy-001',
  cloth: 'kenney-rpg-cloth1', paper: 'kenney-rpg-book-flip1', 'whoosh swish': 'artisticdude-swishes-swish-1',
  'ui tick': 'kenney-interface-tick-002', 'ui confirm': 'kenney-interface-confirmation-002', 'ui error': 'kenney-interface-error-003',
  'ui glitch': 'kenney-interface-glitch-002', 'ui select': 'kenney-interface-select-003', 'ui open': 'kenney-interface-maximize-002',
  'ui switch': 'kenney-interface-switch-001', 'door creak': 'kenney-rpg-creak1', 'phone ring': 'owlish-home-202-phone-phone1',
  'amb outdoor': 'kresiek-amb-outside-amb-outdoor1-loop', 'amb machine': 'rubberduck-general-100-2-sfx100v2-loop-machine-02',
  'amb industrial': 'rubberduck-general-100-2-sfx100v2-loop-construction-site', 'amb traffic': 'rubberduck-general-100-2-sfx100v2-loop-highway',
  'amb rain night': 'antoine-nature-nature-sounds-pack-ambient-ambientnaturenightrainy', 'amb fire': 'antum-fire-fire-1',
};

const SURFACE: Record<string, string> = {park: 'grass', forest: 'grass', cliff: 'grass', street: 'concrete', studio: 'concrete', office: 'carpet', 'living-room': 'wood', room: 'wood'};
const AMBIENCE: Record<string, string> = {park: 'amb outdoor', forest: 'amb outdoor', cliff: 'amb outdoor', street: 'amb traffic', office: 'amb machine', 'living-room': 'none', room: 'none', studio: 'none'};
export const surfaceFor = (env: string) => SURFACE[env] ?? (env.includes('industrial') || env.includes('lab') ? 'concrete' : 'concrete');
export const ambienceFor = (env: string, tod: string) => (tod === 'night' && ['park', 'forest', 'cliff'].includes(env) ? 'amb rain night' : AMBIENCE[env] ?? (env.includes('industrial') || env.includes('lab') ? 'amb machine' : 'none'));

function track(shot: Shot, id: string): SceneCharacter {
  const block = shot.blocking[id] ?? {at: [0, 0, 0] as Vec3, facing: 0, expression: 'neutral' as const};
  const beats = shot.beats.filter((b) => b.who === id).sort((a, b) => a.at - b.at);
  const tr = beats.map((b) => ({action: b.do, start: b.at, end: b.until, speed: b.speed ?? 1, intensity: b.intensity ?? 1, to: b.to, moveCurve: b.moveCurve}));
  if (!tr.length || tr[0].start > 0) tr.unshift({action: 'idle', start: 0, end: undefined, speed: 1, intensity: 1, to: undefined, moveCurve: undefined});
  return {id, position: block.at, facing: block.facing, expression: block.expression, track: tr} as SceneCharacter;
}

/** Footstep times for every locomotion beat, from sampled travel distance (half-stride). */
export function footsteps(shot: Shot, dur: number): {at: number; who: string; run: boolean}[] {
  const out: {at: number; who: string; run: boolean}[] = [];
  const ids = [...new Set([...Object.keys(shot.blocking), ...shot.beats.map((b) => b.who)])];
  for (const id of ids) {
    const loco = shot.beats.filter((b) => b.who === id && ['walk', 'run', 'escape'].includes(b.do) && b.to);
    if (!loco.length) continue;
    const ch = track(shot, id);
    for (const b of loco) {
      const run = b.do !== 'walk', half = (run ? 2.5 : 1.3) / 2;
      const t0 = b.at, t1 = b.until ?? Math.min(dur, b.at + 2);
      let prev = evaluateCharacter(ch, t0, dur).position, acc = half * 0.5;
      for (let t = t0 + 1 / 48; t <= t1; t += 1 / 48) {
        const p = evaluateCharacter(ch, t, dur).position; acc += Math.hypot(p[0] - prev[0], p[2] - prev[2]); prev = p;
        if (acc >= half) {acc -= half; out.push({at: Math.round(t * 1000) / 1000, who: id, run});}
      }
    }
  }
  return out;
}

export function autoFoley(board: Storyboard): Storyboard {
  if (board.foley !== 'auto') return board;
  const shots = board.shots.map((shot) => {
    const sfx = [...shot.sfx];
    const dur = shot.duration ?? 6;
    // footsteps
    const surf = surfaceFor(shot.environment);
    for (const f of footsteps(shot, dur)) sfx.push({sound: `footstep ${surf}`, at: f.at, volume: f.run ? 0.5 : 0.32});
    // HUD / screen sounds follow their ui events
    for (const u of shot.ui) {
      if (u.type === 'terminal') {
        const n = (u.lines ?? []).join('').length; for (let k = 0; k < Math.min(n, 60); k += 3) sfx.push({sound: 'ui tick', at: Math.round((u.at + 0.3 + k / 32) * 1000) / 1000, volume: 0.25});
        if (u.stamp) sfx.push({sound: 'ui confirm', at: Math.round((u.at + 0.3 + n / 32) * 1000) / 1000, volume: 0.7});
        sfx.push({sound: 'ui open', at: u.at, volume: 0.5});
      }
      if (u.type === 'alert') for (let k = 0; k < 3; k++) sfx.push({sound: 'ui error', at: Math.round((u.at + k * 0.6) * 1000) / 1000, volume: 0.65});
      if (u.type === 'glitch' || u.type === 'scanwipe') sfx.push({sound: 'ui glitch', at: u.at, volume: 0.6});
      if (u.type === 'target') sfx.push({sound: 'ui select', at: Math.round((u.at + 0.9) * 1000) / 1000, volume: 0.6});
      if (u.type === 'map' || u.type === 'news' || u.type === 'videocall') sfx.push({sound: 'ui open', at: u.at, volume: 0.45});
    }
    const amb = shot.ambience === 'auto' ? ambienceFor(shot.environment, shot.timeOfDay) : shot.ambience;
    return {...shot, sfx, ambience: amb};
  });
  return {...board, foley: 'done', shots};
}
