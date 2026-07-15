import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * Top-down teaching diagrams for the help guides, drawn in the Signpost
 * palette. All are original illustrations. Each manoeuvre loops a small
 * animated car along its path — indicators, brake and reverse lights
 * included — over the static labelled diagram.
 */

const AMBER = '#F59F00';
const VIEW_W = 240;
const VIEW_H = 180;

// --- the animation engine ---

/** Car path as parallel keyframe arrays: at progress t[i] the car is at (x,y) rotated r°. */
interface CarPath {
  t: number[];
  x: number[];
  y: number[];
  r: number[];
}

/** Opacity keyframes, used to fade the car out before the loop restarts. */
interface FadeTrack {
  t: number[];
  v: number[];
}

type LightRanges = readonly (readonly [number, number])[];

/** A 0→1 progress value that loops forever over `durationMs`. */
function useLoopProgress(durationMs: number): SharedValue<number> {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(progress);
  }, [progress, durationMs]);
  return progress;
}

/** Indicator / brake / reverse dots on the car body, lit during progress ranges. */
function CarLights({
  progress,
  durationMs,
  ranges,
  blink,
  color,
  positions,
  dot,
}: {
  progress: SharedValue<number>;
  durationMs: number;
  ranges: LightRanges;
  blink: boolean;
  color: string;
  positions: { left: number; top: number }[];
  dot: number;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    let on = 0;
    for (let i = 0; i < ranges.length; i++) {
      if (p >= ranges[i][0] && p <= ranges[i][1]) {
        on = 1;
        break;
      }
    }
    const phase = ((p * durationMs) / 480) % 1;
    const lit = !blink || phase < 0.55 ? 1 : 0.1;
    return { opacity: on * lit };
  });

  return (
    <>
      {positions.map((pos, index) => (
        <Animated.View
          key={index}
          pointerEvents="none"
          style={[
            styles.light,
            { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color, ...pos },
            style,
          ]}
        />
      ))}
    </>
  );
}

