/** Cheap soft contact shadow / ambient-occlusion blob under a character (no post-processing). */
import React from 'react';
import * as THREE from 'three';

let tex: THREE.Texture | null = null;
function blobTexture() {
  if (tex) return tex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)'); grad.addColorStop(0.45, 'rgba(0,0,0,0.28)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  tex = new THREE.CanvasTexture(c);
  return tex;
}

export const ContactShadow: React.FC<{center: [number, number]; height?: number; lying?: boolean; size?: number}> = ({center, height = 0, lying, size = 0.75}) => {
  const fade = Math.max(0.25, 1 - height * 1.6);
  const s = size * (1 + height * 0.8);
  return (
    <mesh position={[center[0], 0.004, center[1]]} rotation={[-Math.PI / 2, 0, 0]} scale={lying ? [s * 1.1, s * 2.4, 1] : [s, s * 0.8, 1]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={blobTexture()} transparent opacity={fade} depthWrite={false} />
    </mesh>
  );
};
