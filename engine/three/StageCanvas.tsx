/** One scene rendered with Three.js inside Remotion's ThreeCanvas. Time comes only from useCurrentFrame. */
import React from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import type {CharacterProfile, Scene, Vec3} from '../schema/scene';
import {evaluateCharacter, PROPORTIONS, type CharacterFrame} from '../animations/library';
import {propMotion} from '../animations/weight';
import {Stickman} from './Stickman';
import {EnvironmentView, isIndoor} from './environments';
import {SceneProp} from './props';
import {cameraAt} from './camera';
import {Html3DLabel} from './Label';
import {Ambient, Birds, defaultAmbient} from './ambient';
import {getLook} from './looks';

const MovingProp: React.FC<{p: Scene['props'][number]; t: number}> = ({p, t}) => {
  let pos = p.position; let roll = 0, wobble = 0;
  if (p.move) {
    const u = (t - p.move.start) / Math.max(0.01, p.move.end - p.move.start);
    const m = propMotion(p.move.weight, u, Math.max(0, p.position[1] - p.move.to[1]));
    pos = [0, 1, 2].map((i) => p.position[i] + (p.move!.to[i] - p.position[i]) * m.k) as Vec3;
    if (p.move.weight === 'drop') pos = [pos[0], p.move.to[1] + m.lift, pos[2]];
    if (p.move.roll) roll = -(pos[0] - p.position[0]) / (0.75 * p.scale);
    wobble = m.wobble;
  }
  const y = (p.rotation * Math.PI) / 180;
  return (
    <group position={pos} rotation={[0, y, 0]} scale={p.scale}>
      <group position={[0, 0.6, 0]} rotation={[wobble * 0.5, 0, roll + wobble]}><group position={[0, -0.6, 0]}><SceneProp kind={p.kind} color={p.color} /></group></group>
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

/** Gaze: explicit target > named character > whoever else is talking (listeners watch the speaker). */
export function resolveGaze(scene: Scene, frames: Record<string, CharacterFrame>, id: string, scale = 1): Vec3 | undefined {
  const f = frames[id];
  if (f.lookAt) return f.lookAt;
  const headY = (PROPORTIONS.hip + PROPORTIONS.torso + PROPORTIONS.neck + PROPORTIONS.head) * scale;
  const other = f.lookAtCharacter ?? (!f.talking ? Object.keys(frames).find((k) => k !== id && frames[k].talking) : undefined);
  if (other && frames[other]) {const p = frames[other].position; return [p[0], headY, p[2]];}
  return undefined;
}

export const StageCanvas: React.FC<{scene: Scene; cast: Record<string, CharacterProfile>; lineWidth: number; render?: {shadowMap: number; msaa: boolean; softShadows: boolean}}> = ({scene, cast, lineWidth, render = {shadowMap: 1024, msaa: true, softShadows: true}}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const look = getLook(scene.look);
  const env = scene.environment;
  const indoor = isIndoor(env.preset);
  const ambient = env.ambient === 'auto' ? defaultAmbient(env.preset, env.timeOfDay, indoor) : env.ambient;
  const frames: Record<string, CharacterFrame> = {};
  for (const ch of scene.characters) frames[ch.id] = evaluateCharacter(ch, t, scene.duration);
  return (
    <ThreeCanvas width={width} height={height} shadows={render.softShadows ? 'soft' : true} gl={{antialias: render.msaa, preserveDrawingBuffer: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: look.exposure}} camera={{fov: 40, near: 0.1, far: 300, position: [0, 1.5, 8]}}>
      <CameraDriver scene={scene} t={t} />
      <EnvironmentView shadowMap={render.shadowMap} preset={env.preset} palette={env.palette} timeOfDay={env.timeOfDay} look={scene.look} />
      <Ambient kind={ambient} t={t} />
      {!indoor && env.timeOfDay !== 'night' && <Birds t={t} />}
      {scene.props.filter((p) => (p.appearAt === undefined || t >= p.appearAt) && (p.disappearAt === undefined || t < p.disappearAt)).map((p, i) => (
        <MovingProp key={i} p={p} t={t} />
      ))}
      {scene.characters.map((ch) => {
        const profile = cast[ch.profile ?? ch.id];
        if (!profile) throw new Error(`Scene ${scene.id}: character "${ch.id}" is not in the cast`);
        const cf = frames[ch.id];
        return <React.Fragment key={ch.id}><Stickman profile={profile} frame={cf} time={t} lineWidth={lineWidth} gaze={resolveGaze(scene, frames, ch.id, profile.scale)} />
          {ch.label && <Html3DLabel text={ch.label} position={[cf.position[0], 2.25 * profile.scale, cf.position[2]]} />}</React.Fragment>;
      })}
    </ThreeCanvas>
  );
};