/** The moving car: a rounded plate with windows, driven along keyframes. */
function AnimatedCar({
  progress,
  durationMs,
  path,
  fade,
  scale,
  color,
  indicatorLeft,
  indicatorRight,
  brake,
  reverse,
}: {
  progress: SharedValue<number>;
  durationMs: number;
  path: CarPath;
  fade?: FadeTrack;
  scale: number;
  color: string;
  indicatorLeft?: LightRanges;
  indicatorRight?: LightRanges;
  brake?: LightRanges;
  reverse?: LightRanges;
}) {
  // Sprite canvas is 32 wide so the tyres can poke out past the 26-wide body.
  const w = 32 * scale;
  const h = 48 * scale;
  const dot = Math.max(4, 6 * scale);
  const bodyLeft = (3 / 32) * w;
  const bodyRight = (29 / 32) * w;

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: fade ? interpolate(p, fade.t, fade.v, Extrapolation.CLAMP) : 1,
      transform: [
        { translateX: interpolate(p, path.t, path.x, Extrapolation.CLAMP) * scale },
        { translateY: interpolate(p, path.t, path.y, Extrapolation.CLAMP) * scale },
        { rotate: `${interpolate(p, path.t, path.r, Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.car, { width: w, height: h, left: -w / 2, top: -h / 2 }, style]}>
      <Svg width={w} height={h} viewBox="-3 0 32 48">
        {/* tyres */}
        <Rect x={-2.5} y={7} width={4} height={11} rx={2} fill="#1D2025" />
        <Rect x={24.5} y={7} width={4} height={11} rx={2} fill="#1D2025" />
        <Rect x={-2.5} y={31} width={4} height={11} rx={2} fill="#1D2025" />
        <Rect x={24.5} y={31} width={4} height={11} rx={2} fill="#1D2025" />
        {/* body, windows, door mirrors */}
        <Rect x={0} y={0} width={26} height={48} rx={7} fill={color} />
        <Rect x={-2.5} y={11} width={3.5} height={2.5} rx={1} fill={color} />
        <Rect x={25} y={11} width={3.5} height={2.5} rx={1} fill={color} />
        <Rect x={4} y={10} width={18} height={10} rx={2} fill="#ffffff" opacity={0.35} />
        <Rect x={4} y={32} width={18} height={8} rx={2} fill="#ffffff" opacity={0.25} />
      </Svg>
      {indicatorLeft && (
        <CarLights
          progress={progress}
          durationMs={durationMs}
          ranges={indicatorLeft}
          blink
          color={AMBER}
          dot={dot}
          positions={[
            { left: bodyLeft - dot / 3, top: 0 },
            { left: bodyLeft - dot / 3, top: h - dot },
          ]}
        />
      )}
      {indicatorRight && (
        <CarLights
          progress={progress}
          durationMs={durationMs}
          ranges={indicatorRight}
          blink
          color={AMBER}
          dot={dot}
          positions={[
            { left: bodyRight - dot + dot / 3, top: 0 },
            { left: bodyRight - dot + dot / 3, top: h - dot },
          ]}
        />
      )}
      {brake && (
        <CarLights
          progress={progress}
          durationMs={durationMs}
          ranges={brake}
          blink={false}
          color="#E5484D"
          dot={dot}
          positions={[
            { left: bodyLeft + dot / 2, top: h - dot / 2 },
            { left: bodyRight - dot * 1.5, top: h - dot / 2 },
          ]}
        />
      )}
      {reverse && (
        <CarLights
          progress={progress}
          durationMs={durationMs}
          ranges={reverse}
          blink={false}
          color="#ffffff"
          dot={dot}
          positions={[
            { left: bodyLeft + dot / 2, top: h - dot / 2 },
            { left: bodyRight - dot * 1.5, top: h - dot / 2 },
          ]}
        />
      )}
    </Animated.View>
  );
}

/** A small pill label that appears during a progress window (e.g. "brake!"). */
function FadeBadge({
  progress,
  range,
  x,
  y,
  scale,
  label,
  color,
}: {
  progress: SharedValue<number>;
  range: readonly [number, number];
  x: number;
  y: number;
  scale: number;
  label: string;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const [a, b] = range;
    return {
      opacity: interpolate(
        progress.value,
        [a, Math.min(a + 0.04, b), Math.max(b - 0.04, a), b],
        [0, 1, 1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.badge, { left: x * scale, top: y * scale, backgroundColor: color }, style]}>
      <ThemedText style={styles.badgeText}>{label}</ThemedText>
    </Animated.View>
  );
}

/** Positions the static SVG and its animated overlays in one box. */
function DiagramShell({
  size,
  viewH = VIEW_H,
  children,
}: {
  size: number;
  viewH?: number;
  children: React.ReactNode;
}) {
  return <View style={{ width: size, height: (size * viewH) / VIEW_W }}>{children}</View>;
}

/** A zone polygon that lights up while the loop is inside `range`. */
function ZoneHighlight({
  progress,
  range,
  size,
  viewH = VIEW_H,
  children,
}: {
  progress: SharedValue<number>;
  range: readonly [number, number];
  size: number;
  viewH?: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const [a, b] = range;
    return {
      opacity: interpolate(
        progress.value,
        [a, Math.min(a + 0.04, b), Math.max(b - 0.04, a), b],
        [0, 1, 1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={size} height={(size * viewH) / VIEW_W} viewBox={`0 0 ${VIEW_W} ${viewH}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** One entry of the rotating caption strip under a diagram. */
function PhaseCaption({
  progress,
  range,
  label,
  color,
}: {
  progress: SharedValue<number>;
  range: readonly [number, number];
  label: string;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const [a, b] = range;
    return {
      opacity: interpolate(
        progress.value,
        [a, Math.min(a + 0.04, b), Math.max(b - 0.04, a), b],
        [0, 1, 1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.caption, style]}>
      <View style={[styles.captionPill, { backgroundColor: color }]}>
        <ThemedText style={styles.badgeText}>{label}</ThemedText>
      </View>
    </Animated.View>
  );
}

/** The lane divider scrolling towards the viewer — your own road speed. */
function ScrollingLaneDashes({
  size,
  viewH = VIEW_H,
  x,
  color,
  durationMs = 800,
}: {
  size: number;
  viewH?: number;
  x: number;
  color: string;
  durationMs?: number;
}) {
  const progress = useLoopProgress(durationMs);
  const scale = size / VIEW_W;
  const period = 26 * scale; // one dash + one gap
  const h = (size * viewH) / VIEW_W;

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * period }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: -period, width: size, height: h + period }, style]}>
      <Svg width={size} height={h + period} viewBox={`0 -26 ${VIEW_W} ${viewH + 26}`}>
        <Line x1={x} y1={-26} x2={x} y2={viewH} stroke={color} strokeWidth={2.5} strokeDasharray="14 12" />
      </Svg>
    </Animated.View>
  );
}

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
      <Rect x={-15.5} y={-17} width={4} height={11} rx={2} fill="#1D2025" />
      <Rect x={11.5} y={-17} width={4} height={11} rx={2} fill="#1D2025" />
      <Rect x={-15.5} y={7} width={4} height={11} rx={2} fill="#1D2025" />
      <Rect x={11.5} y={7} width={4} height={11} rx={2} fill="#1D2025" />
      <Rect x={-13} y={-24} width={26} height={48} rx={7} fill={color} />
      <Rect x={-15.5} y={-13} width={3.5} height={2.5} rx={1} fill={color} />
      <Rect x={12} y={-13} width={3.5} height={2.5} rx={1} fill={color} />
      <Rect x={-9} y={-14} width={18} height={10} rx={2} fill="#ffffff" opacity={0.35} />
      <Rect x={-9} y={8} width={18} height={8} rx={2} fill="#ffffff" opacity={0.25} />
    </G>
  );
}

