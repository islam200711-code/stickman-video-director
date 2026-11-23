import React from 'react';
import {Composition} from 'remotion';
import {StickmanVideo} from './StickmanVideo';
import {VideoSpec, resolution, totalFrames, type VideoSpecInput} from '../schema/scene';
import demo from './demo-spec.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="StickmanVideo"
    component={StickmanVideo}
    defaultProps={{spec: demo as unknown as VideoSpecInput}}
    durationInFrames={240} fps={24} width={1280} height={720}
    calculateMetadata={({props}) => {
      const spec = VideoSpec.parse(props.spec);
      return {durationInFrames: totalFrames(spec), fps: spec.format.fps, ...resolution(spec.format)};
    }}
  />
);
