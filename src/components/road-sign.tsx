import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

/**
 * Stylised renderings of standard UK road signs (sign designs are published
 * under the Open Government Licence). Drawn as vectors so they stay crisp at
 * any size and need no bundled images.
 */

const RED = '#c1121c';
const BLUE = '#0057b8';
const BLACK = '#1a1a1a';
const AMBER = '#f59f00';
const GREEN = '#2f9e44';

export type SignKind = 'warning' | 'prohibition' | 'mandatory' | 'other';

export interface RoadSignInfo {
  id: string;
  name: string;
  meaning: string;
  kind: SignKind;
}

export const SIGN_KIND_LABELS: Record<SignKind, string> = {
  warning: 'Warning signs (triangles)',
  prohibition: 'Signs that say no (red circles)',
  mandatory: 'Signs that give orders (blue circles)',
  other: 'Unique shapes & information',
};

export const ROAD_SIGNS: RoadSignInfo[] = [
  { id: 'stop', name: 'Stop', meaning: 'Stop completely at the line before proceeding', kind: 'other' },
  { id: 'giveWay', name: 'Give way', meaning: 'Give way to traffic on the major road ahead', kind: 'other' },
  { id: 'noEntry', name: 'No entry', meaning: 'No entry for vehicular traffic', kind: 'prohibition' },
  { id: 'limit30', name: '30 mph limit', meaning: 'Maximum speed 30 mph', kind: 'prohibition' },
  { id: 'limit50', name: '50 mph limit', meaning: 'Maximum speed 50 mph', kind: 'prohibition' },
  { id: 'nationalLimit', name: 'National speed limit', meaning: 'National speed limit applies', kind: 'other' },
  { id: 'noUturn', name: 'No U-turns', meaning: 'No U-turns allowed', kind: 'prohibition' },
  { id: 'noWaiting', name: 'No waiting', meaning: 'No waiting at any time (except to load or set down)', kind: 'prohibition' },
  { id: 'noStopping', name: 'No stopping (clearway)', meaning: 'No stopping at any time, even to pick up passengers', kind: 'prohibition' },
  { id: 'noOvertaking', name: 'No overtaking', meaning: 'No overtaking', kind: 'prohibition' },
  { id: 'aheadOnly', name: 'Ahead only', meaning: 'Proceed straight ahead only', kind: 'mandatory' },
  { id: 'turnLeftAhead', name: 'Turn left ahead', meaning: 'Turn left ahead', kind: 'mandatory' },
  { id: 'keepLeft', name: 'Keep left', meaning: 'Keep to the left of the sign', kind: 'mandatory' },
  { id: 'minSpeed30', name: 'Minimum speed', meaning: 'Minimum speed 30 mph', kind: 'mandatory' },
  { id: 'miniRoundabout', name: 'Mini-roundabout', meaning: 'Mini-roundabout — give way to traffic from the right', kind: 'mandatory' },
  { id: 'oneWay', name: 'One-way traffic', meaning: 'Traffic flows in one direction only', kind: 'other' },
  { id: 'crossroads', name: 'Crossroads', meaning: 'Crossroads ahead', kind: 'warning' },
  { id: 'tJunction', name: 'T-junction', meaning: 'T-junction ahead — the road you are on ends', kind: 'warning' },
  { id: 'doubleBend', name: 'Double bend', meaning: 'Double bend ahead, first to the right', kind: 'warning' },
  { id: 'twoWayTraffic', name: 'Two-way traffic', meaning: 'Two-way traffic ahead', kind: 'warning' },
  { id: 'roadNarrows', name: 'Road narrows', meaning: 'Road narrows on both sides ahead', kind: 'warning' },
  { id: 'trafficSignals', name: 'Traffic signals', meaning: 'Traffic signals ahead', kind: 'warning' },
  { id: 'steepHillDown', name: 'Steep descent', meaning: 'Steep downward gradient ahead (10%)', kind: 'warning' },
  { id: 'unevenRoad', name: 'Uneven road', meaning: 'Uneven road surface ahead', kind: 'warning' },
];

// --- shared shapes ---

function WarningTriangle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Polygon points="50,7 95,87 5,87" fill="#fff" stroke={RED} strokeWidth={7} strokeLinejoin="round" />
      {children}
    </>
  );
}

