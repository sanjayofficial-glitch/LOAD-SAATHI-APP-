import {
  interpolate,
  useCurrentFrame,
  Composition,
  AbsoluteFill,
} from 'remotion';
import { Scene1ShipperPost, SCENE_END as S1_END } from '../scenes/Scene1ShipperPost';
import { Scene2ShipperMatches, SCENE_START as S2_START, SCENE_END as S2_END } from '../scenes/Scene2ShipperMatches';
import { Scene3TruckerAccept, SCENE_START as S3_START, SCENE_END as S3_END } from '../scenes/Scene3TruckerAccept';
import { Scene4SharedTracking, SCENE_START as S4_START } from '../scenes/Scene4SharedTracking';
import { Captions } from '../components/Captions';

const FPS = 30;
const DURATION_IN_FRAMES = 1800;
const WIDTH = 1920;
const HEIGHT = 1080;

type Props = {};

const calculateMetadata = () => {
  return {
    durationInFrames: DURATION_IN_FRAMES,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  };
};

export const LoadSaathiDemo: React.FC<Props> = () => {
  return (
    <Composition
      id="LoadSaathiDemo"
      component={DemoComponent}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      calculateMetadata={calculateMetadata}
    />
  );
};

export const DemoComponent: React.FC<Props> = () => {
  const frame = useCurrentFrame();

  const s1Opacity = interpolate(frame, [S1_END - 30, S1_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s2In = interpolate(frame, [S2_START, S2_START + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s2Out = interpolate(frame, [S2_END - 30, S2_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s3In = interpolate(frame, [S3_START, S3_START + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s3Out = interpolate(frame, [S3_END - 30, S3_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s4In = interpolate(frame, [S4_START, S4_START + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const endCardOpacity = interpolate(frame, [1740, 1799], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const endCardY = interpolate(frame, [1740, 1799], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: '#FFFFFF' }}>
      <div style={{ opacity: s1Opacity }}>
        <Scene1ShipperPost frame={frame} />
      </div>
      <div style={{ opacity: s2In * s2Out }}>
        <Scene2ShipperMatches frame={frame} />
      </div>
      <div style={{ opacity: s3In * s3Out }}>
        <Scene3TruckerAccept frame={frame} />
      </div>
      <div style={{ opacity: s4In }}>
        <Scene4SharedTracking frame={frame} />
      </div>
      <Captions frame={frame} />
      {frame >= 1740 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: endCardOpacity,
            transform: `translateY(${endCardY}px)`,
            zIndex: 300,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#F97316',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 0 24px rgba(249, 115, 22, 0.4)',
            }}
          >
            <span style={{ fontSize: 24 }}>🚛</span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#0F172A', letterSpacing: -0.03, marginBottom: 8 }}>
            LoadSaathi
          </div>
          <div style={{ fontSize: 17, color: '#64748B', fontWeight: 500, marginBottom: 12 }}>
            Every truck should move full.
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#64748B',
              background: '#F1F5F9',
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #E2E8F0',
            }}
          >
            Demo — illustrative UI and synthetic data
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
