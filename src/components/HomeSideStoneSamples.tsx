import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APP_VERSION } from '../constants/app';
import { MASTER_SCORE_THRESHOLD, USE_TEST_MASTER_THRESHOLD } from '../constants/scoring';
import { colors } from '../constants/colors';
import type { Language } from '../utils/i18n';
import { t } from '../utils/i18n';
import { LandscapeSideArt } from './LandscapeSideArt';
import Stone from './Stone';

const GRID_SIZE = 7;
const CELL_SIZE = 28;
const BOARD_PADDING = 14;
const OUTER_LINE = 3;

const HOME_SIDE_STONE_TOP = 20;

/** Decorative mid-game sample — both stone colors on a small board */
const SAMPLE_STONES: Array<{ row: number; col: number; player: 1 | 2 }> = [
  { row: 1, col: 2, player: 1 },
  { row: 1, col: 4, player: 2 },
  { row: 2, col: 3, player: 1 },
  { row: 2, col: 5, player: 2 },
  { row: 3, col: 2, player: 2 },
  { row: 3, col: 3, player: 1 },
  { row: 3, col: 4, player: 2 },
  { row: 4, col: 3, player: 1 },
  { row: 4, col: 4, player: 1 },
  { row: 5, col: 2, player: 2 },
  { row: 5, col: 5, player: 1 },
];

export function HomeSideStoneSamples({ language }: { language: Language }) {
  const boardPixelSize = CELL_SIZE * (GRID_SIZE - 1) + BOARD_PADDING * 2;
  const centerIndex = Math.floor(GRID_SIZE / 2);

  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];

    for (let i = 0; i < GRID_SIZE; i++) {
      const isOuter = i === 0 || i === GRID_SIZE - 1;
      const topBase = BOARD_PADDING + i * CELL_SIZE;
      const top = isOuter ? topBase - (OUTER_LINE - 1) / 2 : topBase;
      lines.push(
        <View
          key={`h-${i}`}
          style={[
            styles.line,
            styles.horizontalLine,
            isOuter ? { height: OUTER_LINE } : undefined,
            { top },
          ]}
        />,
      );
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      const isOuter = i === 0 || i === GRID_SIZE - 1;
      const leftBase = BOARD_PADDING + i * CELL_SIZE;
      const left = isOuter ? leftBase - (OUTER_LINE - 1) / 2 : leftBase;
      lines.push(
        <View
          key={`v-${i}`}
          style={[
            styles.line,
            styles.verticalLine,
            isOuter ? { width: OUTER_LINE } : undefined,
            { left },
          ]}
        />,
      );
    }

    return lines;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.contentBlock}>
        <View style={styles.stoneSlot}>
          <LandscapeSideArt side="left" pieceOnly />
        </View>
        <View style={[styles.board, { width: boardPixelSize, height: boardPixelSize }]}>
          {gridLines}
          <View
            pointerEvents="none"
            style={[
              styles.centerDot,
              {
                left: BOARD_PADDING + centerIndex * CELL_SIZE,
                top: BOARD_PADDING + centerIndex * CELL_SIZE,
              },
            ]}
          />
          {SAMPLE_STONES.map(({ row, col, player }) => (
            <View
              key={`${row}-${col}`}
              style={{
                position: 'absolute',
                left: BOARD_PADDING + col * CELL_SIZE,
                top: BOARD_PADDING + row * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                marginLeft: -CELL_SIZE / 2,
                marginTop: -CELL_SIZE / 2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stone player={player} />
            </View>
          ))}
        </View>
        <Text style={styles.versionText}>
          {t(language, 'appVersion')}
          {APP_VERSION}
          {USE_TEST_MASTER_THRESHOLD ? ` · TEST master @ ${MASTER_SCORE_THRESHOLD}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: HOME_SIDE_STONE_TOP,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  contentBlock: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
  },
  stoneSlot: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    backgroundColor: '#E8B96F',
    borderRadius: 5,
    padding: BOARD_PADDING,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  line: {
    position: 'absolute',
    backgroundColor: '#000',
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  centerDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D62828',
    marginLeft: -3,
    marginTop: -3,
    zIndex: 4,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
  },
});