// --- mirrors: an overtaker tracked from mirror to mirror to blind spot ---

const MIRROR_VIEW_H = 200;
const MIRROR_MS = 9000;

// The overtaker runs up the right-hand lane at a steady closing speed.
const MIRROR_PATH: CarPath = {
  t: [0, 0.04, 0.9, 1],
  x: [152, 152, 152, 152],
  y: [236, 236, -50, -50],
  r: [0, 0, 0, 0],
};
const MIRROR_FADE: FadeTrack = { t: [0, 0.06, 0.86, 0.92, 1], v: [0, 1, 1, 0, 0] };

// Zone shapes, anchored to your car at (88,92). The phase windows below are
// derived from where the overtaker's position actually crosses each shape.
const ZONE_INTERIOR = '88,118 44,200 168,200';
const ZONE_DOOR_RIGHT = '104,76 200,158 136,200';
const ZONE_BLIND_RIGHT = '102,84 200,64 188,136';
const ZONE_DOOR_LEFT = '72,76 -24,158 40,200';
const ZONE_BLIND_LEFT = '74,84 -24,64 -12,136';
const ZONE_WINDSCREEN = '88,64 40,0 178,0';

const PHASE_INTERIOR: [number, number] = [0.08, 0.2];
const PHASE_DOOR: [number, number] = [0.19, 0.39];
const PHASE_BLIND: [number, number] = [0.4, 0.53];
const PHASE_AHEAD: [number, number] = [0.56, 0.86];

