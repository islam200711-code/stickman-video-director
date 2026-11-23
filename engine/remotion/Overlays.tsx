/**
 * 2D overlays drawn by Remotion over the 3D stage: titles, labels and narration
 * captions. Every block is placed by the safe-zone planner (safezones.ts) so it
 * never covers characters' heads/bodies or moving action; placement is decided
 * once per block (stable while it is on screen).
 */
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene, VideoSpec} from '../schema/scene';
import {placeText, type Placement} from './safezones';

type Style = VideoSpec['style'];
const fadeIO = (t: number, s: number, e: number) => interpolate(t, [s, s + 0.25, e - 0.25, e], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Splits narration into short phrases and times them proportionally to their length. */
export function captionChunks(text: string, start: number, duration: number, maxWords = 7) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= maxWords || (/[.!?,;:]$/.test(w) && cur.length >= 3)) {chunks.push(cur.join(' ')); cur = [];}
  }
  if (cur.length) chunks.push(cur.join(' '));
  const total = chunks.reduce((a, c) => a + c.length, 0) || 1;
  let t = start;
  return chunks.map((c) => {const d = (c.length / total) * duration; const r = {text: c, start: t, end: t + d}; t += d; return r;});
}

export function planOverlays(scene: Scene, w: number, h: number, fps: number) {
  const texts = scene.text.map((x) => placeText(scene, x.text, x.style, x.position, x.start, x.end, w, h, fps));
  let caption: {chunks: ReturnType<typeof captionChunks>; placements: Placement[]} | undefined;
  const n = scene.narration;
  if (n) {
    const dur = n.duration ?? Math.max(1, n.text.split(/\s+/).length / 2.6);
    // subtitle rule: never let one caption line straddle a camera cut — split it at the cut
    const cuts = scene.camera.keys.filter((k) => k.cut).map((k) => k.t);
    const chunks = captionChunks(n.text, n.start, dur).flatMap((c0) => {
      let c = c0;
      // a cut just after a line starts delays it to the cut; a cut just before it ends closes it on the cut
      const late = cuts.find((x) => x > c.start && x <= c.start + 0.45);
      if (late !== undefined) c = {...c, start: late};
      const early = cuts.find((x) => x >= c.end - 0.45 && x < c.end);
      if (early !== undefined) c = {...c, end: early};
      const cut = cuts.find((x) => x > c.start + 0.45 && x < c.end - 0.45);
      const words = c.text.split(' ');
      if (cut === undefined || words.length < 4) return [c];
      const k = Math.max(1, Math.min(words.length - 1, Math.round(words.length * ((cut - c.start) / (c.end - c.start)))));
      return [{text: words.slice(0, k).join(' '), start: c.start, end: cut}, {text: words.slice(k).join(' '), start: cut, end: c.end}];
    });
    // one placement per phrase: stable while each line is read, free to move between lines when the shot changes
    caption = {chunks, placements: chunks.map((c) => placeText(scene, c.text, 'caption', 'auto', c.start, c.end, w, h, fps))};
  }
  return {texts, caption};
}

const Block: React.FC<{p: Placement; children: React.ReactNode; style: React.CSSProperties; opacity: number; scale?: number}> = ({p, children, style, opacity, scale = 1}) => (
  <div style={{position: 'absolute', left: p.box.x0, top: p.box.y0, width: p.box.x1 - p.box.x0, display: 'flex', justifyContent: 'center', opacity, transform: `scale(${scale})`, transformOrigin: 'center'}}>
    <div style={{...style, textAlign: 'center', boxSizing: 'border-box', maxWidth: '100%'}}>{children}</div>
  </div>
);

export const SceneOverlays: React.FC<{scene: Scene; style: Style; captions: boolean}> = ({scene, style, captions}) => {
  const {fps, width, height} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const u = height / 720;
  const plan = useMemo(() => planOverlays(scene, width, height, fps), [scene, width, height, fps]);
  const ci = captions && plan.caption ? plan.caption.chunks.findIndex((c) => t >= c.start && t < c.end) : -1;
  const cur = ci >= 0 ? plan.caption!.chunks[ci] : undefined;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', fontFamily: style.font}}>
      {scene.text.map((x, i) => {
        if (t < x.start || t > x.end) return null;
        const big = x.style === 'title';
        return (
          <Block key={i} p={plan.texts[i]} opacity={fadeIO(t, x.start, x.end)} scale={interpolate(t, [x.start, x.start + 0.3], [0.9, 1], {extrapolateRight: 'clamp'})}
            style={{fontSize: (big ? 64 : 34) * u, fontWeight: 800, color: big ? '#ffffff' : '#111', background: big ? 'rgba(17,17,17,0.78)' : 'rgba(255,255,255,0.9)', padding: `${(big ? 10 : 8) * u}px ${(big ? 24 : 20) * u}px`, borderRadius: 14 * u, letterSpacing: big ? 1 : 0, boxShadow: '0 6px 18px rgba(0,0,0,0.25)'}}>
            {x.text}
          </Block>
        );
      })}
      {cur && plan.caption && (
        <Block p={plan.caption.placements[ci]} opacity={1}
          style={{fontSize: 34 * u, fontWeight: 700, color: style.captionColor, background: style.captionBg, padding: `${8 * u}px ${20 * u}px`, borderRadius: 10 * u}}>
          {cur.text}
        </Block>
      )}
    </AbsoluteFill>
  );
};
