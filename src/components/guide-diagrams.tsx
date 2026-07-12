import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/**
 * Top-down teaching diagrams for the help guides, drawn in the Signpost
 * palette. All are original illustrations.
 */

const AMBER = '#F59F00';

function CarTopDown({
  x,
  y,
  color,
  opacity = 1,
  rotate = 0,
}: {
  x: number;
  y: number;
  color: string;
  opacity?: number;
  rotate?: number;
}) {
  // A 26×48 car drawn about its centre for easy rotation.
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity}>
      <Rect x={-13} y={-24} width={26} height={48} rx={7} fill={color} />
      <Rect x={-9} y={-14} width={18} height={10} rx={2} fill="#ffffff" opacity={0.35} />
      <Rect x={-9} y={8} width={18} height={8} rx={2} fill="#ffffff" opacity={0.25} />
    </G>
  );
}

export function MirrorZonesDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
      {/* direction of travel */}
      <Line x1={120} y1={26} x2={120} y2={10} stroke={theme.textSecondary} strokeWidth={2} />
      <Polygon points="120,4 114,14 126,14" fill={theme.textSecondary} />

      {/* interior mirror view */}
      <Polygon points="120,110 92,176 148,176" fill={theme.tint} opacity={0.18} />
      {/* door mirror views */}
      <Polygon points="104,72 52,150 78,164" fill={theme.tint} opacity={0.18} />
      <Polygon points="136,72 188,150 162,164" fill={theme.tint} opacity={0.18} />
      {/* blind spots */}
      <Polygon points="104,76 30,96 46,140" fill={AMBER} opacity={0.3} />
      <Polygon points="136,76 210,96 194,140" fill={AMBER} opacity={0.3} />

      <CarTopDown x={120} y={84} color={theme.tint} />

      <SvgText x={30} y={88} fontSize={10} fontWeight="bold" fill={AMBER}>
        blind spot
      </SvgText>
      <SvgText x={166} y={88} fontSize={10} fontWeight="bold" fill={AMBER}>
        blind spot
      </SvgText>
      <SvgText x={120} y={172} fontSize={10} fontWeight="bold" fill={theme.tint} textAnchor="middle" opacity={0.9}>
        mirror view
      </SvgText>
    </Svg>
  );
}

export function ParallelParkDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
      {/* kerb */}
      <Line x1={206} y1={0} x2={206} y2={180} stroke={theme.textSecondary} strokeWidth={4} />
      {/* lead car parked at the kerb */}
      <CarTopDown x={182} y={44} color={theme.textSecondary} opacity={0.55} />

      {/* your car: start alongside, swinging at 45°, finished at the kerb */}
      <CarTopDown x={138} y={52} color={theme.tint} opacity={0.3} />
      <CarTopDown x={158} y={96} color={theme.tint} opacity={0.55} rotate={-38} />
      <CarTopDown x={182} y={140} color={theme.tint} />

      {/* the path */}
      <Path
        d="M138,74 C138,102 176,104 180,120"
        stroke={theme.tint}
        strokeWidth={2.5}
        strokeDasharray="6 5"
        fill="none"
      />
      <Polygon points="182,130 174,118 186,116" fill={theme.tint} />

      <SvgText x={124} y={36} fontSize={10} fontWeight="bold" fill={theme.tint}>
        1. level, 1 m gap
      </SvgText>
      <SvgText x={92} y={100} fontSize={10} fontWeight="bold" fill={theme.tint}>
        2. left lock to 45°
      </SvgText>
      <SvgText x={106} y={156} fontSize={10} fontWeight="bold" fill={theme.tint}>
        3. straighten at kerb
      </SvgText>
    </Svg>
  );
}

export function BayParkDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
      {/* bay lines */}
      {[60, 100, 140, 180].map((x) => (
        <Line key={x} x1={x} y1={112} x2={x} y2={178} stroke={theme.textSecondary} strokeWidth={3} />
      ))}
      {/* a parked neighbour */}
      <CarTopDown x={160} y={146} color={theme.textSecondary} opacity={0.5} />

      {/* start position, driving past the bays */}
      <CarTopDown x={70} y={44} color={theme.tint} opacity={0.35} rotate={90} />
      {/* reversing in */}
      <CarTopDown x={120} y={144} color={theme.tint} />

      {/* the path */}
      <Path
        d="M96,44 C140,44 120,84 120,116"
        stroke={theme.tint}
        strokeWidth={2.5}
        strokeDasharray="6 5"
        fill="none"
      />
      <Polygon points="120,128 113,116 127,116" fill={theme.tint} />

      <SvgText x={28} y={24} fontSize={10} fontWeight="bold" fill={theme.tint}>
        1. drive past, shoulder level with the far line
      </SvgText>
      <SvgText x={132} y={98} fontSize={10} fontWeight="bold" fill={theme.tint}>
        2. full lock, creep back
      </SvgText>
    </Svg>
  );
}