function ProhibitionRing({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <Circle cx={50} cy={50} r={44} fill="#fff" stroke={RED} strokeWidth={9} />
      {children}
    </>
  );
}

function BlueDisc({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <Circle cx={50} cy={50} r={46} fill={BLUE} />
      {children}
    </>
  );
}

function RedSlash() {
  return <Line x1={80} y1={20} x2={20} y2={80} stroke={RED} strokeWidth={8} />;
}

function Arrow({ rotation = 0 }: { rotation?: number }) {
  return (
    <G transform={`rotate(${rotation} 50 50)`}>
      <Line x1={50} y1={74} x2={50} y2={38} stroke="#fff" strokeWidth={10} />
      <Polygon points="50,20 36,42 64,42" fill="#fff" />
    </G>
  );
}

function CarSilhouette({ x, color }: { x: number; color: string }) {
  return (
    <>
      <Rect x={x} y={50} width={26} height={11} rx={4} fill={color} />
      <Rect x={x + 5} y={43} width={15} height={9} rx={3} fill={color} />
    </>
  );
}

// --- the sign renderer ---

export function RoadSign({ id, size = 96 }: { id: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {renderSign(id)}
    </Svg>
  );
}

function renderSign(id: string) {
  switch (id) {
    case 'stop':
      return (
        <>
          <Polygon
            points="67.2,8.4 91.6,32.8 91.6,67.2 67.2,91.6 32.8,91.6 8.4,67.2 8.4,32.8 32.8,8.4"
            fill={RED}
            stroke="#fff"
            strokeWidth={4}
          />
          <SvgText x={50} y={59} fontSize={26} fontWeight="bold" fill="#fff" textAnchor="middle">
            STOP
          </SvgText>
        </>
      );
    case 'giveWay':
      return (
        <>
          <Polygon points="6,14 94,14 50,90" fill="#fff" stroke={RED} strokeWidth={7} strokeLinejoin="round" />
          <SvgText x={50} y={38} fontSize={14} fontWeight="bold" fill={BLACK} textAnchor="middle">
            GIVE
          </SvgText>
          <SvgText x={50} y={54} fontSize={14} fontWeight="bold" fill={BLACK} textAnchor="middle">
            WAY
          </SvgText>
        </>
      );
    case 'noEntry':
      return (
        <>
          <Circle cx={50} cy={50} r={46} fill={RED} />
          <Rect x={18} y={44} width={64} height={13} rx={3} fill="#fff" />
        </>
      );
    case 'limit30':
      return (
        <ProhibitionRing>
          <SvgText x={50} y={62} fontSize={34} fontWeight="bold" fill={BLACK} textAnchor="middle">
            30
          </SvgText>
        </ProhibitionRing>
      );
    case 'limit50':
      return (
        <ProhibitionRing>
          <SvgText x={50} y={62} fontSize={34} fontWeight="bold" fill={BLACK} textAnchor="middle">
            50
          </SvgText>
        </ProhibitionRing>
      );
    case 'nationalLimit':
      return (
        <>
          <Circle cx={50} cy={50} r={45} fill="#fff" stroke="#666" strokeWidth={2.5} />
          <Rect x={44} y={-11} width={13} height={122} fill={BLACK} transform="rotate(-45 50 50)" />
        </>
      );
    case 'noUturn':
      return (
        <ProhibitionRing>
          <Path d="M38,70 L38,44 A12,12 0 0 1 62,44 L62,52" stroke={BLACK} strokeWidth={7} fill="none" />
          <Polygon points="62,64 54,50 70,50" fill={BLACK} />
          <RedSlash />
        </ProhibitionRing>
      );
    case 'noWaiting':
      return (
        <>
          <Circle cx={50} cy={50} r={44} fill={BLUE} stroke={RED} strokeWidth={9} />
          <RedSlash />
        </>
      );
    case 'noStopping':
      return (
        <>
          <Circle cx={50} cy={50} r={44} fill={BLUE} stroke={RED} strokeWidth={9} />
          <Line x1={80} y1={20} x2={20} y2={80} stroke={RED} strokeWidth={8} />
          <Line x1={20} y1={20} x2={80} y2={80} stroke={RED} strokeWidth={8} />
        </>
      );
    case 'noOvertaking':
      return (
        <ProhibitionRing>
          <CarSilhouette x={20} color={RED} />
          <CarSilhouette x={54} color={BLACK} />
        </ProhibitionRing>
      );
    case 'aheadOnly':
      return (
        <BlueDisc>
          <Arrow />
        </BlueDisc>
      );
    case 'turnLeftAhead':
      return (
        <BlueDisc>
          <Arrow rotation={-90} />
        </BlueDisc>
      );
    case 'keepLeft':
      return (
        <BlueDisc>
          <Arrow rotation={-135} />
        </BlueDisc>
      );
    case 'minSpeed30':
      return (
        <BlueDisc>
          <SvgText x={50} y={62} fontSize={34} fontWeight="bold" fill="#fff" textAnchor="middle">
            30
          </SvgText>
        </BlueDisc>
      );
    case 'miniRoundabout':
      return (
        <BlueDisc>
          {[0, 120, 240].map((angle) => (
            <G key={angle} transform={`rotate(${angle} 50 50)`}>
              <Path d="M50,20 A30,30 0 0 1 76,35" stroke="#fff" strokeWidth={7} fill="none" />
              <Polygon points="84,44 76,26 62,38" fill="#fff" />
            </G>
          ))}
        </BlueDisc>
      );
    case 'oneWay':
      return (
        <>
          <Rect x={22} y={8} width={56} height={84} rx={5} fill={BLUE} />
          <Line x1={50} y1={78} x2={50} y2={36} stroke="#fff" strokeWidth={10} />
          <Polygon points="50,18 36,40 64,40" fill="#fff" />
        </>
      );
    case 'crossroads':
      return (
        <WarningTriangle>
          <Rect x={46} y={32} width={8} height={44} fill={BLACK} />
          <Rect x={28} y={50} width={44} height={8} fill={BLACK} />
        </WarningTriangle>
      );
    case 'tJunction':
      return (
        <WarningTriangle>
          <Rect x={46} y={40} width={8} height={38} fill={BLACK} />
          <Rect x={30} y={32} width={40} height={8} fill={BLACK} />
        </WarningTriangle>
      );
    case 'doubleBend':
      return (
        <WarningTriangle>
          <Path
            d="M44,80 L44,66 L58,56 L44,46 L44,32"
            stroke={BLACK}
            strokeWidth={8}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="square"
          />
        </WarningTriangle>
      );
    case 'twoWayTraffic':
      return (
        <WarningTriangle>
          <Line x1={40} y1={78} x2={40} y2={48} stroke={BLACK} strokeWidth={7} />
          <Polygon points="40,36 31,52 49,52" fill={BLACK} />
          <Line x1={60} y1={42} x2={60} y2={68} stroke={BLACK} strokeWidth={7} />
          <Polygon points="60,80 51,64 69,64" fill={BLACK} />
        </WarningTriangle>
      );
    case 'roadNarrows':
      return (
        <WarningTriangle>
          <Path d="M36,80 L36,58 L44,46 L44,32" stroke={BLACK} strokeWidth={6} fill="none" />
          <Path d="M64,80 L64,58 L56,46 L56,32" stroke={BLACK} strokeWidth={6} fill="none" />
        </WarningTriangle>
      );
    case 'trafficSignals':
      return (
        <WarningTriangle>
          <Rect x={41} y={26} width={18} height={52} rx={4} fill="#fff" stroke={BLACK} strokeWidth={2} />
          <Circle cx={50} cy={37} r={6} fill={RED} />
          <Circle cx={50} cy={52} r={6} fill={AMBER} />
          <Circle cx={50} cy={67} r={6} fill={GREEN} />
        </WarningTriangle>
      );
    case 'steepHillDown':
      return (
        <WarningTriangle>
          <Polygon points="16,78 58,78 16,62" fill={BLACK} />
          <SvgText x={64} y={66} fontSize={16} fontWeight="bold" fill={BLACK} textAnchor="middle">
            10%
          </SvgText>
        </WarningTriangle>
      );
    case 'unevenRoad':
      return (
        <WarningTriangle>
          <Path
            d="M22,70 L30,70 Q37,54 44,70 L52,70 Q59,54 66,70 L78,70"
            stroke={BLACK}
            strokeWidth={6}
            fill="none"
          />
        </WarningTriangle>
      );
    default:
      return <Circle cx={50} cy={50} r={44} fill="#ccc" />;
  }
}
