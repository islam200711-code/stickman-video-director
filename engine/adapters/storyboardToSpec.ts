/**
 * Adapter: director Storyboard -> renderer VideoSpec.
 * Pure function: it never touches disk. Audio files and SFX paths are resolved
 * earlier by the audio stage and passed in as `assets`.
 *
 * Responsibilities
 *  - default shot durations from measured narration
 *  - retime all shots (and their beats/text/sfx) to hit brief.targetDuration exactly
 *  - convert beats into per-character action tracks
 *  - generate camera keyframes from film-language shot/move descriptions
 */
import {Storyboard, type Shot, type StoryboardInput, type Storyboard as StoryboardT} from '../director/storyboard';
import {z} from 'zod';
import {VideoSpec, Scene as SceneSchema, type ActionCue, type Scene, type SceneCharacter, type Vec3, totalFrames} from '../schema/scene';
import {buildAutoCamera, detectEvents} from '../director/coverage';
import {choreograph, type ChoreoReport} from '../choreography/director';
import {autoFoley} from '../audio/foley';
import {evaluateCharacter} from '../animations/library';

export type Assets = {
  narration: Record<string, {audio?: string; duration: number}>;
  sfx: Record<string, string>;          // storyboard sound query -> public path
  music?: string;
};
export type AdaptResult = {spec: VideoSpec; warnings: string[]; shotList: string[]; choreo: ChoreoReport};

/** Expand every shot's choreographed actions (idempotent: actions are emptied). Run before the audio stage so SFX cues resolve. */
export function expandChoreography(board: StoryboardT): {board: StoryboardT; report: ChoreoReport} {
  const report: ChoreoReport = {errors: [], warnings: [], log: []};
  return {board: {...board, shots: board.shots.map((s) => choreograph(s, report).shot)}, report};
}

// Style C lens rules: wider lens for space, longer lens (compression) for faces.
const SHOT_DIST = {establishing: 14, wide: 8.5, 'two-shot': 5.4, medium: 4.2, close: 2.6, 'extreme-close': 1.5, low: 5.8, high: 7, 'over-shoulder': 2.2} as const;
const LOOK_Y = {establishing: 1.3, wide: 1.1, 'two-shot': 1.25, medium: 1.35, close: 1.68, 'extreme-close': 1.74, low: 1.5, high: 0.8, 'over-shoulder': 1.6} as const;
const CAM_Y = {establishing: 3.0, wide: 1.8, 'two-shot': 1.55, medium: 1.55, close: 1.72, 'extreme-close': 1.76, low: 0.45, high: 6, 'over-shoulder': 1.75} as const;
const FOV = {establishing: 42, wide: 40, 'two-shot': 36, medium: 34, close: 28, 'extreme-close': 24, low: 40, high: 40, 'over-shoulder': 32} as const;

function round(x: number, d = 3) {const k = 10 ** d; return Math.round(x * k) / k;}

function shotBaseDuration(shot: Shot, narr?: {duration: number}) {
  if (shot.duration) return shot.duration;
  const lastBeat = Math.max(0, ...shot.beats.map((b) => b.until ?? b.at + 1.5));
  return Math.max(3, narr ? narr.duration + 0.8 : 0, lastBeat);
}

function buildCharacters(shot: Shot, scale: number, warnings: string[]): SceneCharacter[] {
  const ids = new Set([...Object.keys(shot.blocking), ...shot.beats.map((b) => b.who)]);
  return [...ids].map((id) => {
    const block = shot.blocking[id] ?? {at: [0, 0, 0] as Vec3, facing: 0, expression: 'neutral' as const};
    if (!shot.blocking[id]) warnings.push(`shot ${shot.id}: "${id}" has beats but no blocking; placed at origin`);
    const beats = shot.beats.filter((b) => b.who === id).sort((a, b) => a.at - b.at);
    const track: ActionCue[] = beats.map((b) => ({
      action: b.do, start: round(b.at * scale), end: b.until !== undefined ? round(b.until * scale) : undefined,
      speed: b.speed ?? 1, intensity: b.intensity ?? 1, expression: b.expression, facing: b.facing, to: b.to, prop: b.prop, reach: b.reach, target: b.lookAt, lookAtCharacter: b.lookAtCharacter, moveCurve: b.moveCurve, reachRamp: b.reachRamp, reachAt: b.reachAt !== undefined ? b.reachAt * scale : undefined, reachUntil: b.reachUntil !== undefined ? b.reachUntil * scale : undefined,
    }));
    if (!track.length || track[0].start > 0) track.unshift({action: 'idle', start: 0, speed: 1, intensity: 1});
    return {id, label: block.label, position: block.at, facing: block.facing, expression: block.expression, track};
  });
}

