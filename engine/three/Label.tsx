/** Simple in-world text label using a canvas texture sprite (no font downloads needed). */
import React, {useMemo} from 'react';
import * as THREE from 'three';

export const Html3DLabel: React.FC<{text: string; position: [number, number, number]}> = ({text, position}) => {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.roundRect(8, 16, 496, 96, 40); g.fill();
    g.fillStyle = '#111'; g.font = 'bold 56px Helvetica, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 256, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [text]);
  return <sprite position={position} scale={[0.9, 0.225, 1]}><spriteMaterial map={tex} transparent depthTest={false} /></sprite>;
};
