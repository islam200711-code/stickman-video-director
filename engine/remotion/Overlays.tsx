/** 2D overlays drawn by Remotion over the 3D stage: titles, labels and narration captions. */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene, VideoSpec} from '../schema/scene';

type Style = VideoSpec['style'];

const fadeIO = (t: number, s: number, e: number) => interpolate(t, [s, s + 0.25, e - 0.25, e], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const TextOverlays: React.FC<{scene: Scene; style: Style}> = ({scene, style}) => {
  const {fps, height} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const u = height / 720;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', fontFamily: style.font}}>
      {scene.text.filter((x) => t >= x.start && t <= x.end).map((x, i) => {
        const o = fadeIO(t, x.start, x.end);
        const pop = interpolate(t, [x.start, x.start + 0.3], [0.85, 1], {extrapolateRight: 'clamp'});
        const big = x.style === 'title';
        const top = x.position === 'top' ? 0.08 : x.position === 'center' ? 0.42 : 0.7;
        return (
          <div key={i} style={{position: 'absolute', top: `${top * 100}%`, width: '100%', display: 'flex', justifyContent: x.style === 'lower-third' ? 'flex-start' : 'center', paddingLeft: x.style === 'lower-third' ? 48 * u : 0, opacity: o, transform: `scale(${pop})`}}>
            <div style={{fontSize: (big ? 64 : 34) * u, fontWeight: 800, color: big ? '#ffffff' : '#111', background: big ? 'rgba(17,17,17,0.78)' : 'rgba(255,255,255,0.88)', padding: `${10 * u}px ${24 * u}px`, borderRadius: 14 * u, letterSpacing: big ? 1 : 0, boxShadow: '0 6px 18px rgba(0,0,0,0.25)', maxWidth: '86%', textAlign: 'center'}}>{x.text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Splits narration into short phrases and times them proportionally to their length. */
export function captionChunks(text: string, start: number, duration: number, maxWords = 7) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= maxWords || /[.!?,;:]$/.test(w) && cur.length >= 3) {chunks.push(cur.join(' ')); cur = [];}
  }
  if (cur.length) chunks.push(cur.join(' '));
  const total = chunks.reduce((a, c) => a + c.length, 0) || 1;
  let t = start;
  return chunks.map((c) => {const d = (c.length / total) * duration; const r = {text: c, start: t, end: t + d}; t += d; return r;});
}

export const Captions: React.FC<{scene: Scene; style: Style}> = ({scene, style}) => {
  const {fps, height} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const n = scene.narration;
  if (!n) return null;
  const dur = n.duration ?? Math.max(1, n.text.split(/\s+/).length / 2.6);
  const cur = captionChunks(n.text, n.start, dur).find((c) => t >= c.start && t < c.end);
  if (!cur) return null;
  const u = height / 720;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 * u, pointerEvents: 'none'}}>
      <div style={{fontFamily: style.font, fontSize: 34 * u, fontWeight: 700, color: style.captionColor, background: style.captionBg, padding: `${8 * u}px ${20 * u}px`, borderRadius: 10 * u, maxWidth: '82%', textAlign: 'center'}}>{cur.text}</div>
    </AbsoluteFill>
  );
};
