"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function updateWordProgress(wordId: string, isCorrect: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const progress = await prisma.userProgress.findUnique({
    where: { userId_wordId: { userId, wordId } },
  });

  const now = new Date();
  
  let interval = 1;
  let easiness = 2.5;
  let timesCorrect = 0;
  let timesFailed = 0;

  if (progress) {
    timesCorrect = isCorrect ? progress.timesCorrect + 1 : progress.timesCorrect;
    timesFailed = isCorrect ? progress.timesFailed : progress.timesFailed + 1;
    easiness = progress.easiness;
    
    if (isCorrect) {
        // SM-2 logic
        if (progress.timesCorrect === 0) {
            interval = 1;
        } else if (progress.timesCorrect === 1) {
            interval = 6;
        } else {
            interval = Math.round(progress.interval * easiness);
        }
        easiness = Math.max(1.3, easiness + 0.1);
    } else {
        interval = 1;
        easiness = Math.max(1.3, easiness - 0.2);
    }

    await prisma.userProgress.update({
      where: { id: progress.id },
      data: {
        timesCorrect,
        timesFailed,
        easiness,
        interval,
        nextReviewDate: new Date(now.getTime() + (interval * 24 * 60 * 60 * 1000)),
        isLearned: timesCorrect > 3,
      },
    });
  } else {
    // First attempt
    interval = isCorrect ? 1 : 1;
    await prisma.userProgress.create({
      data: {
        userId,
        wordId,
        timesCorrect: isCorrect ? 1 : 0,
        timesFailed: isCorrect ? 0 : 1,
        interval,
        easiness: 2.5,
        nextReviewDate: new Date(now.getTime() + (interval * 24 * 60 * 60 * 1000)),
      },
    });
  }

  // Update user points
  if (isCorrect) {
    await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: 10 } }
    });
  }
}

export async function getUserStats() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const wordsLearned = await prisma.userProgress.count({
        where: { userId, isLearned: true }
    });

    const totalStudied = await prisma.userProgress.count({
        where: { userId }
    });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
    });

    return { 
        wordsLearned, 
        totalStudied, 
        points: user?.points || 0 
    };
}