export function MirrorZonesDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(MIRROR_MS);
  const svgH = (size * MIRROR_VIEW_H) / VIEW_W;

  return (
    <View style={{ width: size }}>
      <View style={[styles.scene, { width: size, height: svgH }]}>
        <Svg width={size} height={svgH} viewBox={`0 0 ${VIEW_W} ${MIRROR_VIEW_H}`}>
          {/* two-lane road */}
          <Rect x={54} y={0} width={132} height={MIRROR_VIEW_H} fill={theme.roadLine} />
          <Line x1={54} y1={0} x2={54} y2={MIRROR_VIEW_H} stroke={theme.textSecondary} strokeWidth={3} />
          <Line x1={186} y1={0} x2={186} y2={MIRROR_VIEW_H} stroke={theme.textSecondary} strokeWidth={3} />

          {/* what your mirrors cover, at rest */}
          <Polygon points={ZONE_INTERIOR} fill={theme.tint} opacity={0.1} />
          <Polygon points={ZONE_DOOR_RIGHT} fill={theme.tint} opacity={0.1} />
          <Polygon points={ZONE_DOOR_LEFT} fill={theme.tint} opacity={0.1} />
          <Polygon points={ZONE_BLIND_RIGHT} fill={AMBER} opacity={0.16} />
          <Polygon points={ZONE_BLIND_LEFT} fill={AMBER} opacity={0.16} />

          <CarTopDown x={88} y={92} color={theme.tint} />
        </Svg>

        <ScrollingLaneDashes size={size} viewH={MIRROR_VIEW_H} x={120} color={theme.roadDash} />

        {/* each zone lights up while the overtaker is inside it */}
        <ZoneHighlight progress={progress} range={PHASE_INTERIOR} size={size} viewH={MIRROR_VIEW_H}>
          <Polygon points={ZONE_INTERIOR} fill={theme.tint} opacity={0.32} />
        </ZoneHighlight>
        <ZoneHighlight progress={progress} range={PHASE_DOOR} size={size} viewH={MIRROR_VIEW_H}>
          <Polygon points={ZONE_DOOR_RIGHT} fill={theme.tint} opacity={0.32} />
        </ZoneHighlight>
        <ZoneHighlight progress={progress} range={PHASE_BLIND} size={size} viewH={MIRROR_VIEW_H}>
          <Polygon points={ZONE_BLIND_RIGHT} fill={AMBER} opacity={0.5} />
        </ZoneHighlight>
        <ZoneHighlight progress={progress} range={PHASE_AHEAD} size={size} viewH={MIRROR_VIEW_H}>
          <Polygon points={ZONE_WINDSCREEN} fill={theme.success} opacity={0.28} />
        </ZoneHighlight>

        <AnimatedCar
          progress={progress}
          durationMs={MIRROR_MS}
          path={MIRROR_PATH}
          fade={MIRROR_FADE}
          scale={scale}
          color={theme.textSecondary}
        />
      </View>

      {/* running commentary, kept clear of the picture */}
      <View style={styles.captionStrip}>
        <PhaseCaption progress={progress} range={PHASE_INTERIOR} label="behind you — interior mirror" color={theme.tint} />
        <PhaseCaption progress={progress} range={PHASE_DOOR} label="closing — right door mirror" color={theme.tint} />
        <PhaseCaption progress={progress} range={PHASE_BLIND} label="alongside — blind spot, shoulder check!" color={AMBER} />
        <PhaseCaption progress={progress} range={PHASE_AHEAD} label="past you — in the windscreen" color={theme.success} />
      </View>
    </View>
  );
}

// --- parallel parking ---

const PARALLEL_PATH: CarPath = {
  t: [0, 0.2, 0.3, 0.48, 0.64, 0.9, 1],
  x: [138, 138, 138, 158, 182, 182, 182],
  y: [186, 52, 52, 96, 140, 140, 140],
  r: [0, 0, 0, -38, 0, 0, 0],
};
const PARALLEL_FADE: FadeTrack = { t: [0, 0.05, 0.88, 0.95, 1], v: [0, 1, 1, 0, 0] };
const PARALLEL_MS = 9000;

export function ParallelParkDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(PARALLEL_MS);

  return (
    <DiagramShell size={size}>
      <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
        {/* kerb */}
        <Line x1={206} y1={0} x2={206} y2={180} stroke={theme.textSecondary} strokeWidth={4} />
        {/* lead car parked at the kerb */}
        <CarTopDown x={182} y={44} color={theme.textSecondary} opacity={0.55} />

        {/* key positions, kept faint under the moving car */}
        <CarTopDown x={138} y={52} color={theme.tint} opacity={0.18} />
        <CarTopDown x={158} y={96} color={theme.tint} opacity={0.18} rotate={-38} />
        <CarTopDown x={182} y={140} color={theme.tint} opacity={0.18} />

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
      <AnimatedCar
        progress={progress}
        durationMs={PARALLEL_MS}
        path={PARALLEL_PATH}
        fade={PARALLEL_FADE}
        scale={scale}
        color={theme.tint}
        indicatorLeft={[[0.06, 0.3]]}
        brake={[[0.2, 0.3], [0.64, 0.74]]}
        reverse={[[0.3, 0.64]]}
      />
    </DiagramShell>
  );
}

