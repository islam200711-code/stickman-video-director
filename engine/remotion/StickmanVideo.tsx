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

const presentation = (type: string) => (type === 'slide' ? slide({direction: 'from-right'}) : type === 'wipe' ? wipe({direction: 'from-left'}) : fade());

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
      {spec.music && <Audio src={staticFile(spec.music.file)} volume={(f) => spec.music!.volume * interpolate(f, [0, fps, durationInFrames - 1.5 * fps, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />}
    </AbsoluteFill>
  );
};
