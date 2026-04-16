"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sm2Calculate, binaryToQuality } from "@/lib/sm2";
import type { SM2State } from "@/lib/sm2";
import { revalidatePath } from "next/cache";

/**
 * Update word progress with a quality rating (0-5, SM-2 scale)
 * quality: 0=blackout, 1=wrong, 2=wrong but close, 3=correct barely, 4=correct, 5=perfect
 */
export async function updateWordProgressQuality(wordId: string, quality: 0 | 1 | 2 | 3 | 4 | 5, folderId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const progress = await prisma.userProgress.findUnique({
    where: { userId_wordId: { userId, wordId } },
  });

  const currentState: SM2State = progress
    ? {
        easiness: progress.easiness,
        interval: progress.interval,
        timesCorrect: progress.timesCorrect,
        timesFailed: progress.timesFailed,
        isLearned: progress.isLearned,
      }
    : {
        easiness: 2.5,
        interval: 0,
        timesCorrect: 0,
        timesFailed: 0,
        isLearned: false,
      };

  const result = sm2Calculate(currentState, quality);

  if (progress) {
    await prisma.userProgress.update({
      where: { id: progress.id },
      data: {
        easiness: result.easiness,
        interval: result.interval,
        timesCorrect: result.timesCorrect,
        timesFailed: result.timesFailed,
        isLearned: result.isLearned,
        nextReviewDate: result.nextReviewDate,
      },
    });
  } else {
    await prisma.userProgress.create({
      data: {
        userId,
        wordId,
        easiness: result.easiness,
        interval: result.interval,
        timesCorrect: result.timesCorrect,
        timesFailed: result.timesFailed,
        isLearned: result.isLearned,
        nextReviewDate: result.nextReviewDate,
      },
    });
  }

  // Removed aggressive revalidatePath that was breaking study session stability.
  // Revalidation should be handled at the end of the session or on navigation.
}

/**
 * Legacy binary wrapper (for backward compat)
 */
export async function updateWordProgress(wordId: string, isCorrect: boolean, folderId?: string) {
  return updateWordProgressQuality(wordId, binaryToQuality(isCorrect), folderId);
}

export async function getFolderStats(folderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const words = await prisma.word.findMany({
    where: { folderId },
    include: {
      userProgress: { where: { userId } },
    },
  });

  const total = words.length;
  const learned = words.filter((w) => w.userProgress[0]?.isLearned).length;
  const seen = words.filter((w) => w.userProgress.length > 0).length;
  const dueNow = words.filter((w) => {
    const p = w.userProgress[0];
    return p && new Date(p.nextReviewDate) <= new Date();
  }).length;

  return { total, learned, seen, unseen: total - seen, dueNow };
}
