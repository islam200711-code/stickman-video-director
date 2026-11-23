import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import type {CharacterProfile, Scene, VideoSpec} from '../schema/scene';
import {StageCanvas} from '../three/StageCanvas';
import {getLook} from '../three/looks';
import {SceneOverlays} from './Overlays';

/** Cheap 2D grade from the scene look: CSS saturate/contrast on the 3D layer, tint + vignette on top. Text is not graded. */
const Grade: React.FC<{look: string; children: React.ReactNode}> = ({look, children}) => {
  const g = getLook(look).grade;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: `saturate(${g.saturate}) contrast(${g.contrast})`}}>{children}</AbsoluteFill>
      {g.tint && <AbsoluteFill style={{backgroundColor: g.tint, opacity: g.tintOpacity ?? 0.05, mixBlendMode: 'soft-light'}} />}
      {g.vignette > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${g.vignette}) 100%)`}} />}
    </AbsoluteFill>
  );
};

export const SceneComp: React.FC<{scene: Scene; spec: VideoSpec; cast: Record<string, CharacterProfile>}> = ({scene, spec, cast}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Grade look={scene.look}><StageCanvas scene={scene} cast={cast} lineWidth={spec.style.lineWidth} render={spec.format.render} /></Grade>
      <SceneOverlays scene={scene} style={spec.style} captions={spec.captions} />
      {scene.narration?.audio && (
        <Sequence from={Math.round(scene.narration.start * fps)} layout="none"><Audio src={staticFile(scene.narration.audio)} /></Sequence>
      )}
      {scene.sfx.map((s, i) => (
        <Sequence key={i} from={Math.round(s.at * fps)} layout="none"><Audio src={staticFile(s.file)} volume={s.volume} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
