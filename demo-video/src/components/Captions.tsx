import { interpolate } from 'remotion';
import { voiceoverScript } from '../data/demoData';
import { theme } from '../theme';

interface CaptionsProps {
  frame: number;
}

const scenes: Array<{ start: number; end: number; text: string }> = [
  { start: 0, end: 419, text: voiceoverScript.scene1 },
  { start: 420, end: 869, text: voiceoverScript.scene2 },
  { start: 870, end: 1349, text: voiceoverScript.scene3 },
  { start: 1350, end: 1799, text: voiceoverScript.scene4 },
];

export const Captions: React.FC<CaptionsProps> = ({ frame }) => {
  const active = scenes.find((s) => frame >= s.start && frame <= s.end);
  if (!active) return null;

  const local = frame - active.start;
  const sceneLen = active.end - active.start;
  const inOpacity = interpolate(local, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outOpacity = interpolate(local, [sceneLen - 14, sceneLen], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 150,
        left: 96,
        right: 96,
        opacity: inOpacity * outOpacity,
        fontSize: 16,
        fontWeight: 500,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 1.4,
        padding: '14px 20px',
        background: 'rgba(15, 23, 42, 0.75)',
        borderRadius: theme.radius.lg,
        backdropFilter: 'blur(8px)',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
      }}
    >
      {active.text}
    </div>
  );
};
