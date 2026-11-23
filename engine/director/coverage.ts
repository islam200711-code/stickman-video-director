/**
 * Automatic shot composition ("coverage") driven by storyboard events.
 *
 * Reads the beats of one storyboard shot and edits it the way a director would:
 *   open wide (establish) -> dialogue on over-the-shoulder / medium singles ->
 *   strong emotion cuts to a close-up of the reactor -> emphasis gets an extreme
 *   close-up push -> impacts go wide with a shake burst -> reveals pull out.
 * Rules: minimum hold per shot, 180-degree rule (camera stays on one side of the
 * action axis), eye-line-matched singles, rule-of-thirds head room, and a slow
 * drift inside every shot so the camera never feels frozen.
 * Pure + deterministic: same storyboard => same cuts.
 */
import type {Scene, SceneCharacter, Vec3} from '../schema/scene';
import {evaluateCharacter} from '../animations/library';
import {headWorld} from '../animations/head';
import type {Shot} from './storyboard';

export type ShotType = 'establishing' | 'wide' | 'two-shot' | 'medium' | 'close' | 'extreme-close' | 'over-shoulder';
type Event = {t: number; kind: 'dialogue' | 'reaction' | 'emphasis' | 'impact' | 'reveal' | 'enter' | 'action'; who?: string; with?: string; priority: number};
export type PlannedShot = {t: number; type: ShotType; subject: string[]; from?: string; label: string};

const MIN_HOLD = 1.25;
const FOV: Record<ShotType, number> = {establishing: 42, wide: 40, 'two-shot': 36, medium: 34, close: 28, 'extreme-close': 24, 'over-shoulder': 32};
const STRONG = new Set(['surprised', 'scared', 'angry', 'excited', 'sad']);
/** beats produced by the action director: framed by the 'action' event, never cut to a reaction close-up mid-move */
const CHOREO = new Set(['guard', 'punch', 'kick', 'block', 'dodge', 'grab', 'throw', 'pull', 'push', 'hit', 'stagger', 'knockdown', 'thrown', 'handshake', 'highfive', 'give', 'receive', 'rescue', 'rescued', 'huddle']);
const PRIORITY = {impact: 5, emphasis: 4, action: 4, reaction: 3, reveal: 3, dialogue: 2, enter: 1} as const;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

export function detectEvents(shot: Shot, scale: number): Event[] {
  const ev: Event[] = [];
  for (const b of shot.beats) {
    const t = b.at * scale;
    if (b.event) ev.push({t, kind: b.event, who: b.who, with: b.with, priority: PRIORITY[b.event]});
    else if (b.do === 'talk' || b.do === 'argue') ev.push({t, kind: 'dialogue', who: b.who, priority: PRIORITY.dialogue});
    else if (b.expression && STRONG.has(b.expression) && !CHOREO.has(b.do)) ev.push({t, kind: 'reaction', who: b.who, priority: PRIORITY.reaction});
    else if ((b.do === 'walk' || b.do === 'run' || b.do === 'escape') && b.to) ev.push({t, kind: 'enter', who: b.who, priority: PRIORITY.enter});
  }
  for (const c of shot.cameraImpacts ?? []) if (c.strength >= 1.2) ev.push({t: c.at * scale, kind: 'impact', priority: PRIORITY.impact});
  for (const p of shot.props) {
    if (p.move?.weight === 'heavy') ev.push({t: p.move.start * scale, kind: 'impact', priority: PRIORITY.impact});
    if (p.move?.weight === 'drop') ev.push({t: p.move.end * scale, kind: 'impact', priority: PRIORITY.impact});
  }
  return ev.sort((a, b) => a.t - b.t || b.priority - a.priority);
}