// --- bay parking ---

const BAY_PATH: CarPath = {
  t: [0, 0.3, 0.4, 0.48, 0.56, 0.64, 0.72, 0.9, 1],
  x: [-16, 150, 150, 138, 124, 120, 120, 120, 120],
  y: [44, 44, 44, 50, 72, 100, 146, 146, 146],
  r: [90, 90, 90, 62, 28, 8, 0, 0, 0],
};
const BAY_FADE: FadeTrack = { t: [0, 0.05, 0.88, 0.95, 1], v: [0, 1, 1, 0, 0] };
const BAY_MS = 10000;

export function BayParkDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(BAY_MS);

  return (
    <DiagramShell size={size}>
      <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
        {/* bay lines */}
        {[60, 100, 140, 180].map((x) => (
          <Line key={x} x1={x} y1={112} x2={x} y2={178} stroke={theme.textSecondary} strokeWidth={3} />
        ))}
        {/* a parked neighbour */}
        <CarTopDown x={160} y={146} color={theme.textSecondary} opacity={0.5} />

        {/* target position, kept faint under the moving car */}
        <CarTopDown x={120} y={144} color={theme.tint} opacity={0.18} />

        {/* the path */}
        <Path
          d="M150,52 C138,66 124,74 120,104"
          stroke={theme.tint}
          strokeWidth={2.5}
          strokeDasharray="6 5"
          fill="none"
        />
        <Polygon points="120,116 113,104 127,104" fill={theme.tint} />

        <SvgText x={28} y={24} fontSize={10} fontWeight="bold" fill={theme.tint}>
          1. drive past, shoulder level with the far line
        </SvgText>
        <SvgText x={132} y={98} fontSize={10} fontWeight="bold" fill={theme.tint}>
          2. full lock, creep back
        </SvgText>
      </Svg>
      <AnimatedCar
        progress={progress}
        durationMs={BAY_MS}
        path={BAY_PATH}
        fade={BAY_FADE}
        scale={scale}
        color={theme.tint}
        brake={[[0.3, 0.4], [0.72, 0.8]]}
        reverse={[[0.4, 0.72]]}
      />
    </DiagramShell>
  );
}

// --- roundabout: full lap to the third exit, with signal changes ---

const ROUNDABOUT_PATH: CarPath = {
  t: [0, 0.13, 0.19, 0.25, 0.32, 0.39, 0.46, 0.53, 0.6, 0.66, 0.72, 0.78, 1],
  x: [114, 114, 112, 96, 75, 75, 96, 120, 144, 162, 188, 232, 232],
  y: [186, 142, 130, 128, 102, 70, 44, 38, 44, 62, 80, 86, 86],
  r: [0, 0, -35, -60, -20, 20, 60, 90, 120, 140, 108, 90, 90],
};
const ROUNDABOUT_FADE: FadeTrack = { t: [0, 0.05, 0.78, 0.85, 1], v: [0, 1, 1, 0, 0] };
const ROUNDABOUT_MS = 10000;

export function RoundaboutDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(ROUNDABOUT_MS);

  return (
    <DiagramShell size={size}>
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
          opacity={0.5}
        />
        <Polygon points="220,86 206,79 206,93" fill={theme.tint} />

        <SvgText x={10} y={16} fontSize={10} fontWeight="bold" fill={theme.tint}>
          signal right on approach,
        </SvgText>
        <SvgText x={10} y={28} fontSize={10} fontWeight="bold" fill={theme.tint}>
          left after the exit before yours
        </SvgText>
      </Svg>
      <AnimatedCar
        progress={progress}
        durationMs={ROUNDABOUT_MS}
        path={ROUNDABOUT_PATH}
        fade={ROUNDABOUT_FADE}
        scale={scale}
        color={theme.tint}
        indicatorRight={[[0.02, 0.46]]}
        indicatorLeft={[[0.53, 0.78]]}
      />
    </DiagramShell>
  );
}

