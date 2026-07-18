import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

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
  sizeScale = 1,
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
  /** Shrinks the sprite (not the path) so the car suits the diagram's lane widths. */
  sizeScale?: number;
  color: string;
  indicatorLeft?: LightRanges;
  indicatorRight?: LightRanges;
  brake?: LightRanges;
  reverse?: LightRanges;
}) {
  // Sprite canvas is 32 wide so the tyres can poke out past the 26-wide body.
  const spriteScale = scale * sizeScale;
  const w = 32 * spriteScale;
  const h = 48 * spriteScale;
  const dot = Math.max(3, 6 * spriteScale);
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
  carScale = 1,
}: {
  x: number;
  y: number;
  color: string;
  opacity?: number;
  rotate?: number;
  carScale?: number;
}) {
  // A 26×48 car drawn about its centre for easy rotation.
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${carScale})`} opacity={opacity}>
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

// --- parallel parking: reverse into a gap at the left kerb ---

const PP_VIEW_H = 200;
const PP_MS = 12000;
const PP_CAR_SIZE = 0.8;

// Pull up level with the lead car, reverse straight to its bumper, full
// left lock to swing the tail in, right lock to straighten, then a nudge
// forward to centre the car in the gap.
const PARALLEL_PATH: CarPath = {
  t: [0, 0.05, 0.12, 0.19, 0.22, 0.3, 0.35, 0.4, 0.46, 0.52, 0.58, 0.64, 0.67, 0.73, 0.9, 1],
  x: [78, 78, 78, 78, 78, 78, 78, 72, 64, 57, 53, 51, 51, 51, 51, 51],
  y: [212, 212, 120, 68, 60, 60, 70, 80, 91, 101, 110, 117, 119, 104, 104, 104],
  r: [0, 0, 0, 0, 0, 0, 0, 15, 30, 38, 20, 6, 0, 0, 0, 0],
};
const PARALLEL_FADE: FadeTrack = { t: [0, 0.05, 0.88, 0.94, 1], v: [0, 1, 1, 0, 0] };

const PP_PHASE_LEVEL: [number, number] = [0.05, 0.2];
const PP_PHASE_BACK: [number, number] = [0.23, 0.34];
const PP_PHASE_SWING: [number, number] = [0.36, 0.53];
const PP_PHASE_STRAIGHTEN: [number, number] = [0.55, 0.68];
const PP_PHASE_DONE: [number, number] = [0.72, 0.88];

export function ParallelParkDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(PP_MS);
  const svgH = (size * PP_VIEW_H) / VIEW_W;

  return (
    <View style={{ width: size }}>
      <View style={[styles.scene, { width: size, height: svgH }]}>
        <Svg width={size} height={svgH} viewBox={`0 0 ${VIEW_W} ${PP_VIEW_H}`}>
          {/* two-way street, kerbs both sides */}
          <Rect x={36} y={0} width={168} height={PP_VIEW_H} fill={theme.roadLine} />
          <Line x1={36} y1={0} x2={36} y2={PP_VIEW_H} stroke={theme.textSecondary} strokeWidth={3} />
          <Line x1={204} y1={0} x2={204} y2={PP_VIEW_H} stroke={theme.textSecondary} strokeWidth={3} />
          <Line
            x1={128}
            y1={0}
            x2={128}
            y2={PP_VIEW_H}
            stroke={theme.roadDash}
            strokeWidth={2}
            strokeDasharray="10 9"
            opacity={0.8}
          />

          {/* the gap: a car parked ahead of it and one behind */}
          <CarTopDown x={49} y={60} color={theme.textSecondary} opacity={0.6} carScale={PP_CAR_SIZE} />
          <CarTopDown x={49} y={150} color={theme.textSecondary} opacity={0.6} carScale={PP_CAR_SIZE} />
        </Svg>

        <AnimatedCar
          progress={progress}
          durationMs={PP_MS}
          path={PARALLEL_PATH}
          fade={PARALLEL_FADE}
          scale={scale}
          sizeScale={PP_CAR_SIZE}
          color={theme.tint}
          indicatorLeft={[[0.04, 0.28]]}
          brake={[[0.2, 0.32], [0.75, 0.88]]}
          reverse={[[0.32, 0.67]]}
        />
      </View>

      <View style={styles.captionStrip}>
        <PhaseCaption progress={progress} range={PP_PHASE_LEVEL} label="signal left, pull up level — a metre out" color={theme.tint} />
        <PhaseCaption progress={progress} range={PP_PHASE_BACK} label="all-round check, reverse to its rear bumper" color={theme.tint} />
        <PhaseCaption progress={progress} range={PP_PHASE_SWING} label="full left lock — swing the tail in" color={theme.tint} />
        <PhaseCaption progress={progress} range={PP_PHASE_STRAIGHTEN} label="right lock to straighten as you tuck in" color={theme.tint} />
        <PhaseCaption progress={progress} range={PP_PHASE_DONE} label="settle forward — snug to the kerb, done" color={theme.success} />
      </View>
    </View>
  );
}

// --- bay parking: the three-white-lines reference ---

const BAY_MS = 12000;
const BAY_CAR_SIZE = 0.8;

// Bay lines at x = 60/100/140/180. Reversing into the bay at 100–140 from
// the left, you count its near line (100 = 1), its far line (140 = 2) and
// the next bay's far line (180 = 3) past your shoulder. Stop level with
// line 3, full left lock, and the quarter-circle drops you into the bay.
const BAY_LINE_XS = [60, 100, 140, 180];
const BAY_TARGET_X = 120; // centre of the empty bay
const BAY_AISLE_Y = 56;

/** Quarter-circle from the aisle (heading east) into the bay (heading south). */
const BAY_PATH: CarPath = (() => {
  const t: number[] = [];
  const x: number[] = [];
  const y: number[] = [];
  const r: number[] = [];
  const add = (pt: number, px: number, py: number, pr: number) => {
    t.push(pt);
    x.push(px);
    y.push(py);
    r.push(pr);
  };
  add(0, -24, BAY_AISLE_Y, 90);
  add(0.04, -24, BAY_AISLE_Y, 90);
  add(0.14, 100, BAY_AISLE_Y, 90); // line 1 at the shoulder
  add(0.2, 140, BAY_AISLE_Y, 90); // line 2
  add(0.27, 180, BAY_AISLE_Y, 90); // line 3 — stop here
  add(0.4, 180, BAY_AISLE_Y, 90); // pause: all-round check
  // Full left lock, reversing. The turn centre sits square to the car's
  // axis — directly south of it — so the car tracks backwards (west) while
  // the tail swings into the bay. Heading is the arc angle + 180°, which
  // takes the nose from east (90°) round to north (0°), pointing back out
  // at the aisle.
  const px = 180;
  const py = BAY_AISLE_Y + 60;
  const radius = 60;
  for (let i = 0; i <= 8; i++) {
    const a = -90 - (i / 8) * 90; // -90° (start, north of centre) → -180° (west of it)
    const rad = (a * Math.PI) / 180;
    add(0.42 + (0.22 * i) / 8, px + radius * Math.cos(rad), py + radius * Math.sin(rad), a + 180);
  }
  // Straighten up and creep back until centred between the lines.
  add(0.78, BAY_TARGET_X, 144, 0);
  add(0.92, BAY_TARGET_X, 144, 0);
  add(1, BAY_TARGET_X, 144, 0);
  return { t, x, y, r };
})();
const BAY_FADE: FadeTrack = { t: [0, 0.04, 0.9, 0.96, 1], v: [0, 1, 1, 0, 0] };

const BAY_PHASE_COUNT: [number, number] = [0.06, 0.26];
const BAY_PHASE_STOP: [number, number] = [0.28, 0.4];
const BAY_PHASE_SWING: [number, number] = [0.42, 0.62];
const BAY_PHASE_CREEP: [number, number] = [0.64, 0.76];
const BAY_PHASE_DONE: [number, number] = [0.79, 0.9];

/** The "1 · 2 · 3" markers that light up as each line passes your shoulder. */
const BAY_COUNT_BADGES: { line: number; label: string; range: [number, number] }[] = [
  { line: 100, label: '1', range: [0.12, 0.34] },
  { line: 140, label: '2', range: [0.18, 0.34] },
  { line: 180, label: '3', range: [0.25, 0.42] },
];

export function BayParkDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(BAY_MS);
  const svgH = (size * VIEW_H) / VIEW_W;

  return (
    <View style={{ width: size }}>
      <View style={[styles.scene, { width: size, height: svgH }]}>
        <Svg width={size} height={svgH} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          {/* car-park tarmac */}
          <Rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill={theme.roadLine} />

          {/* painted aisle arrow */}
          <Rect x={12} y={78} width={14} height={5} fill={theme.roadDash} opacity={0.75} />
          <Polygon points="26,73 26,88 38,80.5" fill={theme.roadDash} opacity={0.75} />

          {/* the bays */}
          {BAY_LINE_XS.map((x) => (
            <Line key={x} x1={x} y1={112} x2={x} y2={176} stroke={theme.roadDash} strokeWidth={2.5} />
          ))}
          <Line x1={59} y1={176} x2={181} y2={176} stroke={theme.roadDash} strokeWidth={2.5} />

          {/* neighbours either side of the empty bay */}
          <CarTopDown x={80} y={144} color={theme.textSecondary} opacity={0.6} carScale={BAY_CAR_SIZE} />
          <CarTopDown x={160} y={144} color={theme.textSecondary} opacity={0.6} carScale={BAY_CAR_SIZE} />
        </Svg>

        {/* count the three lines off your shoulder as you pass them */}
        {BAY_COUNT_BADGES.map((badge) => (
          <FadeBadge
            key={badge.label}
            progress={progress}
            range={badge.range}
            x={badge.line - 6}
            y={96}
            scale={scale}
            label={badge.label}
            color={badge.label === '3' ? theme.success : theme.tint}
          />
        ))}

        <AnimatedCar
          progress={progress}
          durationMs={BAY_MS}
          path={BAY_PATH}
          fade={BAY_FADE}
          scale={scale}
          sizeScale={BAY_CAR_SIZE}
          color={theme.tint}
          brake={[[0.24, 0.42], [0.78, 0.9]]}
          reverse={[[0.42, 0.78]]}
        />
      </View>

      <View style={styles.captionStrip}>
        <PhaseCaption progress={progress} range={BAY_PHASE_COUNT} label="creep past, counting the lines: 1 … 2 … 3" color={theme.tint} />
        <PhaseCaption progress={progress} range={BAY_PHASE_STOP} label="stop level with line 3 — all-round check" color={theme.success} />
        <PhaseCaption progress={progress} range={BAY_PHASE_SWING} label="full left lock, reverse — the bay comes to you" color={theme.tint} />
        <PhaseCaption progress={progress} range={BAY_PHASE_CREEP} label="lines parallel in both mirrors — straighten up" color={theme.tint} />
        <PhaseCaption progress={progress} range={BAY_PHASE_DONE} label="creep back inside the lines — handbrake on" color={theme.success} />
      </View>
    </View>
  );
}

// --- roundabout: give way, join behind traffic, take the third exit ---

const RB_MS = 11000;
const RB_CENTRE_X = 120;
const RB_CENTRE_Y = 86;
/**
 * Arms are two 18-unit lanes; a car is about half a lane wide, hence 0.35.
 *
 * The circulating carriageway is a SINGLE wide lane. A roundabout this
 * size cannot carry two: the lane centres would sit 18 units apart with
 * only ~30 units of arc to cross between the north arm and the exit, so
 * moving out demanded a ~30° crab which then had to be unwound and
 * immediately reversed into the exit turn — the swerve. Small roundabouts
 * are single-lane in life for the same reason.
 */
const RB_CAR_SIZE = 0.35;
const RB_ISLAND_R = 30;
const RB_RING_W = 36; // circulating carriageway, comfortably wider than a lane
/** Centreline of the circulating carriageway; its outer edge is at 66. */
const RB_LANE_R = RB_ISLAND_R + RB_RING_W / 2; // 48
/** Entry lane centre of the south arm (northbound traffic keeps west). */
const RB_ENTRY_X = 111;
/** Where the south arm meets the circulating carriageway. */
const RB_GIVE_WAY_Y = 154;

/** Point at `theta` degrees (0° = east, 90° = south) and radius `radius`. */
function ringPoint(theta: number, radius: number): { x: number; y: number } {
  const rad = (theta * Math.PI) / 180;
  return { x: RB_CENTRE_X + radius * Math.cos(rad), y: RB_CENTRE_Y + radius * Math.sin(rad) };
}

/**
 * Gives every sample the heading it is actually travelling in, so the car
 * cannot slide sideways — hand-written rotations always drift out of step
 * with the positions sooner or later.
 *
 * Stationary samples inherit the heading of the next real movement (so a
 * waiting car faces where it is about to go), and the series is unwrapped
 * so interpolation never takes the long way round a turn.
 */
function withDerivedHeadings(pts: { t: number; x: number; y: number }[]): CarPath {
  const n = pts.length;
  const raw: (number | null)[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    let j = i + 1;
    while (j < n && Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y) < 0.01) j++;
    if (j < n) {
      const dx = pts[j].x - pts[i].x;
      const dy = pts[j].y - pts[i].y;
      raw[i] = (Math.atan2(dx, -dy) * 180) / Math.PI;
    }
  }
  // The tail (and any final stationary hold) keeps the last real heading.
  let last = 0;
  for (let i = 0; i < n; i++) {
    if (raw[i] === null) raw[i] = last;
    else last = raw[i] as number;
  }
  const r: number[] = [raw[0] as number];
  for (let i = 1; i < n; i++) {
    let a = raw[i] as number;
    while (a - r[i - 1] > 180) a -= 360;
    while (a - r[i - 1] < -180) a += 360;
    r.push(a);
  }
  return { t: pts.map((p) => p.t), x: pts.map((p) => p.x), y: pts.map((p) => p.y), r };
}

// Geometry of the join. Turning in with a 22-unit radius from the entry
// lane lands the car tangent to the inner circulating lane at θ=117.3° —
// solved so the entry arc's centre, the join, and the island's centre all
// line up. That tangency is what removes the kink at the mouth.
const RB_ENTRY_R = 18;
const RB_ENTRY_PIVOT_X = 93;
const RB_ENTRY_PIVOT_Y = 146.2;
const RB_JOIN_THETA = 114.2;
const RB_EXIT_THETA = 320;
/** Progress at which you draw level with the north arm — the exit before yours. */
const RB_T_PAST_NORTH = 0.676;

/** One point on a cubic Bézier. */
function bezier(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  u: number
): { x: number; y: number } {
  const m = 1 - u;
  const a = m * m * m;
  const b = 3 * m * m * u;
  const c = 3 * m * u * u;
  const d = u * u * u;
  return {
    x: a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    y: a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  };
}

/**
 * Your run: up the left of the south arm, stop at the give-way line, turn
 * in tangent to the inner lane and hold it round (right-turn discipline),
 * then ease out to the outer lane after the north arm and peel off into
 * the east arm — keeping left as you leave. Positions only; the headings
 * are derived from them.
 */
const ROUNDABOUT_YOU: CarPath = (() => {
  const pts: { t: number; x: number; y: number }[] = [];
  const add = (t: number, x: number, y: number) => pts.push({ t, x, y });

  add(0, RB_ENTRY_X, 210);
  add(0.06, RB_ENTRY_X, 188);
  add(0.13, RB_ENTRY_X, 168);
  add(0.18, RB_ENTRY_X, 162.4); // nose on the give-way line, clear of the ring
  add(0.34, RB_ENTRY_X, 162.4); // holding for the gap
  add(0.4, RB_ENTRY_X, RB_ENTRY_PIVOT_Y); // rolling into the mouth

  // Turning in, tangent to the circulating lane at the far end.
  for (let i = 1; i <= 6; i++) {
    const a = ((RB_JOIN_THETA - 180) * i) / 6;
    const rad = (a * Math.PI) / 180;
    add(
      0.4 + (0.08 * i) / 6,
      RB_ENTRY_PIVOT_X + RB_ENTRY_R * Math.cos(rad),
      RB_ENTRY_PIVOT_Y + RB_ENTRY_R * Math.sin(rad)
    );
  }

  // Round the island at a steady radius — one lane, so no shuffling about.
  for (let theta = RB_JOIN_THETA + 4; theta <= RB_EXIT_THETA; theta += 4) {
    const p = ringPoint(theta, RB_LANE_R);
    add(0.48 + (0.26 * (theta - RB_JOIN_THETA)) / (RB_EXIT_THETA - RB_JOIN_THETA), p.x, p.y);
  }

  // Peel off into the east arm. Driving east you keep left, which here is
  // the NORTH half of the arm (y 64–86), so finish on its centreline at 75.
  const exitStart = ringPoint(RB_EXIT_THETA, RB_LANE_R);
  for (let i = 1; i <= 6; i++) {
    const p = bezier([exitStart.x, exitStart.y], [168.4, 68.9], [178, 77], [196, 77], i / 6);
    add(0.74 + (0.1 * i) / 6, p.x, p.y);
  }
  add(0.9, 240, 77);
  add(1, 240, 77);
  return withDerivedHeadings(pts);
})();

// Ambient traffic in the outer lane: two steady laps per cycle (an exact
// number, so the loop restart is seamless), timed to cross your bow at
// t≈0.26 — right while you sit at the line.
const ROUNDABOUT_TRAFFIC: CarPath = (() => {
  const pts: { t: number; x: number; y: number }[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const p = ringPoint(255.6 + 720 * t, RB_LANE_R);
    pts.push({ t, x: p.x, y: p.y });
  }
  return withDerivedHeadings(pts);
})();

const ROUNDABOUT_FADE: FadeTrack = { t: [0, 0.04, 0.86, 0.94, 1], v: [0, 1, 1, 0, 0] };

const RB_PHASE_APPROACH: [number, number] = [0.03, 0.16];
const RB_PHASE_GIVE_WAY: [number, number] = [0.19, 0.33];
const RB_PHASE_JOIN: [number, number] = [0.37, 0.62];
const RB_PHASE_EXIT: [number, number] = [0.66, 0.86];

export function RoundaboutDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(RB_MS);
  const svgH = (size * VIEW_H) / VIEW_W;

  const armCentreLine = { stroke: theme.roadDash, strokeWidth: 2, strokeDasharray: '8 7' } as const;

  return (
    <View style={{ width: size }}>
      <View style={[styles.scene, { width: size, height: svgH }]}>
        <Svg width={size} height={svgH} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          {/* four two-way arms — one 18-unit lane each way, meeting the ring */}
          <Rect x={102} y={150} width={36} height={30} fill={theme.roadLine} />
          <Rect x={102} y={0} width={36} height={22} fill={theme.roadLine} />
          <Rect x={0} y={68} width={56} height={36} fill={theme.roadLine} />
          <Rect x={184} y={68} width={56} height={36} fill={theme.roadLine} />

          {/* centre lines on the arms, stopping short of the junction mouths */}
          <Line x1={120} y1={180} x2={120} y2={158} {...armCentreLine} />
          <Line x1={120} y1={0} x2={120} y2={16} {...armCentreLine} />
          <Line x1={0} y1={86} x2={50} y2={86} {...armCentreLine} />
          <Line x1={190} y1={86} x2={240} y2={86} {...armCentreLine} />

          {/* the circulating carriageway (one wide lane) and island */}
          <Circle
            cx={RB_CENTRE_X}
            cy={RB_CENTRE_Y}
            r={RB_LANE_R}
            fill="none"
            stroke={theme.roadLine}
            strokeWidth={RB_RING_W}
          />
          <Circle cx={RB_CENTRE_X} cy={RB_CENTRE_Y} r={RB_ISLAND_R} fill={theme.backgroundSelected} />
          <Circle cx={RB_CENTRE_X} cy={RB_CENTRE_Y} r={RB_ISLAND_R} fill="none" stroke={theme.roadDash} strokeWidth={1.5} />

          {/* Give-way markings sit just outside the ring, across the lane
              that ENTERS. Driving on the left: northbound keeps west,
              southbound keeps east, eastbound keeps north, westbound keeps
              south. */}
          <Line x1={103} y1={RB_GIVE_WAY_Y} x2={119} y2={RB_GIVE_WAY_Y} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="4 3" />
          <Line x1={103} y1={158} x2={119} y2={158} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="4 3" />
          <Line x1={121} y1={18} x2={137} y2={18} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="4 3" />
          <Line x1={121} y1={14} x2={137} y2={14} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="4 3" />
          <Line x1={52} y1={69} x2={52} y2={85} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="4 3" />
          <Line x1={48} y1={69} x2={48} y2={85} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="4 3" />
          <Line x1={188} y1={87} x2={188} y2={103} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="4 3" />
          <Line x1={192} y1={87} x2={192} y2={103} stroke={theme.roadDash} strokeWidth={2} strokeDasharray="4 3" />
        </Svg>

        <AnimatedCar
          progress={progress}
          durationMs={RB_MS}
          path={ROUNDABOUT_TRAFFIC}
          scale={scale}
          sizeScale={RB_CAR_SIZE}
          color={theme.textSecondary}
        />
        <AnimatedCar
          progress={progress}
          durationMs={RB_MS}
          path={ROUNDABOUT_YOU}
          fade={ROUNDABOUT_FADE}
          scale={scale}
          sizeScale={RB_CAR_SIZE}
          color={theme.tint}
          indicatorRight={[[0.03, RB_T_PAST_NORTH]]}
          indicatorLeft={[[RB_T_PAST_NORTH, 0.9]]}
          brake={[[0.13, 0.36]]}
        />
      </View>

      <View style={styles.captionStrip}>
        <PhaseCaption progress={progress} range={RB_PHASE_APPROACH} label="approach slowly — mirror, signal right" color={theme.tint} />
        <PhaseCaption progress={progress} range={RB_PHASE_GIVE_WAY} label="give way to traffic from the right" color={AMBER} />
        <PhaseCaption progress={progress} range={RB_PHASE_JOIN} label="clear — join, keep the right signal on" color={theme.tint} />
        <PhaseCaption progress={progress} range={RB_PHASE_EXIT} label="past the exit before yours — signal left & leave" color={theme.success} />
      </View>
    </View>
  );
}

// --- pull up on the right: wait for oncoming, cross, reverse back ---

const PUR_VIEW_H = 200;
const PUR_MS = 13000;
const PUR_CAR_SIZE = 0.8;

// Drive up on the left, signal right and hold opposite the space; wait for
// the oncoming car; cross to the right kerb; reverse two car lengths.
//
// The crossing is a true S-curve: two tangent arcs of equal radius, the
// first steering right off the kerb and the second steering left to
// straighten alongside the far one. Headings come from each arc's tangent,
// so the car always points where it is actually going.
const PUR_TURN_R = 60.5;

const PULL_UP_RIGHT_PATH: CarPath = (() => {
  const t: number[] = [];
  const x: number[] = [];
  const y: number[] = [];
  const r: number[] = [];
  const add = (pt: number, px: number, py: number, pr: number) => {
    t.push(pt);
    x.push(px);
    y.push(py);
    r.push(pr);
  };
  add(0, 82, 240, 0);
  add(0.04, 82, 230, 0);
  add(0.12, 82, 196, 0);
  add(0.17, 82, 188, 0);
  add(0.2, 82, 186, 0); // stopped, opposite the space
  add(0.34, 82, 186, 0); // waiting for the oncoming car
  // Arc 1 — steer right, pivoting about a centre square to the car.
  for (let i = 0; i <= 6; i++) {
    const a = 180 + (80 * i) / 6;
    const rad = (a * Math.PI) / 180;
    add(0.36 + (0.11 * i) / 6, 142.5 + PUR_TURN_R * Math.cos(rad), 186 + PUR_TURN_R * Math.sin(rad), a - 180);
  }
  // Arc 2 — steer left to straighten up parallel with the right kerb.
  for (let i = 1; i <= 6; i++) {
    const a = 80 - (80 * i) / 6;
    const rad = (a * Math.PI) / 180;
    add(0.47 + (0.11 * i) / 6, 121.5 + PUR_TURN_R * Math.cos(rad), 66.8 + PUR_TURN_R * Math.sin(rad), a);
  }
  add(0.62, 182, 66, 0); // stopped close to the kerb
  add(0.66, 182, 66, 0);
  add(0.76, 182, 110, 0);
  add(0.82, 182, 145, 0); // two car lengths back
  add(0.96, 182, 145, 0);
  add(1, 182, 145, 0);
  return { t, x, y, r };
})();
const PULL_UP_RIGHT_FADE: FadeTrack = { t: [0, 0.04, 0.94, 0.99, 1], v: [0, 1, 1, 0, 0] };

// Oncoming traffic down the right-hand lane — the reason you hold back.
const PUR_ONCOMING: CarPath = {
  t: [0, 0.08, 0.3, 0.45, 1],
  x: [158, 158, 158, 158, 158],
  y: [-40, -40, 240, 340, 340],
  r: [180, 180, 180, 180, 180],
};

const PUR_PHASE_APPROACH: [number, number] = [0.05, 0.18];
const PUR_PHASE_WAIT: [number, number] = [0.2, 0.34];
const PUR_PHASE_CROSS: [number, number] = [0.37, 0.6];
const PUR_PHASE_REVERSE: [number, number] = [0.67, 0.81];
const PUR_PHASE_DONE: [number, number] = [0.84, 0.96];

export function PullUpRightDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(PUR_MS);
  const svgH = (size * PUR_VIEW_H) / VIEW_W;

  return (
    <View style={{ width: size }}>
      <View style={[styles.scene, { width: size, height: svgH }]}>
        <Svg width={size} height={svgH} viewBox={`0 0 ${VIEW_W} ${PUR_VIEW_H}`}>
          {/* two-way street */}
          <Rect x={44} y={0} width={152} height={PUR_VIEW_H} fill={theme.roadLine} />
          <Line x1={44} y1={0} x2={44} y2={PUR_VIEW_H} stroke={theme.textSecondary} strokeWidth={3} />
          <Line x1={196} y1={0} x2={196} y2={PUR_VIEW_H} stroke={theme.textSecondary} strokeWidth={3} />
          <Line
            x1={120}
            y1={0}
            x2={120}
            y2={PUR_VIEW_H}
            stroke={theme.roadDash}
            strokeWidth={2}
            strokeDasharray="10 9"
            opacity={0.8}
          />
        </Svg>

        <AnimatedCar
          progress={progress}
          durationMs={PUR_MS}
          path={PUR_ONCOMING}
          scale={scale}
          sizeScale={PUR_CAR_SIZE}
          color={theme.textSecondary}
        />
        <AnimatedCar
          progress={progress}
          durationMs={PUR_MS}
          path={PULL_UP_RIGHT_PATH}
          fade={PULL_UP_RIGHT_FADE}
          scale={scale}
          sizeScale={PUR_CAR_SIZE}
          color={theme.tint}
          indicatorRight={[[0.05, 0.58]]}
          brake={[[0.14, 0.2], [0.58, 0.68], [0.82, 0.96]]}
          reverse={[[0.68, 0.82]]}
        />
      </View>

      <View style={styles.captionStrip}>
        <PhaseCaption progress={progress} range={PUR_PHASE_APPROACH} label="mirrors, signal right — look well ahead" color={theme.tint} />
        <PhaseCaption progress={progress} range={PUR_PHASE_WAIT} label="hold back — let the oncoming car clear" color={AMBER} />
        <PhaseCaption progress={progress} range={PUR_PHASE_CROSS} label="clear — cross and stop close to the right kerb" color={theme.tint} />
        <PhaseCaption progress={progress} range={PUR_PHASE_REVERSE} label="reverse two car lengths, kerb close on your right" color={theme.tint} />
        <PhaseCaption progress={progress} range={PUR_PHASE_DONE} label="before moving off: all round, right blind spot" color={theme.success} />
      </View>
    </View>
  );
}

// --- the emergency stop: thinking distance, then braking distance ---

const ES_VIEW_H = 300;
const DANGER = '#E5484D';

/**
 * Everything here is drawn to ONE scale, which is what makes the speeds
 * readable. At 2.3 units per metre a real 4.5 m car is ~10 units long, so
 * the sprite runs at 0.22 — small, but honest. (At the old car size the
 * "car" was 17 m long, which made 9 m of thinking distance look like half
 * a car length and every speed look like a crawl.)
 */
const ES_ROAD_M_TO_UNIT = 2.3;
const ES_CAR_SIZE = 0.22;
const ES_LANE_X = 23.5;
const ES_SIGNAL_Y = 268;
const ES_TIME_SCALE = 1.15; // a shade slower than life, for clarity
/** Same run-up time at every speed, so a fast car visibly eats more road. */
const ES_APPROACH_SECONDS = 2.2;

/**
 * Stopping distances on a dry road with good brakes, in metres. Thinking
 * distance scales with speed; braking distance with its square — which is
 * why the bars fan out so sharply.
 */
const ES_STOPPING = [
  { mph: 20, think: 6, brake: 6 },
  { mph: 30, think: 9, brake: 14 },
  { mph: 40, think: 12, brake: 24 },
  { mph: 50, think: 15, brake: 38 },
  { mph: 60, think: 18, brake: 55 },
  { mph: 70, think: 21, brake: 75 },
];
// The road is a thin ribbon now, so the table gets the rest of the width —
// wider bars and roomier rows to tap.
const ES_ROW_Y = [56, 92, 128, 164, 200, 236];
const ES_BAR_X = 112;
const ES_M_TO_UNIT = 1.29; // 96 m (the 70 mph total) fills the bar column

interface EmergencyRun {
  path: CarPath;
  durationMs: number;
  biteY: number;
  stopY: number;
  tSignal: number;
  tBite: number;
  tStop: number;
}

/**
 * Builds the run for one speed, in real units throughout.
 *
 * The approach is at a constant speed; the reaction gap runs at that SAME
 * speed (nothing has happened yet — that is thinking distance); then the
 * car decelerates to rest along s = D·(1−(1−u)²). Giving that curve a
 * duration of 2D/v makes its entry speed exactly the approach speed, so
 * the brakes bite without a jolt. Everything else — where the car stops,
 * how long it takes — falls out of the Highway Code figures themselves.
 */
function buildEmergencyRun(row: { mph: number; think: number; brake: number }): EmergencyRun {
  const v = row.mph * 0.44704; // m/s
  const k = ES_ROAD_M_TO_UNIT;
  const biteY = ES_SIGNAL_Y - row.think * k;
  const stopY = ES_SIGNAL_Y - (row.think + row.brake) * k;

  const approachSec = ES_APPROACH_SECONDS;
  const startY = ES_SIGNAL_Y + v * approachSec * k;
  const thinkSec = row.think / v; // ≈0.67 s at every speed — that's why it scales
  const brakeSec = (2 * row.brake) / v;
  const holdSec = 1.6;
  const totalSec = approachSec + thinkSec + brakeSec + holdSec;

  const t: number[] = [];
  const x: number[] = [];
  const y: number[] = [];
  const r: number[] = [];
  const add = (sec: number, py: number) => {
    t.push(sec / totalSec);
    x.push(ES_LANE_X);
    y.push(py);
    r.push(0);
  };

  add(0, startY);
  add(approachSec, ES_SIGNAL_Y); // the examiner's signal
  add(approachSec + thinkSec, biteY); // reaction over — brakes bite
  for (let i = 1; i <= 8; i++) {
    const u = i / 8;
    add(approachSec + thinkSec + brakeSec * u, biteY - row.brake * k * (1 - (1 - u) * (1 - u)));
  }
  add(totalSec, stopY);

  return {
    path: { t, x, y, r },
    durationMs: totalSec * 1000 * ES_TIME_SCALE,
    biteY,
    stopY,
    tSignal: approachSec / totalSec,
    tBite: (approachSec + thinkSec) / totalSec,
    tStop: (approachSec + thinkSec + brakeSec) / totalSec,
  };
}

// A slower fade-in: at low speeds the car starts near the bottom edge
// rather than off-screen, so it wants easing in rather than popping.
const EMERGENCY_FADE: FadeTrack = { t: [0, 0.07, 0.95, 0.99, 1], v: [0, 1, 1, 0, 0] };

export function EmergencyStopDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const svgH = (size * ES_VIEW_H) / VIEW_W;

  // Tap a row of the table to run the stop at that speed.
  const [mph, setMph] = useState(30);
  const row = ES_STOPPING.find((r) => r.mph === mph) ?? ES_STOPPING[1];
  const run = useMemo(() => buildEmergencyRun(row), [row]);
  const progress = useLoopProgress(run.durationMs);

  const total = row.think + row.brake;
  const thinkBandH = row.think * ES_ROAD_M_TO_UNIT;
  const brakeBandH = row.brake * ES_ROAD_M_TO_UNIT;
  const selectedRowY = ES_ROW_Y[ES_STOPPING.indexOf(row)];

  const phaseThink: [number, number] = [run.tSignal, run.tBite + 0.01];
  const phaseBrake: [number, number] = [run.tBite + 0.02, run.tStop];

  return (
    <View style={{ width: size }}>
      <View style={[styles.scene, { width: size, height: svgH }]}>
        <Svg width={size} height={svgH} viewBox={`0 0 ${VIEW_W} ${ES_VIEW_H}`}>
          {/* a long stretch of two-way street, drawn to the same scale as
              the distances — narrow, because 9 m of road really is narrow */}
          <Rect x={18} y={0} width={22} height={ES_VIEW_H} fill={theme.roadLine} />
          <Line x1={18} y1={0} x2={18} y2={ES_VIEW_H} stroke={theme.textSecondary} strokeWidth={2} />
          <Line x1={40} y1={0} x2={40} y2={ES_VIEW_H} stroke={theme.textSecondary} strokeWidth={2} />
          <Line
            x1={29}
            y1={0}
            x2={29}
            y2={ES_VIEW_H}
            stroke={theme.roadDash}
            strokeWidth={1.5}
            strokeDasharray="8 8"
            opacity={0.8}
          />

          {/* the two distances for the chosen speed, dim until their moment */}
          <Rect x={19} y={run.biteY} width={20} height={thinkBandH} fill={AMBER} opacity={0.2} />
          <Rect x={19} y={run.stopY} width={20} height={brakeBandH} fill={DANGER} opacity={0.18} />
          <Line x1={18} y1={ES_SIGNAL_Y} x2={52} y2={ES_SIGNAL_Y} stroke={AMBER} strokeWidth={1.5} strokeDasharray="4 4" />
          <Line x1={18} y1={run.biteY} x2={52} y2={run.biteY} stroke={theme.textSecondary} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
          <Line x1={18} y1={run.stopY} x2={52} y2={run.stopY} stroke={theme.success} strokeWidth={1.5} strokeDasharray="4 4" />

          {/* dimension brackets, off to the side of the road */}
          <Line x1={48} y1={ES_SIGNAL_Y} x2={48} y2={run.biteY} stroke={AMBER} strokeWidth={1.5} />
          <Line x1={48} y1={run.biteY} x2={48} y2={run.stopY} stroke={DANGER} strokeWidth={1.5} />
          <SvgText x={53} y={run.biteY + thinkBandH / 2 + 3} fontSize={8.5} fontWeight="bold" fill={AMBER}>
            {row.think} m
          </SvgText>
          <SvgText x={53} y={run.stopY + brakeBandH / 2 + 3} fontSize={8.5} fontWeight="bold" fill={DANGER}>
            {row.brake} m
          </SvgText>

          {/* the Highway Code table, alongside */}
          <SvgText x={70} y={20} fontSize={10} fontWeight="bold" fill={theme.text}>
            Stopping distances
          </SvgText>
          <SvgText x={70} y={32} fontSize={7.5} fill={theme.textSecondary}>
            tap a speed — dry road, good brakes
          </SvgText>
          <Rect
            x={66}
            y={selectedRowY - 13}
            width={172}
            height={24}
            rx={5}
            fill={theme.tint}
            opacity={0.14}
            stroke={theme.tint}
            strokeWidth={1}
          />
          {ES_STOPPING.map((r, i) => {
            const y = ES_ROW_Y[i];
            const selected = r.mph === row.mph;
            const thinkW = r.think * ES_M_TO_UNIT;
            const brakeW = r.brake * ES_M_TO_UNIT;
            return (
              <G key={r.mph} opacity={selected ? 1 : 0.55}>
                <SvgText x={72} y={y + 3} fontSize={9.5} fontWeight="bold" fill={theme.text}>
                  {r.mph}
                </SvgText>
                <SvgText x={90} y={y + 3} fontSize={7.5} fill={theme.textSecondary}>
                  {r.think + r.brake} m
                </SvgText>
                <Rect x={ES_BAR_X} y={y - 4} width={thinkW} height={7} rx={1.5} fill={AMBER} />
                <Rect x={ES_BAR_X + thinkW} y={y - 4} width={brakeW} height={7} rx={1.5} fill={DANGER} />
              </G>
            );
          })}
        </Svg>

        {/* thinking distance — the car has not slowed at all yet */}
        <ZoneHighlight progress={progress} range={phaseThink} size={size} viewH={ES_VIEW_H}>
          <Rect x={19} y={run.biteY} width={20} height={thinkBandH} fill={AMBER} opacity={0.55} />
          <Rect x={ES_BAR_X} y={selectedRowY - 4} width={row.think * ES_M_TO_UNIT} height={7} rx={1.5} fill={AMBER} />
        </ZoneHighlight>
        {/* braking distance */}
        <ZoneHighlight progress={progress} range={[run.tBite, run.tStop + 0.02]} size={size} viewH={ES_VIEW_H}>
          <Rect x={19} y={run.stopY} width={20} height={brakeBandH} fill={DANGER} opacity={0.45} />
          <Rect
            x={ES_BAR_X + row.think * ES_M_TO_UNIT}
            y={selectedRowY - 4}
            width={row.brake * ES_M_TO_UNIT}
            height={7}
            rx={1.5}
            fill={DANGER}
          />
        </ZoneHighlight>

        <AnimatedCar
          progress={progress}
          durationMs={run.durationMs}
          path={run.path}
          fade={EMERGENCY_FADE}
          scale={scale}
          sizeScale={ES_CAR_SIZE}
          color={theme.tint}
          brake={[[run.tBite, 0.97]]}
        />
        <FadeBadge
          progress={progress}
          range={[run.tSignal - 0.01, run.tBite + 0.02]}
          x={50}
          y={ES_SIGNAL_Y + 8}
          scale={scale}
          label="STOP!"
          color={DANGER}
        />

        {/* tap targets over the table rows */}
        {ES_STOPPING.map((r, i) => (
          <Pressable
            key={r.mph}
            accessibilityRole="button"
            accessibilityLabel={`Show the stop from ${r.mph} miles per hour`}
            onPress={() => setMph(r.mph)}
            style={{
              position: 'absolute',
              left: 66 * scale,
              top: (ES_ROW_Y[i] - 16) * scale,
              width: 172 * scale,
              height: 32 * scale,
            }}
          />
        ))}
      </View>

      <View style={styles.captionStrip}>
        <PhaseCaption
          progress={progress}
          range={[0.03, run.tSignal - 0.02]}
          label={`${row.mph} mph — both hands, eyes well ahead`}
          color={theme.tint}
        />
        <PhaseCaption
          progress={progress}
          range={phaseThink}
          label={`thinking: ${row.think} m gone before the brakes bite`}
          color={AMBER}
        />
        <PhaseCaption
          progress={progress}
          range={phaseBrake}
          label={`braking: ${row.brake} m more to pull up`}
          color={theme.tint}
        />
        <PhaseCaption
          progress={progress}
          range={[run.tStop + 0.03, 0.96]}
          label={`stopped — ${total} m from ${row.mph} mph`}
          color={theme.success}
        />
      </View>
    </View>
  );
}

// --- hill starts (side view) ---

const HILL_MS = 10000;
const HILL_SLOPE_DEG = -20; // matches the drawn surface, (10,160) → (230,80)
const HILL_HOLD_S = 0.26; // where along the slope the car waits

/**
 * Centre of a car riding square to the slope at fraction `s` along it.
 * The surface runs (10,160) → (230,80); the offset up its normal is set so
 * the tyres sit ON the tarmac rather than floating above it.
 */
function hillPoint(s: number): { x: number; y: number } {
  return { x: 6.5 + 220 * s, y: 150.3 - 80 * s };
}

/**
 * Held on the handbrake, the nose lifts as the clutch takes the weight at
 * the bite point, then the car pulls away — distance growing with the
 * square of time, so it gathers speed instead of sliding off at a
 * constant rate. It never rolls back a millimetre; that's the lesson.
 */
const HILL_PATH: CarPath = (() => {
  const t: number[] = [];
  const x: number[] = [];
  const y: number[] = [];
  const r: number[] = [];
  const add = (pt: number, s: number, pr: number) => {
    const p = hillPoint(s);
    t.push(pt);
    x.push(p.x);
    y.push(p.y);
    r.push(pr);
  };
  add(0, HILL_HOLD_S, HILL_SLOPE_DEG);
  add(0.24, HILL_HOLD_S, HILL_SLOPE_DEG); // handbrake on, gas set
  add(0.3, HILL_HOLD_S, HILL_SLOPE_DEG - 2.5); // bite point — the nose lifts
  add(0.46, HILL_HOLD_S, HILL_SLOPE_DEG - 2.5); // checks, still not moving
  for (let i = 1; i <= 6; i++) {
    const u = i / 6;
    // Nose settles back down as the car gets going.
    add(0.46 + 0.46 * u, HILL_HOLD_S + 0.82 * u * u, HILL_SLOPE_DEG - 2.5 + 2.5 * u);
  }
  return { t, x, y, r };
})();
const HILL_FADE: FadeTrack = { t: [0, 0.04, 0.84, 0.93, 1], v: [0, 1, 1, 0, 0] };

const HILL_PHASE_SET: [number, number] = [0.03, 0.23];
const HILL_PHASE_BITE: [number, number] = [0.26, 0.42];
const HILL_PHASE_CHECK: [number, number] = [0.44, 0.56];
const HILL_PHASE_AWAY: [number, number] = [0.6, 0.85];

export function HillStartDiagram({ size = 260 }: { size?: number }) {
  const theme = useTheme();
  const scale = size / VIEW_W;
  const progress = useLoopProgress(HILL_MS);
  const svgH = size * 0.75;
  // Sprite is 52×26; keep that ratio exactly or the car distorts.
  const w = 52 * scale * 0.92;
  const h = 26 * scale * 0.92;

  const carStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, HILL_FADE.t, HILL_FADE.v, Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(p, HILL_PATH.t, HILL_PATH.x, Extrapolation.CLAMP) * scale },
        { translateY: interpolate(p, HILL_PATH.t, HILL_PATH.y, Extrapolation.CLAMP) * scale },
        { rotate: `${interpolate(p, HILL_PATH.t, HILL_PATH.r, Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  // A red glow behind the rear wheel while the handbrake is holding it.
  const holdStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.04, 0.5, 0.56], [0, 1, 1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={{ width: size }}>
      <View style={[styles.scene, { width: size, height: svgH }]}>
        <Svg width={size} height={svgH} viewBox="0 0 240 180">
          {/* earth under the road, with the verge showing at the crest */}
          <Polygon points="0,163 240,76 240,180 0,180" fill={theme.backgroundSelected} />
          {/* tarmac */}
          <Polygon points="0,163 240,76 240,90 0,177" fill={theme.roadLine} />
          <Line x1={0} y1={163} x2={240} y2={76} stroke={theme.textSecondary} strokeWidth={2} />
          <Line x1={0} y1={177} x2={240} y2={90} stroke={theme.textSecondary} strokeWidth={1} opacity={0.45} />
          {/* kerb stones along the near edge */}
          {Array.from({ length: 13 }, (_, i) => {
            const x = i * 19;
            return (
              <Line
                key={x}
                x1={x}
                y1={177 - (x * 87) / 240}
                x2={x + 12}
                y2={177 - ((x + 12) * 87) / 240}
                stroke={theme.roadDash}
                strokeWidth={2.5}
                opacity={0.5}
              />
            );
          })}
        </Svg>

        {/* the car, held on the handbrake — it never rolls back */}
        <Animated.View
          pointerEvents="none"
          style={[styles.car, { width: w, height: h, left: -w / 2, top: -h / 2 }, carStyle]}>
          <Svg width={w} height={h} viewBox="0 0 52 26">
            {/* contact shadow */}
            <Ellipse cx={26} cy={24.4} rx={21} ry={1.5} fill="#000000" opacity={0.16} />
            {/* body: boot, roofline, windscreen, bonnet, nose */}
            <Path
              d="M4,18 L4,12.5 Q4.2,9.6 8,9 L16.5,4.6 Q17.6,4 19,4 L29,4 Q30.8,4 31.8,4.9
                 L37.5,9 L45.5,10.4 Q48.6,11 49.4,13.6 L49.6,18 Z"
              fill={theme.tint}
            />
            {/* glass, split by the B-pillar */}
            <Path d="M10.6,8.7 L17.6,5.2 L20.2,5.2 L20.2,8.7 Z" fill="#ffffff" opacity={0.42} />
            <Path d="M22,5.2 L28.8,5.2 L33.6,8.7 L22,8.7 Z" fill="#ffffff" opacity={0.42} />
            {/* door shut line and handle */}
            <Line x1={21.2} y1={9.2} x2={21.2} y2={17.6} stroke="#000000" strokeWidth={0.5} opacity={0.18} />
            <Rect x={24.4} y={11.4} width={3.4} height={1} rx={0.5} fill="#000000" opacity={0.22} />
            {/* sill shadow */}
            <Rect x={5} y={17.1} width={44} height={1} fill="#000000" opacity={0.16} />
            {/* lamps */}
            <Path d="M46.4,11.5 L48.9,12.1 Q49.5,12.5 49.5,13.3 L46.4,13.3 Z" fill="#FFF3C4" />
            <Rect x={4} y={12.4} width={2.3} height={2.4} rx={0.7} fill="#8E2226" />
            {/* wheels, tucked under the arches */}
            <Circle cx={13} cy={20} r={4.3} fill="#16181D" />
            <Circle cx={39} cy={20} r={4.3} fill="#16181D" />
            <Circle cx={13} cy={20} r={1.9} fill="#B7BDC6" />
            <Circle cx={39} cy={20} r={1.9} fill="#B7BDC6" />
          </Svg>
          {/* brake light, lit while you are holding the car */}
          <Animated.View style={[styles.hillHold, { backgroundColor: DANGER }, holdStyle]} />
        </Animated.View>
      </View>

      <View style={styles.captionStrip}>
        <PhaseCaption progress={progress} range={HILL_PHASE_SET} label="handbrake on — a little gas, a steady hum" color={DANGER} />
        <PhaseCaption progress={progress} range={HILL_PHASE_BITE} label="clutch to the bite — the nose lifts, hold it there" color={AMBER} />
        <PhaseCaption progress={progress} range={HILL_PHASE_CHECK} label="mirrors and blind spot before the handbrake comes off" color={theme.tint} />
        <PhaseCaption progress={progress} range={HILL_PHASE_AWAY} label="release as the bite takes the weight — no roll-back" color={theme.success} />
      </View>
    </View>
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
  /** Sits over the tail lamp, lit while the car is being held. */
  hillHold: {
    position: 'absolute',
    left: '7.7%',
    top: '47.7%',
    width: '4.4%',
    height: '9.2%',
    borderRadius: 999,
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
