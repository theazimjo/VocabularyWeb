"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getWordsForSession(limit: number = 10) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Fetch words that are due for review
  const dueProgresses = await prisma.userProgress.findMany({
    where: {
      userId,
      nextReviewDate: { lte: new Date() },
    },
    include: { word: true },
    orderBy: { nextReviewDate: "asc" },
    take: limit,
  });

  const dueWords = dueProgresses.map((p) => p.word);

  // If not enough due words, fetch some new words the user hasn't seen
  if (dueWords.length < limit) {
    const seenWordIds = await prisma.userProgress.findMany({
      where: { userId },
      select: { wordId: true },
    });

    const newWords = await prisma.word.findMany({
      where: {
        id: { notIn: seenWordIds.map((p) => p.wordId) },
      },
      take: limit - dueWords.length,
    });

    return [...dueWords, ...newWords];
  }

  return dueWords;
}

export async function getStudySessionWords(folderId: string, limit: number = 10) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  // 1. Fetch folder words with user progress
  const folderWords = await prisma.word.findMany({
    where: { folderId },
    include: {
      userProgress: {
        where: { userId }
      }
    }
  });

  if (folderWords.length === 0) return [];

  // 2. Prioritize: Unseen words or words with high fail counts or due review
  const sortedWords = folderWords.sort((a, b) => {
    const progressA = a.userProgress[0];
    const progressB = b.userProgress[0];

    // Priority 1: Unseen (no progress record)
    if (!progressA && progressB) return -1;
    if (progressA && !progressB) return 1;

    // Priority 2: Failed more recently or frequently
    if (progressA && progressB) {
      if (progressA.timesFailed !== progressB.timesFailed) {
        return progressB.timesFailed - progressA.timesFailed;
      }
      return new Date(progressA.nextReviewDate).getTime() - new Date(progressB.nextReviewDate).getTime();
    }

    return 0;
  });

  const sessionWords = sortedWords.slice(0, limit);

  // 3. For each word, build 4-option multiple-choice with random distractors
  const allOtherWords = await prisma.word.findMany({
    where: { id: { notIn: sessionWords.map((w) => w.id) } },
    select: { id: true, uzbek_translation: true },
  });

  const wordsWithDistractors = sessionWords.map((word) => {
    // Shuffle a copy and pick first 3
    const shuffled = [...allOtherWords].sort(() => Math.random() - 0.5);
    const distractors = shuffled.slice(0, 3);

    const options = [
      { text: word.uzbek_translation, isCorrect: true },
      ...distractors.map((d) => ({ text: d.uzbek_translation, isCorrect: false })),
    ].sort(() => Math.random() - 0.5);

    return { ...word, options };
  });

  return wordsWithDistractors;
}