export function RoundaboutDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
      {/* the island and circulating lane */}
      <Circle cx={120} cy={86} r={54} fill="none" stroke={theme.roadLine} strokeWidth={22} />
      <Circle cx={120} cy={86} r={54} fill="none" stroke={theme.roadDash} strokeWidth={1.5} strokeDasharray="7 7" />
      <Circle cx={120} cy={86} r={26} fill={theme.backgroundSelected} />

      {/* approach road and exits */}
      <Rect x={109} y={140} width={22} height={40} fill={theme.roadLine} />
      <Rect x={109} y={0} width={22} height={24} fill={theme.roadLine} />
      <Rect x={0} y={75} width={26} height={22} fill={theme.roadLine} />
      <Rect x={214} y={75} width={26} height={22} fill={theme.roadLine} />

      {/* your path: enter from the bottom, leave at the third exit (right turn) */}
      <Path
        d="M114,176 L114,140 A48,48 0 1 1 208,86"
        stroke={theme.tint}
        strokeWidth={3}
        strokeDasharray="7 5"
        fill="none"
      />
      <Polygon points="220,86 206,79 206,93" fill={theme.tint} />

      <CarTopDown x={126} y={158} color={theme.tint} opacity={0.9} />
      <SvgText x={10} y={16} fontSize={10} fontWeight="bold" fill={theme.tint}>
        signal right on approach,
      </SvgText>
      <SvgText x={10} y={28} fontSize={10} fontWeight="bold" fill={theme.tint}>
        left after the exit before yours
      </SvgText>
    </Svg>
  );
}

export function PullUpRightDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
      {/* kerbs and centre line */}
      <Line x1={60} y1={0} x2={60} y2={180} stroke={theme.textSecondary} strokeWidth={4} />
      <Line x1={196} y1={0} x2={196} y2={180} stroke={theme.textSecondary} strokeWidth={4} />
      <Line x1={128} y1={0} x2={128} y2={180} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="10 8" />

      {/* start on the left, crossed to the right kerb, then reversed back */}
      <CarTopDown x={92} y={146} color={theme.tint} opacity={0.3} />
      <CarTopDown x={170} y={70} color={theme.tint} opacity={0.55} />
      <CarTopDown x={170} y={128} color={theme.tint} />

      {/* crossing path, then the reverse */}
      <Path d="M92,124 C92,84 150,110 168,94" stroke={theme.tint} strokeWidth={2.5} strokeDasharray="6 5" fill="none" />
      <Path d="M170,96 L170,100" stroke="none" fill="none" />
      <Path d="M178,96 L178,116" stroke={theme.success} strokeWidth={2.5} strokeDasharray="5 4" fill="none" />
      <Polygon points="178,126 171,114 185,114" fill={theme.success} />

      <SvgText x={8} y={170} fontSize={10} fontWeight="bold" fill={theme.tint}>
        1. cross when clear
      </SvgText>
      <SvgText x={112} y={36} fontSize={10} fontWeight="bold" fill={theme.tint}>
        2. stop close to the right kerb
      </SvgText>
      <SvgText x={40} y={116} fontSize={10} fontWeight="bold" fill={theme.success}>
        3. reverse two car lengths
      </SvgText>
    </Svg>
  );
}

export function GuideDiagram({ kind, size }: { kind: string; size?: number }) {
  switch (kind) {
    case 'mirrors':
      return <MirrorZonesDiagram size={size} />;
    case 'parallel':
      return <ParallelParkDiagram size={size} />;
    case 'bay':
      return <BayParkDiagram size={size} />;
    case 'roundabout':
      return <RoundaboutDiagram size={size} />;
    case 'pullUpRight':
      return <PullUpRightDiagram size={size} />;
    default:
      return null;
  }
}
