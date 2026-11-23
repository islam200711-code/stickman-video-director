/**
 * Action director: expands storyboard `actions` (who does what to whom) into a
 * readable, physically-aligned performance.
 *
 * For every interaction it decides
 *   - initiator & reactor, facing (they look at each other), distance (auto-approach),
 *   - phase timing (anticipation → contact → follow-through → recover; ACTION_TIMING),
 *   - the contact/impact point in world space (IK targets, incl. character-to-character),
 *   - the reaction (hit / block / dodge / stagger / knockdown / thrown / rescued ...),
 *   - VFX, SFX and camera-impact cues synchronised to the contact frame,
 *   - a coverage `action` event so the camera stages it in profile.
 * It validates every interaction (missing characters, impossible distance, overlapping
 * performances for one character) and reports errors/warnings.
 *
 * Pure and deterministic. Runs on storyboard time (before the adapter's retiming), so
 * every cue it emits is retimed consistently with the rest of the shot.
 */
import {ACTION_TIMING, evaluateCharacter, PROPORTIONS} from '../animations/library';
import type {Action, SceneCharacter, Vec3} from '../schema/scene';
import type {ActionEvent, Shot} from '../director/storyboard';

type Beat = Shot['beats'][number];
type Sfx = Shot['sfx'][number];
type Vfx = Shot['vfx'][number];
export type ChoreoReport = {errors: string[]; warnings: string[]; log: string[]};

/** Valid spacing (metres between roots) per interaction: [min, ideal, max]. */
export const SPACING: Record<ActionEvent['type'], [number, number, number]> = {
  punch: [0.7, 0.92, 1.1], kick: [0.85, 1.05, 1.3], block: [0, 0, 99], dodge: [0, 0, 99], grab: [0.45, 0.6, 0.85],
  throw: [0.45, 0.6, 0.85], push: [0.5, 0.65, 0.9], pull: [0.6, 0.85, 1.1], rescue: [0.55, 0.75, 1.0],
  handshake: [0.7, 0.9, 1.15], highfive: [0.7, 0.9, 1.2], transfer: [0.65, 0.85, 1.1], huddle: [0, 0, 99],
};
/** How long each interaction keeps its participants busy (storyboard seconds). */
const BUSY: Record<ActionEvent['type'], number> = {
  punch: 0.9, kick: 1.0, block: 0.8, dodge: 0.9, grab: 0.9, throw: 1.9, push: 0.9, pull: 1.3, rescue: 1.8,
  handshake: 1.5, highfive: 0.9, transfer: 1.3, huddle: 2.0,
};
const HEAD_Y = PROPORTIONS.hip + PROPORTIONS.torso + PROPORTIONS.neck + PROPORTIONS.head;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const yawTo = (a: Vec3, b: Vec3) => r3((Math.atan2(b[0] - a[0], b[2] - a[2]) * 180) / Math.PI);
const lerp3 = (a: Vec3, b: Vec3, k: number, y?: number): Vec3 => [r3(a[0] + (b[0] - a[0]) * k), y ?? r3(a[1] + (b[1] - a[1]) * k), r3(a[2] + (b[2] - a[2]) * k)];

function trackOf(shot: Shot, id: string, extra: Beat[]): SceneCharacter {
  const block = shot.blocking[id] ?? {at: [0, 0, 0] as Vec3, facing: 0, expression: 'neutral' as const};
  const beats = [...shot.beats, ...extra].filter((b) => b.who === id).sort((a, b) => a.at - b.at);
  const track = beats.map((b) => ({action: b.do, start: b.at, end: b.until, speed: b.speed ?? 1, intensity: b.intensity ?? 1, facing: b.facing, to: b.to, expression: b.expression}));
  if (!track.length || track[0].start > 0) track.unshift({action: 'idle', start: 0, end: undefined, speed: 1, intensity: 1, facing: undefined, to: undefined, expression: undefined});
  return {id, position: block.at, facing: block.facing, expression: block.expression, track} as SceneCharacter;
}
const posAt = (shot: Shot, id: string, t: number, extra: Beat[], dur = 60) => evaluateCharacter(trackOf(shot, id, extra), t, dur).position;

