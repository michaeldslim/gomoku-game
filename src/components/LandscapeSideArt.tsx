import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../constants/colors';

interface LandscapeSideArtProps {
  side: 'left' | 'right';
  pieceOnly?: boolean;
  /** Stretch board art to fill a landscape side panel (home screen) */
  fillPanel?: boolean;
}

const STONE_RADIUS = 44;
const STONE_CY = 272;

function StoneSvg({ fill, stroke, cx }: { fill: string; stroke: string; cx: number }) {
  const uid = fill.replace(/[^a-z]/gi, '');
  return (
    <>
      <Defs>
        <RadialGradient id={`stoneGrad-${uid}`} cx="35%" cy="30%" rx="60%" ry="60%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <Stop offset="0.6" stopColor={fill} />
          <Stop offset="1" stopColor={stroke} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={STONE_CY} r={STONE_RADIUS} fill={`url(#stoneGrad-${uid})`} stroke={stroke} strokeWidth="2" />
    </>
  );
}

export function LandscapeSideArt({ side, pieceOnly = false, fillPanel = false }: LandscapeSideArtProps) {
  const isBlack = side === 'left';
  const stoneFill = isBlack ? '#1F2937' : '#F9FAFB';
  const stoneStroke = isBlack ? '#111827' : '#D1D5DB';
  const uid = side;

  if (pieceOnly) {
    return (
      <View style={styles.pieceOnlyWrap}>
        <Svg width={STONE_RADIUS * 2 + 8} height={STONE_RADIUS * 2 + 8} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id={`stoneOnly-${side}`} cx="35%" cy="30%" rx="60%" ry="60%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
              <Stop offset="0.6" stopColor={stoneFill} />
              <Stop offset="1" stopColor={stoneStroke} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={50}
            cy={50}
            r={40}
            fill={`url(#stoneOnly-${side})`}
            stroke={stoneStroke}
            strokeWidth="2"
          />
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.container, fillPanel && styles.containerFillPanel]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 600" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`woodGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E8D4B0" />
            <Stop offset="0.5" stopColor={colors.boardWood} />
            <Stop offset="1" stopColor="#B8956A" />
          </LinearGradient>
          <LinearGradient id={`goldGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.gold} stopOpacity="0.25" />
            <Stop offset="1" stopColor={colors.gold} stopOpacity="0.04" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="200" height="600" fill={`url(#woodGrad-${uid})`} />

        <Rect
          x="16"
          y="72"
          width="168"
          height="456"
          rx="6"
          fill={`url(#goldGrad-${uid})`}
          stroke="#A67C52"
          strokeWidth="1.5"
          opacity="0.75"
        />

        {[120, 180, 240, 300, 360, 420, 480].map((y) => (
          <Line
            key={`h-${y}`}
            x1="40"
            y1={y}
            x2="160"
            y2={y}
            stroke="#8B6914"
            strokeWidth="0.8"
            opacity="0.35"
          />
        ))}
        {[60, 90, 120, 150].map((x) => (
          <Line
            key={`v-${x}`}
            x1={x + 20}
            y1="100"
            x2={x + 20}
            y2="500"
            stroke="#8B6914"
            strokeWidth="0.8"
            opacity="0.35"
          />
        ))}

        <StoneSvg fill={stoneFill} stroke={stoneStroke} cx={100} />

        <Circle cx="100" cy="108" r="5" fill={colors.gold} opacity="0.55" />
        <Circle cx="100" cy="492" r="5" fill={colors.gold} opacity="0.55" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    minHeight: 120,
    maxHeight: 200,
    marginBottom: 8,
    borderRadius: 10,
  },
  containerFillPanel: {
    maxHeight: undefined,
    marginBottom: 0,
    borderRadius: 0,
    alignSelf: 'stretch',
  },
  pieceOnlyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