function focusPoint(shot: Shot, chars: SceneCharacter[], t: number, dur: number): Vec3 {
  const f = shot.camera.focus;
  if (Array.isArray(f) && typeof f[0] === 'number') return f as Vec3;
  const ids = f === undefined ? chars.map((c) => c.id) : Array.isArray(f) ? (f as string[]) : [f as string];
  const pts = chars.filter((c) => ids.includes(c.id)).map((c) => evaluateCharacter(c, t, dur).position);
  if (!pts.length) return [0, 0, 0];
  return [pts.reduce((a, p) => a + p[0], 0) / pts.length, 0, pts.reduce((a, p) => a + p[2], 0) / pts.length];
}

function buildCamera(shot: Shot, chars: SceneCharacter[], dur: number): z.input<typeof SceneSchema>['camera'] {
  const {shot: type, move, angle, shake} = shot.camera;
  let yaw0 = (angle * Math.PI) / 180;
  const fov = shot.camera.fov ?? FOV[type];
  if (type === 'over-shoulder' && shot.camera.from) {
    // camera behind `from`, looking past their shoulder at the focus subject
    const a = chars.find((c) => c.id === shot.camera.from), f = focusPoint(shot, chars, 0, dur);
    if (a) {
      const ap = evaluateCharacter(a, 0, dur).position;
      const dx = f[0] - ap[0], dz = f[2] - ap[2], L = Math.hypot(dx, dz) || 1;
      const side = 0.45, back = 1.3;
      const pos: Vec3 = [round(ap[0] - (dx / L) * back - (dz / L) * side), CAM_Y[type], round(ap[2] - (dz / L) * back + (dx / L) * side)];
      const look: Vec3 = [round(f[0]), LOOK_Y[type], round(f[2])];
      const k1 = {t: 0, position: pos, lookAt: look, fov};
      if (move === 'push-in') return {keys: [k1, {t: dur, position: [round(pos[0] + (dx / L) * 0.4), pos[1], round(pos[2] + (dz / L) * 0.4)] as Vec3, lookAt: look, fov}], shake, ease: 'inOut'};
      return {keys: [k1], shake, ease: 'inOut'};
    }
  }
  const at = (t: number, distMul = 1, yawOff = 0, yOff = 0, xOff = 0) => {
    const f = focusPoint(shot, chars, t, dur);
    const d = SHOT_DIST[type] * distMul, yaw = yaw0 + yawOff;
    const look: Vec3 = [f[0] + xOff * 0.4, LOOK_Y[type], f[2]];
    const pos: Vec3 = [round(f[0] + Math.sin(yaw) * d + xOff), round(CAM_Y[type] + yOff), round(f[2] + Math.cos(yaw) * d)];
    return {position: pos, lookAt: look.map((v) => round(v)) as Vec3, fov};
  };
  const keys = (() => {
    switch (move) {
      case 'push-in': return [{t: 0, ...at(0, 1.3)}, {t: dur, ...at(0, 0.82)}];
      case 'pull-out': return [{t: 0, ...at(0, 0.8)}, {t: dur, ...at(0, 1.35)}];
      case 'pan-left': return [{t: 0, ...at(0, 1, 0, 0, 1.4)}, {t: dur, ...at(0, 1, 0, 0, -1.4)}];
      case 'pan-right': return [{t: 0, ...at(0, 1, 0, 0, -1.4)}, {t: dur, ...at(0, 1, 0, 0, 1.4)}];
      case 'orbit': return [{t: 0, ...at(0, 1, -0.45)}, {t: dur / 2, ...at(dur / 2, 1, 0)}, {t: dur, ...at(dur, 1, 0.45)}];
      case 'crane-up': return [{t: 0, ...at(0, 1, 0, -0.6)}, {t: dur, ...at(dur, 1.15, 0, 2.2)}];
      case 'track': {
        const n = Math.max(2, Math.ceil(dur));
        return Array.from({length: n + 1}, (_, i) => {const t = (dur * i) / n; return {t: round(t), ...at(t)};});
      }
      default: return [{t: 0, ...at(0)}];
    }
  })();
  return {keys, shake, ease: move === 'track' ? 'linear' : 'inOut'};
}