/** Choose which event wins inside each MIN_HOLD window and turn events into planned shots. */
export function planShots(shot: Shot, chars: SceneCharacter[], dur: number, scale: number, opening: 'establishing' | 'wide'): {plan: PlannedShot[]; impacts: {t: number; strength: number}[]} {
  const ids = chars.map((c) => c.id);
  const events = detectEvents(shot, scale).filter((e) => e.t < dur - 0.6);
  const impacts = events.filter((e) => e.kind === 'impact').map((e) => ({t: r3(e.t), strength: 1}));
  const plan: PlannedShot[] = [{t: 0, type: ids.length > 1 || opening === 'establishing' ? opening : 'medium', subject: ids, label: `${opening === 'establishing' ? 'EST' : 'WS'} ${ids.join('+') || 'set'}`}];
  // an action that starts before the opening could hold its minimum length opens the scene on its own framing
  const firstAction = events.find((e) => e.kind === 'action');
  if (firstAction && firstAction.t < MIN_HOLD && firstAction.who && firstAction.with) {
    plan[0] = {t: 0, type: 'two-shot', subject: [firstAction.who, firstAction.with], label: `action:2S profile ${firstAction.who}×${firstAction.with} (opening)`};
  }
  let lastSpeaker: string | undefined;
  for (const e of events) {
    const prev = plan[plan.length - 1];
    if (e.t - prev.t < MIN_HOLD) {
      // a stronger event may replace a weaker cut that hasn't had time to play
      if (plan.length > 1 && e.priority > PRIORITY[(prev.label.split(':')[0] as keyof typeof PRIORITY)] && e.t - plan[plan.length - 2].t >= MIN_HOLD) plan.pop();
      else continue;
    }
    const who = e.who && ids.includes(e.who) ? e.who : undefined;
    const others = ids.filter((i) => i !== who);
    let p: PlannedShot;
    switch (e.kind) {
      case 'dialogue':
        if (who && others.length === 1 && lastSpeaker && lastSpeaker !== who) p = {t: e.t, type: 'over-shoulder', subject: [who], from: others[0], label: `dialogue:OTS ${others[0]}→${who}`};
        else if (who) p = {t: e.t, type: others.length ? 'two-shot' : 'medium', subject: others.length ? ids : [who], label: `dialogue:${others.length ? '2S' : 'MS'} ${who}`};
        else continue;
        lastSpeaker = who;
        break;
      case 'reaction': if (!who) continue; p = {t: e.t, type: 'close', subject: [who], label: `reaction:CU ${who}`}; break;
      case 'emphasis': if (!who) continue; p = {t: e.t, type: 'extreme-close', subject: [who], label: `emphasis:ECU ${who}`}; break;
      case 'impact': p = {t: Math.max(0, e.t - 0.1), type: 'wide', subject: ids, label: 'impact:WS all'}; break;
      case 'reveal': p = {t: e.t, type: 'medium', subject: who ? [who] : ids, label: `reveal:MS→WS ${who ?? 'all'}`}; break;
      case 'enter': p = {t: e.t, type: 'wide', subject: who ? [who] : ids, label: `enter:WS track ${who}`}; break;
      case 'action': p = {t: Math.max(0, e.t - 0.15), type: 'two-shot', subject: who && e.with ? [who, e.with] : ids, label: `action:2S profile ${who}×${e.with ?? ''}`}; break;
    }
    if (prev.type === p.type && prev.subject.join() === p.subject.join() && prev.from === p.from) continue; // no jump cut to the same framing
    plan.push(p);
  }
  // max hold: a wide/establishing frame never sits longer than ~3.2 s — insert coverage (track a mover, else a two-shot)
  const MAX_HOLD = 3.2;
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i], next = plan[i + 1]?.t ?? dur;
    if ((p.type === 'establishing' || p.type === 'wide') && !p.label.startsWith('impact') && next - p.t > MAX_HOLD + MIN_HOLD) {
      const t = p.t + MAX_HOLD;
      if (plan.some((q) => Math.abs(q.t - t) < MIN_HOLD)) continue;
      const mover = shot.beats.find((b) => ['walk', 'run', 'escape'].includes(b.do) && b.to && b.at * scale <= t && (b.until ?? Infinity) * scale > t + 0.8);
      plan.splice(i + 1, 0, mover ? {t, type: 'wide', subject: [mover.who], label: `enter:WS track ${mover.who} (max hold)`} : {t, type: 'two-shot', subject: ids, label: 'cover:2S all (max hold)'});
    }
  }
  // text needs room: a close/ECU that would play under a title is widened to a medium/two-shot
  const titles = shot.text.filter((x) => x.style === 'title').map((x) => [x.at * scale, (x.until ?? x.at + 2.5) * scale]);
  plan.forEach((p, i) => {
    const end = plan[i + 1]?.t ?? dur;
    if ((p.type === 'close' || p.type === 'extreme-close') && titles.some(([a, b]) => p.t < b && end > a)) {
      p.type = 'wide'; p.subject = ids; p.label += ' (widened: title on screen)';
    }
  });
  return {plan, impacts};
}