/** Expand one shot's `actions` into beats / sfx / vfx / camera impacts. Returns a new shot (actions emptied). */
export function choreograph(shot: Shot, report: ChoreoReport = {errors: [], warnings: [], log: []}): {shot: Shot; report: ChoreoReport} {
  if (!shot.actions.length) return {shot, report};
  const beats: Beat[] = [], sfx: Sfx[] = [], vfx: Vfx[] = [], impacts: {at: number; strength: number}[] = [];
  const busy: Record<string, [number, number, string][]> = {};
  const known = new Set([...Object.keys(shot.blocking), ...shot.beats.map((b) => b.who)]);
  const B = (b: Omit<Beat, 'at'> & {at: number}) => beats.push(b as Beat);
  const claim = (id: string, a: number, b: number, what: string) => {
    for (const [s, e, w] of busy[id] ?? []) if (a < e - 1e-6 && b > s + 1e-6) report.errors.push(`${shot.id}: ${id} is double-booked: "${what}" (${a.toFixed(2)}–${b.toFixed(2)}s) overlaps "${w}" (${s.toFixed(2)}–${e.toFixed(2)}s)`);
    (busy[id] ??= []).push([a, b, what]);
  };

  for (const ev of [...shot.actions].sort((a, b) => a.at - b.at)) {
    const tag = `${ev.type}@${ev.at}s ${ev.actor}${ev.target ? '→' + ev.target : ''}`;
    for (const id of [ev.actor, ev.target, ...(ev.group ?? [])].filter(Boolean) as string[]) if (!known.has(id)) report.errors.push(`${shot.id}: ${tag}: unknown character "${id}" (add blocking)`);
    if (report.errors.length && report.errors.some((e) => e.includes(tag))) continue;
    const needsTarget = !['block', 'dodge', 'huddle'].includes(ev.type);
    if (needsTarget && !ev.target) {report.errors.push(`${shot.id}: ${tag}: needs a target`); continue;}

    // ---------- spacing & facing ----------
    let at = ev.at;
    let A = posAt(shot, ev.actor, at, beats);
    const T = ev.target ? posAt(shot, ev.target, at, beats) : A;
    const [mn, ideal, mx] = SPACING[ev.type];
    let dist = Math.hypot(T[0] - A[0], T[2] - A[2]);
    if (ev.target && (dist < mn || dist > mx)) {
      if (ev.autoApproach && dist > mx) {
        const k = (dist - ideal) / dist; const goal = lerp3(A, T, k, 0);
        const walkT = Math.min(1.2, Math.max(0.45, (dist - ideal) / 1.4));
        B({who: ev.actor, do: dist - ideal > 1.6 ? 'run' : 'walk', at: Math.max(0, at - walkT), until: at, to: goal});
        report.warnings.push(`${shot.id}: ${tag}: distance ${dist.toFixed(2)}m > ${mx}m — auto-approach inserted (${walkT.toFixed(2)}s)`);
        A = goal; dist = ideal;
      } else report.errors.push(`${shot.id}: ${tag}: distance ${dist.toFixed(2)}m outside valid ${mn}–${mx}m`);
    }
    const faceAT = ev.target ? yawTo(A, T) : undefined, faceTA = ev.target ? yawTo(T, A) : undefined;
    const tm = (ACTION_TIMING as Record<string, {anticipation: number; contact: number; followThrough: number; recover: number}>)[ev.type === 'transfer' ? 'give' : ev.type];
    const tc = r3(at + (tm?.contact ?? 0.3));
    if (ev.type !== 'huddle') claim(ev.actor, at, at + BUSY[ev.type], tag);
    if (ev.target) claim(ev.target, Math.max(0, tc - 0.35), at + BUSY[ev.type], tag);
    const head: Vec3 = ev.target ? [T[0], HEAD_Y - 0.15, T[2]] : A;
    const chest: Vec3 = ev.target ? [T[0], 1.25, T[2]] : A;
    const hitPt: Vec3 = ev.aim === 'body' ? chest : head;
    // contact point sits on the near surface of the target (not its centre)
    const surface = (p: Vec3, back = 0.16): Vec3 => {const d = Math.hypot(T[0] - A[0], T[2] - A[2]) || 1; return [r3(p[0] - ((T[0] - A[0]) / d) * back), p[1], r3(p[2] - ((T[2] - A[2]) / d) * back)];};
    const recoverIdle = (id: string, t: number, facing?: number) => B({who: id, do: 'idle', at: r3(t), facing});
    const cameraAction = () => B({who: ev.actor, do: 'idle', at: Math.max(0, at - 0.01), until: at, event: 'action', with: ev.target} as Beat);
    const away = (p: Vec3, from: Vec3, d: number): Vec3 => {const L = Math.hypot(p[0] - from[0], p[2] - from[2]) || 1; return [r3(p[0] + ((p[0] - from[0]) / L) * d), 0, r3(p[2] + ((p[2] - from[2]) / L) * d)];};

    switch (ev.type) {
      case 'punch': case 'kick': {
        cameraAction();
        const kick = ev.type === 'kick';
        const contact = surface(kick ? chest : hitPt, kick ? 0.12 : 0.16);
        B({who: ev.actor, do: ev.type, at, until: r3(at + tm.recover), facing: faceAT, expression: 'determined', intensity: ev.force,
          ...(kick ? {} : {reach: {right: contact}, reachAt: tm.anticipation + 0.04, reachRamp: 0.06, reachUntil: tm.followThrough})});
        recoverIdle(ev.actor, at + tm.recover, faceAT);
        if (ev.outcome === 'hit') {
          const heavy = ev.force >= 1.5;
          B({who: ev.target!, do: heavy ? 'knockdown' : 'hit', at: tc, until: r3(tc + (heavy ? 1.2 : 0.75)), facing: faceTA, expression: 'surprised', intensity: ev.force,
            to: away(T, A, (heavy ? 0.9 : 0.28) * ev.force), moveCurve: 'light'});
          if (!heavy) B({who: ev.target!, do: 'guard', at: r3(tc + 0.75), facing: faceTA, expression: 'angry'});
          vfx.push({type: 'impact-flash', at: tc, position: contact, scale: ev.force}, {type: ev.force > 1.15 ? 'ink-burst' : 'sparks', at: tc, position: contact, scale: ev.force});
          sfx.push({sound: kick ? 'impact heavy' : 'impact punch', at: tc, volume: 0.9, important: ev.force >= 1.3});
          impacts.push({at: tc, strength: 0.6 * ev.force});
          if (heavy) {const land = r3(tc + 0.5); vfx.push({type: 'dust', at: land, position: away(T, A, 0.9 * ev.force), scale: 1.2}, {type: 'shockwave', at: land, position: away(T, A, 0.9 * ev.force), scale: 1}); sfx.push({sound: 'impact wood heavy', at: land, volume: 0.8}); impacts.push({at: land, strength: 0.8});}
        } else if (ev.outcome === 'blocked') {
          B({who: ev.target!, do: 'block', at: r3(tc - ACTION_TIMING.block.contact), until: r3(tc + 0.55), facing: faceTA, expression: 'determined', intensity: ev.force});
          B({who: ev.target!, do: 'guard', at: r3(tc + 0.55), facing: faceTA});
          vfx.push({type: 'sparks', at: tc, position: surface(head, 0.3), scale: 0.8 * ev.force});
          sfx.push({sound: 'impact wood', at: tc, volume: 0.8}); impacts.push({at: tc, strength: 0.3 * ev.force});
        } else {
          B({who: ev.target!, do: 'dodge', at: r3(tc - ACTION_TIMING.dodge.contact), until: r3(tc + 0.65), facing: faceTA, expression: 'surprised', intensity: ev.force});
          B({who: ev.target!, do: 'guard', at: r3(tc + 0.65), facing: faceTA});
          vfx.push({type: 'motion-trail', at: r3(tc - 0.12), actor: ev.target, duration: 0.3, scale: 1});
          sfx.push({sound: 'whoosh swish', at: r3(tc - 0.05), volume: 0.8});
        }
        sfx.push({sound: 'whoosh swish', at: r3(at + tm.anticipation), volume: 0.45});
        vfx.push({type: 'motion-trail', at: r3(at + tm.anticipation), actor: ev.actor, duration: 0.15, scale: 0.8});
        break;
      }
      case 'block': case 'dodge':
        B({who: ev.actor, do: ev.type, at, until: r3(at + tm.recover), expression: 'determined', intensity: ev.force}); recoverIdle(ev.actor, at + tm.recover); break;
      case 'grab': case 'throw': {
        cameraAction();
        const shoulderL: Vec3 = [T[0], 1.4, T[2]];
        const g = ACTION_TIMING.grab;
        B({who: ev.actor, do: 'grab', at, until: r3(at + g.followThrough), facing: faceAT, expression: 'determined', reach: {left: surface(shoulderL, 0.12), right: surface([T[0], 1.3, T[2]], 0.12)}, reachAt: g.anticipation, reachRamp: 0.15});
        B({who: ev.target!, do: 'stagger', at: r3(at + g.contact), until: r3(at + g.followThrough), facing: faceTA, expression: 'scared'});
        sfx.push({sound: 'cloth', at: r3(at + g.contact), volume: 0.6});
        if (ev.type === 'grab') {recoverIdle(ev.actor, at + g.followThrough + 0.3, faceAT); break;}
        const t0 = r3(at + g.followThrough), th = ACTION_TIMING.throw, release = r3(t0 + th.contact);
        B({who: ev.actor, do: 'throw', at: t0, until: r3(t0 + th.recover), facing: faceAT, expression: 'angry', intensity: ev.force, reach: {left: surface(shoulderL, 0.12), right: surface([T[0], 1.3, T[2]], 0.12)}, reachUntil: th.contact, reachRamp: 0.05});
        const landPt = away(T, A, 1.9 * ev.force);
        B({who: ev.target!, do: 'thrown', at: release, until: r3(release + 1.0), facing: faceTA, expression: 'scared', intensity: ev.force, to: landPt, moveCurve: 'light'});
        const land = r3(release + 0.7);
        vfx.push({type: 'motion-trail', at: release, actor: ev.target, duration: 0.6, scale: 1.2}, {type: 'dust', at: land, position: landPt, scale: 1.4}, {type: 'shockwave', at: land, position: landPt, scale: 1.1});
        sfx.push({sound: 'whoosh swish', at: release, volume: 0.8}, {sound: 'impact heavy', at: land, volume: 0.9, important: true});
        impacts.push({at: land, strength: 1.0 * ev.force});
        recoverIdle(ev.actor, t0 + th.recover, faceAT);
        break;
      }
      case 'push': case 'pull': {
        cameraAction();
        const tp = ACTION_TIMING[ev.type];
        const grip: Vec3 = surface([T[0], 1.25, T[2]], 0.12);
        B({who: ev.actor, do: ev.type, at, until: r3(at + tp.recover), facing: faceAT, expression: 'determined', intensity: ev.force,
          reach: {left: [grip[0], 1.3, grip[2]], right: [grip[0], 1.2, grip[2]]}, reachAt: tp.anticipation * 0.5, reachRamp: 0.15, reachUntil: tp.followThrough});
        const disp = ev.type === 'push' ? away(T, A, 0.75 * ev.force) : lerp3(T, A, 0.35, 0);
        B({who: ev.target!, do: 'stagger', at: tc, until: r3(at + tp.recover + 0.2), facing: faceTA, expression: 'surprised', to: disp, moveCurve: 'light'});
        vfx.push({type: 'dust', at: tc, position: [T[0], 0, T[2]], scale: 0.6});
        sfx.push({sound: ev.type === 'push' ? 'impact wood' : 'cloth', at: tc, volume: 0.6});
        recoverIdle(ev.actor, at + tp.recover, faceAT); recoverIdle(ev.target!, at + tp.recover + 0.2, faceTA);
        break;
      }
      case 'rescue': {
        cameraAction();
        const tr = ACTION_TIMING.rescue; const meet = lerp3(A, T, 0.55, 0.95);
        B({who: ev.actor, do: 'rescue', at, until: r3(at + tr.recover), facing: faceAT, expression: 'determined', reach: {right: meet}, reachAt: tr.anticipation, reachRamp: 0.3, reachUntil: tr.followThrough});
        B({who: ev.target!, do: 'rescued', at, until: r3(at + tr.recover), facing: faceTA, expression: 'worried', reach: {right: meet}, reachAt: tr.anticipation, reachRamp: 0.3, reachUntil: tr.followThrough});
        B({who: ev.target!, do: 'idle', at: r3(at + tr.recover), facing: faceTA, expression: 'happy'});
        recoverIdle(ev.actor, at + tr.recover, faceAT);
        vfx.push({type: 'sparkle', at: tc, position: meet, scale: 0.7}); sfx.push({sound: 'cloth', at: tc, volume: 0.6});
        break;
      }
      case 'handshake': case 'highfive': case 'transfer': {
        const kind: Action = ev.type === 'transfer' ? 'give' : ev.type;
        const th = ACTION_TIMING[kind as 'handshake' | 'highfive' | 'give'];
        const y = ev.type === 'highfive' ? 2.0 : ev.type === 'handshake' ? 1.0 : 1.08;
        const meet = lerp3(A, T, 0.5, y);
        const ramp = ev.type === 'highfive' ? 0.12 : 0.25;
        B({who: ev.actor, do: kind, at, until: r3(at + th.recover), facing: faceAT, expression: 'happy', reach: {right: meet}, reachAt: th.anticipation, reachRamp: ramp, reachUntil: th.followThrough, prop: ev.type === 'transfer' ? ev.object : undefined});
        B({who: ev.target!, do: ev.type === 'transfer' ? 'receive' : kind, at, until: r3(at + th.recover), facing: faceTA, expression: 'happy', reach: ev.type === 'transfer' ? {left: [meet[0], meet[1] - 0.04, meet[2]], right: meet} : {right: meet}, reachAt: th.anticipation, reachRamp: ramp, reachUntil: th.followThrough});
        recoverIdle(ev.actor, at + th.recover, faceAT);
        B({who: ev.target!, do: ev.type === 'transfer' ? 'hold' : 'idle', at: r3(at + th.recover), facing: faceTA, prop: ev.type === 'transfer' ? ev.object : undefined});
        if (ev.type === 'highfive') {vfx.push({type: 'impact-flash', at: tc, position: meet, scale: 0.6}, {type: 'sparkle', at: tc, position: meet, scale: 0.9}); sfx.push({sound: 'clap', at: tc, volume: 0.9});}
        if (ev.type === 'handshake') sfx.push({sound: 'cloth', at: tc, volume: 0.5});
        if (ev.type === 'transfer') sfx.push({sound: 'paper', at: tc, volume: 0.6});
        break;
      }
      case 'huddle': {
        const ids = ev.group ?? [ev.actor];
        const pts = ids.map((id) => posAt(shot, id, at, beats));
        const c: Vec3 = [pts.reduce((a, p) => a + p[0], 0) / pts.length, 0, pts.reduce((a, p) => a + p[2], 0) / pts.length];
        ids.forEach((id, i) => {
          const ang = (i / ids.length) * Math.PI * 2 + Math.PI / ids.length;
          const spot: Vec3 = [r3(c[0] + Math.sin(ang) * 0.5), 0, r3(c[2] + Math.cos(ang) * 0.5)];
          claim(id, Math.max(0, at - 0.8), at + BUSY.huddle, tag);
          B({who: id, do: 'walk', at: r3(Math.max(0, at - 0.8)), until: at, to: spot});
          B({who: id, do: 'huddle', at, until: r3(at + BUSY.huddle), facing: yawTo(spot, c), expression: 'excited'});
          recoverIdle(id, at + BUSY.huddle, yawTo(spot, c));
        });
        sfx.push({sound: 'applause', at: r3(at + 0.2), volume: 0.4});
        break;
      }
    }
    report.log.push(`${tag}: contact ${tc}s`);
  }
  return {shot: {...shot, actions: [], beats: [...shot.beats, ...beats], sfx: [...shot.sfx, ...sfx], vfx: [...shot.vfx, ...vfx], cameraImpacts: [...shot.cameraImpacts, ...impacts]}, report};
}
