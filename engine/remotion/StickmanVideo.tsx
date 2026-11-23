/** Full video timeline: scenes in a TransitionSeries + optional music bed. */
import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {VideoSpec, type VideoSpecInput} from '../schema/scene';
import {resolveCast} from '../characters';
import {SceneComp} from './SceneComp';
import {brushWipe, fireWipe, blink} from '../vfx/transitions';

/**
 * Music ducking + pre-hit silence (event-driven):
 *  - strong SFX (volume >= 0.7): music dips to 45% around the hit
 *  - important SFX (heavy impacts): music falls to ~5% for 0.45 s BEFORE the hit, then swells back
 */
export function musicDuck(spec: VideoSpec, frame: number): number {
  const fps = spec.format.fps; const t = frame / fps;
  let start = 0, k = 1;
  spec.scenes.forEach((sc, i) => {
    if (i > 0 && sc.transitionIn.type !== 'cut') start -= sc.transitionIn.duration;
    for (const s of sc.sfx) {
      const T = start + s.at;
      if (s.important && t > T - 0.45 && t < T + 0.7) k = Math.min(k, t < T ? 0.05 + 0.95 * Math.max(0, (T - t - 0.35) / 0.1) : 0.05 + 0.95 * Math.min(1, (t - T) / 0.7));
      else if (s.volume >= 0.7 && t > T - 0.05 && t < T + 0.4) k = Math.min(k, 0.45);
    }
    start += sc.duration;
  });
  return k;
}

const presentation = (type: string) => (type === 'slide' ? slide({direction: 'from-right'}) : type === 'wipe' ? wipe({direction: 'from-left'}) : type === 'brush' ? brushWipe() : type === 'fire' ? fireWipe() : type === 'blink' ? blink() : fade());

export const StickmanVideo: React.FC<{spec: VideoSpecInput}> = ({spec: raw}) => {
  const spec = VideoSpec.parse(raw);
  const fps = spec.format.fps;
  const cast = resolveCast(spec.cast);
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <TransitionSeries>
        {spec.scenes.flatMap((scene, i) => {
          const items = [];
          if (i > 0 && scene.transitionIn.type !== 'cut' && scene.transitionIn.duration > 0) {
            items.push(<TransitionSeries.Transition key={`t${i}`} presentation={presentation(scene.transitionIn.type) as never} timing={linearTiming({durationInFrames: Math.round(scene.transitionIn.duration * fps)})} />);
          }
          items.push(<TransitionSeries.Sequence key={scene.id} durationInFrames={Math.round(scene.duration * fps)}><SceneComp scene={scene} spec={spec} cast={cast} /></TransitionSeries.Sequence>);
          return items;
        })}
      </TransitionSeries>
      {spec.music && <Audio src={staticFile(spec.music.file)} volume={(f) => spec.music!.volume * musicDuck(spec, f) * interpolate(f, [0, fps, durationInFrames - 1.5 * fps, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />}
    </AbsoluteFill>
  );
};