// --- pull up on the right ---

const PULL_UP_RIGHT_PATH: CarPath = {
  t: [0, 0.14, 0.2, 0.27, 0.34, 0.4, 0.52, 0.68, 0.9, 1],
  x: [92, 146, 148, 158, 168, 170, 170, 170, 170, 170],
  y: [186, 148, 128, 104, 82, 70, 70, 128, 128, 128],
  r: [0, 0, 18, 30, 14, 0, 0, 0, 0, 0],
};
const PULL_UP_RIGHT_FADE: FadeTrack = { t: [0, 0.05, 0.88, 0.95, 1], v: [0, 1, 1, 0, 0] };
const PULL_UP_RIGHT_MS = 9000;

export function PullUpRightDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(PULL_UP_RIGHT_MS);

  return (
    <DiagramShell size={size}>
      <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
        {/* kerbs and centre line */}
        <Line x1={60} y1={0} x2={60} y2={180} stroke={theme.textSecondary} strokeWidth={4} />
        <Line x1={196} y1={0} x2={196} y2={180} stroke={theme.textSecondary} strokeWidth={4} />
        <Line x1={128} y1={0} x2={128} y2={180} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="10 8" />

        {/* key positions, kept faint under the moving car */}
        <CarTopDown x={170} y={70} color={theme.tint} opacity={0.18} />
        <CarTopDown x={170} y={128} color={theme.tint} opacity={0.18} />

        {/* crossing path, then the reverse */}
        <Path d="M92,124 C92,84 150,110 168,94" stroke={theme.tint} strokeWidth={2.5} strokeDasharray="6 5" fill="none" />
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
      <AnimatedCar
        progress={progress}
        durationMs={PULL_UP_RIGHT_MS}
        path={PULL_UP_RIGHT_PATH}
        fade={PULL_UP_RIGHT_FADE}
        scale={scale}
        color={theme.tint}
        indicatorRight={[[0.03, 0.38]]}
        brake={[[0.36, 0.52], [0.68, 0.78]]}
        reverse={[[0.52, 0.68]]}
      />
    </DiagramShell>
  );
}

// --- the emergency stop ---

const EMERGENCY_PATH: CarPath = {
  t: [0, 0.35, 0.42, 0.49, 0.56, 0.62, 0.9, 1],
  x: [100, 100, 100, 100, 100, 100, 100, 100],
  y: [200, 118, 94, 76, 64, 58, 58, 58],
  r: [0, 0, 0, 0, 0, 0, 0, 0],
};
const EMERGENCY_FADE: FadeTrack = { t: [0, 0.05, 0.88, 0.95, 1], v: [0, 1, 1, 0, 0] };
const EMERGENCY_MS = 6500;

export function EmergencyStopDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(EMERGENCY_MS);

  return (
    <DiagramShell size={size}>
      <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
        {/* kerbs and centre line */}
        <Line x1={60} y1={0} x2={60} y2={180} stroke={theme.textSecondary} strokeWidth={4} />
        <Line x1={196} y1={0} x2={196} y2={180} stroke={theme.textSecondary} strokeWidth={4} />
        <Line x1={128} y1={0} x2={128} y2={180} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="10 8" />

        {/* where the signal comes and where you finish */}
        <Line x1={64} y1={118} x2={124} y2={118} stroke={AMBER} strokeWidth={2} strokeDasharray="4 4" />
        <Line x1={64} y1={34} x2={124} y2={34} stroke={theme.success} strokeWidth={2} strokeDasharray="4 4" />

        <SvgText x={134} y={122} fontSize={10} fontWeight="bold" fill={AMBER}>
          signal — brake firmly
        </SvgText>
        <SvgText x={134} y={38} fontSize={10} fontWeight="bold" fill={theme.success}>
          stopped, under control
        </SvgText>
        <SvgText x={134} y={80} fontSize={10} fontWeight="bold" fill={theme.textSecondary}>
          clutch down just
        </SvgText>
        <SvgText x={134} y={92} fontSize={10} fontWeight="bold" fill={theme.textSecondary}>
          before you stop
        </SvgText>
      </Svg>
      <AnimatedCar
        progress={progress}
        durationMs={EMERGENCY_MS}
        path={EMERGENCY_PATH}
        fade={EMERGENCY_FADE}
        scale={scale}
        color={theme.tint}
        brake={[[0.35, 0.8]]}
      />
      <FadeBadge
        progress={progress}
        range={[0.33, 0.48]}
        x={22}
        y={126}
        scale={scale}
        label="brake!"
        color="#E5484D"
      />
    </DiagramShell>
  );
}

