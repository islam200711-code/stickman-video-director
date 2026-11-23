/** World-space head centre of a character at time t (solved skeleton, incl. lean/hop/crouch). */
import * as THREE from 'three';
import type {SceneCharacter, Vec3} from '../schema/scene';
import {evaluateCharacter} from './library';
import {solveSkeleton} from '../three/skeleton';

export function headWorld(ch: SceneCharacter, t: number, dur: number, scale = 1): Vec3 {
  const f = evaluateCharacter(ch, t, dur);
  const h = solveSkeleton(f.pose).headCenter.clone().multiplyScalar(scale).applyAxisAngle(new THREE.Vector3(0, 1, 0), (f.facing * Math.PI) / 180);
  return [f.position[0] + h.x, f.position[1] + h.y, f.position[2] + h.z];
}
