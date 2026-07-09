/** Flip to false before release. When true, master celebration fires at 20 instead of 100. */
export const USE_TEST_MASTER_THRESHOLD = false;

export const MASTER_SCORE_THRESHOLD = USE_TEST_MASTER_THRESHOLD ? 20 : 100;
