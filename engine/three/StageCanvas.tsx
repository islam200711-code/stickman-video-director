/** One scene rendered with Three.js inside Remotion's ThreeCanvas. Time comes only from useCurrentFrame. */
import React from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import type {CharacterProfile, Scene} from '../schema/scene';
import {evaluateCharacter, smooth} from '../animations/library';
import {Stickman} from './Stickman';
import {EnvironmentView} from './environments';
import {SceneProp} from './props';
import {cameraAt} from './camera';
import {Html3DLabel} from './Label';

const MovingProp: React.FC<{p: Scene['props'][number]; t: number}> = ({p, t}) => {
  let pos = p.position; let roll = 0;
  if (p.move) {
    const k = smooth((t - p.move.start) / Math.max(0.01, p.move.end - p.move.start));
    pos = [0, 1, 2].map((i) => p.position[i] + (p.move!.to[i] - p.position[i]) * k) as typeof pos;
    if (p.move.roll) roll = -(pos[0] - p.position[0]) / (0.75 * p.scale);
  }
  const y = (p.rotation * Math.PI) / 180;
  return (
    <group position={pos} rotation={[0, y, 0]} scale={p.scale}>
      <group position={[0, 0.6, 0]} rotation={[0, 0, roll]}><group position={[0, -0.6, 0]}><SceneProp kind={p.kind} color={p.color} /></group></group>
    </group>
  );
};

const CameraDriver: React.FC<{scene: Scene; t: number}> = ({scene, t}) => {
  const {camera} = useThree();
  const c = cameraAt(scene.camera, t);
  camera.position.set(...c.position);
  camera.lookAt(...c.lookAt);
  const pc = camera as THREE.PerspectiveCamera;
  if (pc.fov !== c.fov) {pc.fov = c.fov; pc.updateProjectionMatrix();}
  return null;
};

export const StageCanvas: React.FC<{scene: Scene; cast: Record<string, CharacterProfile>; lineWidth: number}> = ({scene, cast, lineWidth}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05}} camera={{fov: 40, near: 0.1, far: 200, position: [0, 1.5, 8]}}>
      <CameraDriver scene={scene} t={t} />
      <EnvironmentView preset={scene.environment.preset} palette={scene.environment.palette} timeOfDay={scene.environment.timeOfDay} />
      {scene.props.filter((p) => p.appearAt === undefined || t >= p.appearAt).map((p, i) => (
        <MovingProp key={i} p={p} t={t} />
      ))}
      {scene.characters.map((ch) => {
        const profile = cast[ch.profile ?? ch.id];
        if (!profile) throw new Error(`Scene ${scene.id}: character "${ch.id}" is not in the cast`);
        const cf = evaluateCharacter(ch, t, scene.duration);
        return <React.Fragment key={ch.id}><Stickman profile={profile} frame={cf} time={t} lineWidth={lineWidth} />
          {ch.label && <Html3DLabel text={ch.label} position={[cf.position[0], 2.25 * profile.scale, cf.position[2]]} />}</React.Fragment>;
      })}
    </ThreeCanvas>
  );
};