export function storyboardToSpec(input: StoryboardInput, assets: Assets): AdaptResult {
  const expanded = expandChoreography(Storyboard.parse(input));
  const board = autoFoley(expanded.board);
  const warnings: string[] = [];
  const fps = board.brief.fps;
  const base = board.shots.map((s) => shotBaseDuration(s, assets.narration[s.id]));
  const overlaps = board.shots.map((s, i) => (i > 0 && s.transition !== 'cut' ? s.transitionDuration : 0));
  let scale = 1;
  if (board.brief.targetDuration) {
    const sumBase = base.reduce((a, b) => a + b, 0);
    const sumOverlap = overlaps.reduce((a, b) => a + b, 0);
    scale = (board.brief.targetDuration + sumOverlap) / sumBase;
    if (scale < 0.85 || scale > 1.3) warnings.push(`retiming factor ${scale.toFixed(2)} is large; consider adjusting shots or narration to fit ${board.brief.targetDuration}s`);
  }
  // durations in whole frames; the last shot absorbs rounding so the total is exact
  const frames = base.map((b) => Math.round(b * scale * fps));
  if (board.brief.targetDuration) {
    const want = Math.round(board.brief.targetDuration * fps);
    const have = frames.reduce((a, b) => a + b, 0) - overlaps.reduce((a, o) => a + Math.round(o * fps), 0);
    frames[frames.length - 1] += want - have;
  }

  const shotList: string[] = [];
  const scenes: z.input<typeof SceneSchema>[] = board.shots.map((shot, i) => {
    const dur = frames[i] / fps;
    const narr = assets.narration[shot.id];
    const usable = dur - 0.15 - (overlaps[i + 1] ?? 0);
    if (narr && shot.narration && 0.25 + narr.duration > usable) warnings.push(`shot ${shot.id}: narration (${narr.duration.toFixed(2)}s from 0.25s) runs past the usable shot length (${usable.toFixed(2)}s before next transition)`);
    const characters = buildCharacters(shot, scale, warnings);
    let camera: z.input<typeof SceneSchema>['camera'];
    if (shot.camera.coverage === 'auto' && characters.length) {
      const opening = i === 0 || board.shots[i - 1].environment !== shot.environment ? 'establishing' : 'wide';
      const auto = buildAutoCamera(shot, characters, dur, scale, opening);
      camera = auto.camera;
      shotList.push(`${shot.id}:`, ...auto.shotList.map((l) => `   ${l}`));
    } else {
      camera = buildCamera(shot, characters, dur);
      camera.impacts = detectEvents(shot, scale).filter((e) => e.kind === 'impact').map((e) => ({t: round(e.t), strength: 1}));
      shotList.push(`${shot.id}: ${shot.camera.shot} ${shot.camera.move}`);
    }
    camera.impacts = [...(camera.impacts ?? []), ...shot.cameraImpacts.map((c) => ({t: round(c.at * scale), strength: c.strength}))];
    return {
      ui: shot.ui.map((u) => ({...u, at: round(u.at * scale), until: u.until !== undefined ? round(u.until * scale) : undefined})),
      vfx: shot.vfx.map((v) => ({...v, at: round(v.at * scale), duration: v.duration !== undefined ? v.duration * scale : undefined})),
      look: shot.look, characterMode: shot.characterMode,
      id: shot.id, duration: dur,
      environment: {preset: shot.environment, palette: shot.palette, timeOfDay: shot.timeOfDay, ambient: shot.ambient},
      characters,
      props: shot.props.map((p) => ({kind: p.kind, position: p.at, rotation: p.rotation, scale: p.scale, color: p.color, appearAt: p.appearAt !== undefined ? p.appearAt * scale : undefined, disappearAt: p.disappearAt !== undefined ? p.disappearAt * scale : undefined, move: p.move ? {...p.move, start: p.move.start * scale, end: p.move.end * scale} : undefined, inflate: p.inflate ? {...p.inflate, start: p.inflate.start * scale, end: p.inflate.end * scale} : undefined})),
      camera,
      text: shot.text.map((x) => ({text: x.text, start: round(x.at * scale), end: round(Math.min(dur, (x.until ?? x.at + 2.5) * scale)), style: x.style, position: x.position})),
      narration: shot.narration ? {text: shot.narration, start: 0.25, audio: narr?.audio, duration: narr?.duration} : undefined,
      sfx: shot.sfx.flatMap((s) => {const f = assets.sfx[s.sound]; if (!f) {warnings.push(`shot ${shot.id}: sound "${s.sound}" not resolved, skipped`); return [];} return [{file: f, at: round(s.at * scale), volume: s.volume, important: s.important}];}),
      ambience: shot.ambience && shot.ambience !== 'none' && assets.sfx[shot.ambience] ? {file: assets.sfx[shot.ambience], volume: shot.ambienceVolume} : undefined,
      transitionIn: {type: i === 0 ? 'cut' : shot.transition, duration: i === 0 ? 0 : shot.transitionDuration},
    };
  });

  const cast = board.cast.filter((c) => typeof c !== 'string') as VideoSpec['cast'];
  const spec = VideoSpec.parse({
    id: board.id, title: board.title,
    meta: {category: board.brief.category, language: board.brief.language, tone: board.brief.tone},
    format: {aspect: board.brief.aspect, quality: board.brief.quality, fps},
    style: {lineWidth: board.style.lineWidth, characterMode: board.style.characterMode, ...(board.style.font ? {font: board.style.font} : {})},
    cast, captions: board.captions,
    music: assets.music ? {file: assets.music, volume: board.music?.volume ?? 0.12} : undefined,
    scenes,
  });
  if (board.brief.targetDuration && totalFrames(spec) !== Math.round(board.brief.targetDuration * fps)) warnings.push('total frame count does not match target');
  warnings.push(...expanded.report.warnings);
  return {spec, warnings, shotList, choreo: expanded.report};
}
