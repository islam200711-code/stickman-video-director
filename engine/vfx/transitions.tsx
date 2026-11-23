/**
 * Original graphic scene transitions for @remotion/transitions:
 *   brush  — dark painterly brush strokes sweep across, the next scene is revealed behind them
 *   fire   — layered painted flame shapes surge up and burn away into the next scene
 *   blink  — eyelids close (almond mask) and reopen on the next scene
 * Deterministic SVG; no assets.
 */
import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {rng} from '../three/assets';

type P = Record<string, never>;
const clamp = (x: number) => Math.max(0, Math.min(1, x));

/** Coverage curve shared by brush/fire: 0→1 cover during first half, 1→0 reveal during second half. */
const cover = (p: number) => (p < 0.5 ? p * 2 : (1 - p) * 2);

const BrushOverlay: React.FC<{p: number; seed: number; colors: string[]}> = ({p, seed, colors}) => {
  const {width: w, height: h} = useVideoConfig();
  const r = rng(seed); const n = 9;
  return <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>{Array.from({length: n}, (_, i) => {
    const y = (i + 0.5) * (h / n) + (r() - 0.5) * h * 0.06, th = h / n * (1.3 + r() * 0.8);
    const delay = r() * 0.25, k = clamp((p - delay) / 0.75);
    const x0 = -w * 0.2, x1 = x0 + (w * 1.45) * k, tilt = (r() - 0.5) * h * 0.08;
    const c = colors[i % colors.length];
    return <path key={i} d={`M ${x0} ${y - th / 2} L ${x1} ${y - th / 2 + tilt} Q ${x1 + th * 0.6} ${y + tilt * 0.5} ${x1} ${y + th / 2 + tilt} L ${x0} ${y + th / 2} Z`} fill={c} />;
  })}</svg>;
};
const BrushPresentation: React.FC<TransitionPresentationComponentProps<P>> = ({children, presentationDirection, presentationProgress}) => {
  // exiting scene is covered by strokes in the first half; entering scene shows from the midpoint while strokes clear
  const show = presentationDirection === 'entering' ? presentationProgress >= 0.5 : presentationProgress < 0.5;
  return <AbsoluteFill>{show && children}{presentationDirection === 'entering' && <BrushOverlay p={cover(presentationProgress)} seed={11} colors={['#141418', '#b3121c', '#2a2a30']} />}</AbsoluteFill>;
};

const FireOverlay: React.FC<{p: number}> = ({p}) => {
  const {width: w, height: h} = useVideoConfig();
  const layers = [['#c2271a', 1.0], ['#ff7a1a', 0.86], ['#ffc53a', 0.7], ['#fff3c4', 0.5]] as const;
  return <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>{layers.map(([c, s], li) => {
    const r = rng(40 + li); const top = h * (1.15 - 1.35 * p * s);
    const pts: string[] = [`0,${h}`];
    for (let i = 0; i <= 16; i++) {const x = (i / 16) * w; const tongue = (r() * 0.5 + 0.2) * h * 0.35 * s; pts.push(`${x},${top + (i % 2 ? tongue : -tongue * 0.6)}`);}
    pts.push(`${w},${h}`);
    return <polygon key={li} points={pts.join(' ')} fill={c} />;
  })}</svg>;
};
const FirePresentation: React.FC<TransitionPresentationComponentProps<P>> = ({children, presentationDirection, presentationProgress}) => {
  const show = presentationDirection === 'entering' ? presentationProgress >= 0.5 : presentationProgress < 0.5;
  return <AbsoluteFill>{show && children}{presentationDirection === 'entering' && <FireOverlay p={clamp(cover(presentationProgress) * 1.05)} />}</AbsoluteFill>;
};

const BlinkOverlay: React.FC<{open: number}> = ({open}) => {
  const {width: w, height: h} = useVideoConfig();
  const oh = h * 0.62 * open; // almond opening half-height
  return <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
    <path fillRule="evenodd" fill="#050507" d={`M0 0 H${w} V${h} H0 Z M${-w * 0.05} ${h / 2} Q ${w / 2} ${h / 2 - oh * 1.9} ${w * 1.05} ${h / 2} Q ${w / 2} ${h / 2 + oh * 1.9} ${-w * 0.05} ${h / 2} Z`} />
  </svg>;
};
const BlinkPresentation: React.FC<TransitionPresentationComponentProps<P>> = ({children, presentationDirection, presentationProgress}) => {
  const show = presentationDirection === 'entering' ? presentationProgress >= 0.5 : presentationProgress < 0.5;
  const open = presentationProgress < 0.5 ? 1 - presentationProgress * 2 : (presentationProgress - 0.5) * 2;
  return <AbsoluteFill>{show && children}{presentationDirection === 'entering' && <BlinkOverlay open={open * open} />}</AbsoluteFill>;
};

export const brushWipe = (): TransitionPresentation<P> => ({component: BrushPresentation, props: {}});
export const fireWipe = (): TransitionPresentation<P> => ({component: FirePresentation, props: {}});
export const blink = (): TransitionPresentation<P> => ({component: BlinkPresentation, props: {}});
