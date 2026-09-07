import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PORTRAIT_HORIZONTAL_MARGIN = 16;
const COMPACT_PLAY_SCREEN_HEIGHT = 880;

export const TABLET_SHORT_EDGE_MIN = 600;

const LANDSCAPE_SIDE_PANEL_MIN = 180;
const LANDSCAPE_SIDE_PANEL_MAX = 280;
const LANDSCAPE_SIDE_PANEL_RATIO = 0.24;
const LANDSCAPE_BOARD_GAP = 8;

/** Centered menu/home column on tablet landscape. */
const MENU_LANDSCAPE_MAX_WIDTH = 520;
const MENU_LANDSCAPE_SIDE_INSET_MIN = 56;

function getMenuLandscapeInsets(screenWidth: number, screenHeight: number) {
  const shortestSide = Math.min(screenWidth, screenHeight);
  const isTablet = shortestSide >= TABLET_SHORT_EDGE_MIN;
  const isLandscape = screenWidth > screenHeight;
  const isTabletLandscape = isTablet && isLandscape;

  if (!isTabletLandscape) {
    return { isTabletLandscape: false, menuHorizontalInset: 0, menuContentWidth: screenWidth };
  }

  const menuContentWidth = Math.min(
    MENU_LANDSCAPE_MAX_WIDTH,
    screenWidth - MENU_LANDSCAPE_SIDE_INSET_MIN * 2,
  );

  return {
    isTabletLandscape: true,
    menuHorizontalInset: Math.round((screenWidth - menuContentWidth) / 2),
    menuContentWidth,
  };
}

function getLandscapeSidePanelWidth(screenWidth: number): number {
  return Math.round(
    Math.min(
      LANDSCAPE_SIDE_PANEL_MAX,
      Math.max(LANDSCAPE_SIDE_PANEL_MIN, screenWidth * LANDSCAPE_SIDE_PANEL_RATIO),
    ),
  );
}

export type OrientationGuide = 'portrait' | 'landscape';

/** Phone landscape → suggest portrait; tablet portrait → suggest landscape. */
export function getOrientationGuide(
  screenWidth: number,
  screenHeight: number,
): OrientationGuide | null {
  const shortestSide = Math.min(screenWidth, screenHeight);
  const isTablet = shortestSide >= TABLET_SHORT_EDGE_MIN;
  const isLandscape = screenWidth > screenHeight;

  if (!isTablet && isLandscape) {
    return 'portrait';
  }

  if (isTablet && !isLandscape) {
    return 'landscape';
  }

  return null;
}

/** Tablet landscape only — portrait uses the same stacked layout as phones. */
export function isTabletWideLayout(screenWidth: number, screenHeight: number): boolean {
  const shortestSide = Math.min(screenWidth, screenHeight);
  const isTablet = shortestSide >= TABLET_SHORT_EDGE_MIN;
  const isLandscape = screenWidth > screenHeight;

  return isTablet && isLandscape;
}

export function useScreenLayout() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const wideLayout = isTabletWideLayout(screenWidth, screenHeight);
    const isCompactPlayScreen = screenHeight < COMPACT_PLAY_SCREEN_HEIGHT;
    const menuInsets = getMenuLandscapeInsets(screenWidth, screenHeight);

    if (wideLayout) {
      const sidePanelWidth = getLandscapeSidePanelWidth(screenWidth);
      const boardCenterWidth =
        screenWidth -
        sidePanelWidth * 2 -
        LANDSCAPE_BOARD_GAP * 2 -
        insets.left -
        insets.right;
      const boardColumnWidth =
        screenWidth - sidePanelWidth - insets.left - insets.right;

      return {
        isWideLayout: true,
        sidePanelWidth,
        boardColumnWidth,
        boardCenterWidth,
        isCompactPlayScreen,
        ...menuInsets,
      };
    }

    const boardColumnWidth = screenWidth;
    const boardCenterWidth = screenWidth - PORTRAIT_HORIZONTAL_MARGIN * 2;

    return {
      isWideLayout: false,
      sidePanelWidth: 0,
      boardColumnWidth,
      boardCenterWidth,
      isCompactPlayScreen,
      ...menuInsets,
    };
  }, [insets.left, insets.right, screenHeight, screenWidth]);
}
