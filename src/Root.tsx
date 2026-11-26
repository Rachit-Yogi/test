import React from 'react';
import {Composition} from 'remotion';
import {LyricVideo} from './LyricVideo';
import {DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH} from './config';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LyricVideo"
      component={LyricVideo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