/** Frame one planned shot: returns start/end camera states (end = slow drift). */
function frameShot(p: PlannedShot, chars: SceneCharacter[], t0: number, t1: number, dur: number, frontYaw: number) {
  const pos = (id: string, t: number) => {const c = chars.find((x) => x.id === id)!; return evaluateCharacter(c, t, dur).position;};
  // average the head over the shot so a hop or lean doesn't throw the framing
  const head = (id: string): Vec3 => {const c = chars.find((x) => x.id === id)!; if (p.type === 'extreme-close') return headWorld(c, t1, dur); const n = 5; const acc = [0, 0, 0]; for (let i = 0; i < n; i++) {const h = headWorld(c, t0 + ((t1 - t0) * i) / (n - 1), dur); acc[0] += h[0] / n; acc[1] += h[1] / n; acc[2] += h[2] / n;} return acc as Vec3;};
  const centroid = (t: number): Vec3 => {
    const pts = p.subject.map((id) => pos(id, t));
    return [pts.reduce((a, q) => a + q[0], 0) / pts.length, 0, pts.reduce((a, q) => a + q[2], 0) / pts.length];
  };
  const spread = (t: number) => {const xs = p.subject.map((id) => pos(id, t)[0]); return Math.max(...xs) - Math.min(...xs);};
  const front = (yaw: number, d: number, f: Vec3, y: number): Vec3 => [r3(f[0] + Math.sin(yaw) * d), y, r3(f[2] + Math.cos(yaw) * d)];
  const fov = FOV[p.type];
  const mk = (t: number, drift: number) => {
    const f = centroid(t);
    switch (p.type) {
      case 'over-shoulder': {
        const a = pos(p.from!, t), b = pos(p.subject[0], t);
        const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1;
        // perpendicular on the camera's side of the action line (180-degree rule)
        let px = -dz / L, pz = dx / L;
        if (px * Math.sin(frontYaw) + pz * Math.cos(frontYaw) < 0) {px = -px; pz = -pz;}
        const back = 1.7 - drift * 0.25, hb = head(p.subject[0]);
        return {position: [r3(a[0] - (dx / L) * back + px * 0.75), 1.82, r3(a[2] - (dz / L) * back + pz * 0.75)] as Vec3, lookAt: [r3(hb[0]), r3(hb[1] - 0.12), r3(hb[2])] as Vec3, fov};
      }
      case 'close': case 'extreme-close': {
        // eye-line match: rotate the single toward the partner the subject is facing
        const others = chars.filter((c) => !p.subject.includes(c.id));
        // see the face: orbit toward where the subject faces (3/4 view), then a little toward the partner (eye-line)
        const subj = chars.find((c) => c.id === p.subject[0])!;
        const faceYaw = (evaluateCharacter(subj, t, dur).facing * Math.PI) / 180;
        const dYaw = Math.atan2(Math.sin(faceYaw - frontYaw), Math.cos(faceYaw - frontYaw));
        let yaw = frontYaw + Math.max(-1.0, Math.min(1.0, dYaw * 0.6));
        if (others.length) {const o = pos(others[0].id, t); yaw += Math.sign((o[0] - f[0]) * Math.cos(frontYaw) - (o[2] - f[2]) * Math.sin(frontYaw)) * 0.12;}
        const d = (p.type === 'close' ? 2.4 : 1.5) - drift * (p.type === 'close' ? 0.3 : 0.25);
        // rule of thirds + lead room: subject on the third away from their partner/gaze
        let side = 0;
        if (others.length) {const o = pos(others[0].id, t); side = Math.sign((o[0] - f[0]) * Math.cos(frontYaw) - (o[2] - f[2]) * Math.sin(frontYaw)) || 1;}
        const shift = d * Math.tan(((fov / 2) * Math.PI) / 180) * (16 / 9) * 0.22 * (side || 1);
        const rx = Math.cos(yaw), rz = -Math.sin(yaw); // camera right vector
        const hd = head(p.subject[0]);
        const lookY = hd[1] - (p.type === 'close' ? 0.2 : 0.06); // eyes on the upper third
        return {position: front(yaw, d, [hd[0], 0, hd[2]], hd[1] + 0.05), lookAt: [r3(hd[0] + rx * shift), r3(lookY), r3(hd[2] + rz * shift)] as Vec3, fov};
      }
      case 'medium': return {position: front(frontYaw, 4.2 - drift * 0.5, f, 1.55), lookAt: [r3(f[0]), 1.32, r3(f[2])] as Vec3, fov};
      case 'two-shot': return {position: front(frontYaw, Math.max(5.2, spread(t) * 1.6 + 3.6) - drift * 0.4, f, 1.55), lookAt: [r3(f[0]), 1.22, r3(f[2])] as Vec3, fov};
      case 'establishing': return {position: front(frontYaw, 14 - drift * 1.5, f, 3.2 - drift * 0.6), lookAt: [r3(f[0]), 1.3, r3(f[2])] as Vec3, fov};
      default: return {position: front(frontYaw, Math.max(8.5, spread(t) * 1.4 + 6) - drift * 0.6, f, 1.85), lookAt: [r3(f[0]), 1.1, r3(f[2])] as Vec3, fov};
    }
  };
  if (p.label.startsWith('action') && p.subject.length === 2) {
    const a = pos(p.subject[0], t0), c = pos(p.subject[1], t0);
    const dx = c[0] - a[0], dz = c[2] - a[2], L = Math.hypot(dx, dz) || 1;
    let px = -dz / L, pz = dx / L;
    if (px * Math.sin(frontYaw) + pz * Math.cos(frontYaw) < 0) {px = -px; pz = -pz;}
    const yaw = Math.atan2(px, pz);
    const mk2 = (drift: number) => {const f = centroid(t0); const d = Math.max(3.6, L * 1.6 + 2.4) - drift * 0.35;
      return {position: front(yaw, d, f, 1.45), lookAt: [r3(f[0]), 1.15, r3(f[2])] as Vec3, fov: FOV['two-shot']};};
    return [{t: t0, ...mk2(0)}, {t: t1, ...mk2(1)}];
  }
  const isTrack = p.label.startsWith('enter');
  const isReveal = p.label.startsWith('reveal');
  if (isReveal) return [{t: t0, ...mk(t0, 0)}, {t: t1, ...{...mk(t1, 0), position: (() => {const m = mk(t1, 0).position, f = centroid(t1); return [r3(f[0] + (m[0] - f[0]) * 2.1), 2.4, r3(f[2] + (m[2] - f[2]) * 2.1)] as Vec3;})()}}];
  if (isTrack) {const n = Math.max(1, Math.ceil(t1 - t0)); return Array.from({length: n + 1}, (_, i) => {const t = t0 + ((t1 - t0) * i) / n; return {t, ...mk(t, 0)};});}
  return [{t: t0, ...mk(t0, 0)}, {t: t1, ...mk(t0, 1)}];
}

export function buildAutoCamera(shot: Shot, chars: SceneCharacter[], dur: number, scale: number, opening: 'establishing' | 'wide'): {camera: Scene['camera']; shotList: string[]} {
  const {plan, impacts} = planShots(shot, chars, dur, scale, opening);
  const frontYaw = (shot.camera.angle * Math.PI) / 180;
  const keys: Scene['camera']['keys'] = [];
  plan.forEach((p, i) => {
    const t0 = p.t, t1 = i + 1 < plan.length ? plan[i + 1].t - 0.001 : dur;
    frameShot(p, chars, t0, t1, dur, frontYaw).forEach((k, j) => keys.push({t: r3(k.t), position: k.position, lookAt: k.lookAt, fov: k.fov, cut: j === 0 && i > 0, label: p.label}));
  });
  return {camera: {keys, shake: shot.camera.shake, impacts, ease: 'linear'}, shotList: plan.map((p) => `${p.t.toFixed(2)}s ${p.label}`)};
}