// --- hill starts (side view) ---

// Slope surface runs (10,160) → (230,80); the car sits ~14 units above it.
const HILL_PATH: CarPath = {
  t: [0, 0.34, 0.4, 0.78, 0.9, 1],
  x: [62, 62, 64, 196, 196, 196],
  y: [127, 127, 126, 78, 78, 78],
  r: [-20, -20, -20, -20, -20, -20],
};
const HILL_MS = 8000;

export function HillStartDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(HILL_MS);
  const w = 52 * scale;
  const h = 24 * scale;

  const carStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: interpolate(p, HILL_PATH.t, HILL_PATH.x, Extrapolation.CLAMP) * scale },
        { translateY: interpolate(p, HILL_PATH.t, HILL_PATH.y, Extrapolation.CLAMP) * scale },
        { rotate: '-20deg' },
      ],
    };
  });

  return (
    <DiagramShell size={size}>
      <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
        {/* the hill */}
        <Polygon points="10,160 230,80 230,180 10,180" fill={theme.roadLine} />
        <Line x1={10} y1={160} x2={230} y2={80} stroke={theme.textSecondary} strokeWidth={3} />

        <SvgText x={16} y={30} fontSize={10} fontWeight="bold" fill={theme.textSecondary}>
          handbrake holds you — no rolling back,
        </SvgText>
        <SvgText x={16} y={42} fontSize={10} fontWeight="bold" fill={theme.textSecondary}>
          bite point takes the weight, then go
        </SvgText>
      </Svg>
      {/* side-view car */}
      <Animated.View
        pointerEvents="none"
        style={[styles.car, { width: w, height: h, left: -w / 2, top: -h / 2 }, carStyle]}>
        <Svg width={w} height={h} viewBox="0 0 52 24">
          <Path d="M4,16 L6,8 Q8,4 14,4 L32,4 Q38,4 42,9 L48,12 Q50,13 50,16 L4,16 Z" fill={theme.tint} />
          <Rect x={16} y={6} width={12} height={7} rx={1.5} fill="#ffffff" opacity={0.4} />
          <Circle cx={13} cy={17} r={5} fill="#16181D" />
          <Circle cx={39} cy={17} r={5} fill="#16181D" />
          <Circle cx={13} cy={17} r={2} fill="#9AA1AC" />
          <Circle cx={39} cy={17} r={2} fill="#9AA1AC" />
        </Svg>
      </Animated.View>
      <FadeBadge progress={progress} range={[0.02, 0.2]} x={96} y={140} scale={scale} label="handbrake on" color="#E5484D" />
      <FadeBadge progress={progress} range={[0.2, 0.38]} x={96} y={140} scale={scale} label="find the bite" color={AMBER} />
      <FadeBadge progress={progress} range={[0.4, 0.62]} x={96} y={140} scale={scale} label="release & go" color={theme.success} />
    </DiagramShell>
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
    case 'emergencyStop':
      return <EmergencyStopDiagram size={size} />;
    case 'hillStart':
      return <HillStartDiagram size={size} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  car: {
    position: 'absolute',
  },
  light: {
    position: 'absolute',
  },
  badge: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  scene: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  captionStrip: {
    height: 34,
    marginTop: 6,
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
