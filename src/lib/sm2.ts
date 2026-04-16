/**
 * SM-2 Spaced Repetition Algorithm
 * Quality: 0 = complete blackout, 1 = incorrect, 2 = incorrect but close,
 *          3 = correct (barely), 4 = correct with hesitation, 5 = perfect recall
 *
 * Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */

export interface SM2State {
  easiness: number;    // E-Factor (min 1.3, starts at 2.5)
  interval: number;    // Days until next review
  timesCorrect: number;
  timesFailed: number;
  isLearned: boolean;
}

export interface SM2Result extends SM2State {
  nextReviewDate: Date;
}

/**
 * Calculate next SM-2 state from current state + quality rating
 */
export function sm2Calculate(current: SM2State, quality: 0 | 1 | 2 | 3 | 4 | 5): SM2Result {
  const isCorrect = quality >= 3;

  let { easiness, interval, timesCorrect, timesFailed } = current;

  // Update easiness factor
  const newEasiness = Math.max(
    1.3,
    easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  let newInterval: number;

  if (!isCorrect) {
    // Reset interval on failure
    newInterval = 1;
    timesFailed += 1;
  } else {
    timesCorrect += 1;
    if (timesCorrect === 1) {
      newInterval = 1;
    } else if (timesCorrect === 2) {
      newInterval = 6;
    } else {
      // Use previous interval × E-Factor, adjusted by quality
      const qualityBoost = quality === 5 ? 1.1 : quality === 4 ? 1.0 : 0.8;
      newInterval = Math.max(1, Math.round(interval * newEasiness * qualityBoost));
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  const isLearned = timesCorrect >= 4 && newEasiness >= 2.0;

  return {
    easiness: newEasiness,
    interval: newInterval,
    timesCorrect,
    timesFailed,
    isLearned,
    nextReviewDate,
  };
}

/**
 * Map a binary correct/wrong to quality
 * Used for MCQ and type-answer modes
 */
export function binaryToQuality(isCorrect: boolean, wasClose = false): 0 | 1 | 2 | 3 | 4 | 5 {
  if (isCorrect) return 4;
  if (wasClose) return 2;
  return 0;
}

/**
 * Map flashcard self-rating to quality
 */
export const FLASHCARD_RATINGS = [
  { label: "Bilmayman", quality: 0 as const, color: "red" },
  { label: "Qiyin",    quality: 2 as const, color: "orange" },
  { label: "Yaxshi",   quality: 4 as const, color: "blue" },
  { label: "Oson",     quality: 5 as const, color: "green" },
] as const;
