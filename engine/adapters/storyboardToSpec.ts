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
import {Storyboard, type Shot, type StoryboardInput} from '../director/storyboard';
import {VideoSpec, type ActionCue, type Scene, type SceneCharacter, type Vec3, totalFrames} from '../schema/scene';
import {evaluateCharacter} from '../animations/library';

export type Assets = {
  narration: Record<string, {audio?: string; duration: number}>;
  sfx: Record<string, string>;          // storyboard sound query -> public path
  music?: string;
};
export type AdaptResult = {spec: VideoSpec; warnings: string[]};

const SHOT_DIST = {establishing: 12, wide: 8, 'two-shot': 5.6, medium: 4.4, close: 2.5, low: 5.8, high: 7} as const;
const LOOK_Y = {establishing: 1.2, wide: 1.1, 'two-shot': 1.2, medium: 1.3, close: 1.62, low: 1.5, high: 0.8} as const;
const CAM_Y = {establishing: 2.4, wide: 1.8, 'two-shot': 1.5, medium: 1.5, close: 1.68, low: 0.45, high: 6} as const;

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
      speed: b.speed ?? 1, intensity: b.intensity ?? 1, expression: b.expression, facing: b.facing, to: b.to, prop: b.prop,
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

function buildCamera(shot: Shot, chars: SceneCharacter[], dur: number): Scene['camera'] {
  const {shot: type, move, angle, shake} = shot.camera;
  const yaw0 = (angle * Math.PI) / 180;
  const at = (t: number, distMul = 1, yawOff = 0, yOff = 0, xOff = 0) => {
    const f = focusPoint(shot, chars, t, dur);
    const d = SHOT_DIST[type] * distMul, yaw = yaw0 + yawOff;
    const look: Vec3 = [f[0] + xOff * 0.4, LOOK_Y[type], f[2]];
    const pos: Vec3 = [round(f[0] + Math.sin(yaw) * d + xOff), round(CAM_Y[type] + yOff), round(f[2] + Math.cos(yaw) * d)];
    return {position: pos, lookAt: look.map((v) => round(v)) as Vec3, fov: type === 'establishing' ? 45 : 38};
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
  const board = Storyboard.parse(input);
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

  const scenes: Scene[] = board.shots.map((shot, i) => {
    const dur = frames[i] / fps;
    const narr = assets.narration[shot.id];
    const usable = dur - 0.15 - (overlaps[i + 1] ?? 0);
    if (narr && shot.narration && 0.25 + narr.duration > usable) warnings.push(`shot ${shot.id}: narration (${narr.duration.toFixed(2)}s from 0.25s) runs past the usable shot length (${usable.toFixed(2)}s before next transition)`);
    const characters = buildCharacters(shot, scale, warnings);
    return {
      id: shot.id, duration: dur,
      environment: {preset: shot.environment, palette: shot.palette, timeOfDay: shot.timeOfDay},
      characters,
      props: shot.props.map((p) => ({kind: p.kind, position: p.at, rotation: p.rotation, scale: p.scale, color: p.color, appearAt: p.appearAt !== undefined ? p.appearAt * scale : undefined, move: p.move ? {...p.move, start: p.move.start * scale, end: p.move.end * scale} : undefined})),
      camera: buildCamera(shot, characters, dur),
      text: shot.text.map((x) => ({text: x.text, start: round(x.at * scale), end: round(Math.min(dur, (x.until ?? x.at + 2.5) * scale)), style: x.style, position: x.position})),
      narration: shot.narration ? {text: shot.narration, start: 0.25, audio: narr?.audio, duration: narr?.duration} : undefined,
      sfx: shot.sfx.flatMap((s) => {const f = assets.sfx[s.sound]; if (!f) {warnings.push(`shot ${shot.id}: sound "${s.sound}" not resolved, skipped`); return [];} return [{file: f, at: round(s.at * scale), volume: s.volume}];}),
      transitionIn: {type: i === 0 ? 'cut' : shot.transition, duration: i === 0 ? 0 : shot.transitionDuration},
    };
  });

  const cast = board.cast.filter((c) => typeof c !== 'string') as VideoSpec['cast'];
  const spec = VideoSpec.parse({
    id: board.id, title: board.title,
    meta: {category: board.brief.category, language: board.brief.language, tone: board.brief.tone},
    format: {aspect: board.brief.aspect, quality: board.brief.quality, fps},
    style: {lineWidth: board.style.lineWidth, ...(board.style.font ? {font: board.style.font} : {})},
    cast, captions: board.captions,
    music: assets.music ? {file: assets.music, volume: board.music?.volume ?? 0.12} : undefined,
    scenes,
  });
  if (board.brief.targetDuration && totalFrames(spec) !== Math.round(board.brief.targetDuration * fps)) warnings.push('total frame count does not match target');
  return {spec, warnings};
}
