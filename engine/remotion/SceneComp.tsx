import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import type {CharacterProfile, Scene, VideoSpec} from '../schema/scene';
import {StageCanvas} from '../three/StageCanvas';
import {Captions, TextOverlays} from './Overlays';

export const SceneComp: React.FC<{scene: Scene; spec: VideoSpec; cast: Record<string, CharacterProfile>}> = ({scene, spec, cast}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <StageCanvas scene={scene} cast={cast} lineWidth={spec.style.lineWidth} />
      <TextOverlays scene={scene} style={spec.style} />
      {spec.captions && <Captions scene={scene} style={spec.style} />}
      {scene.narration?.audio && (
        <Sequence from={Math.round(scene.narration.start * fps)} layout="none"><Audio src={staticFile(scene.narration.audio)} /></Sequence>
      )}
      {scene.sfx.map((s, i) => (
        <Sequence key={i} from={Math.round(s.at * fps)} layout="none"><Audio src={staticFile(s.file)} volume={s.volume} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
