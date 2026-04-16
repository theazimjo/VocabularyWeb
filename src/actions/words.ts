"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type StudyWord = {
  id: string;
  english_word: string;
  uzbek_translation: string;
  example: string | null;
  timesCorrect: number;
  timesFailed: number;
  isLearned: boolean;
  easiness: number;
  interval: number;
  isDue: boolean;
  isNew: boolean;
  // Two sets of options to support mixed directions (EN->UZ and UZ->EN)
  uzbekOptions: { text: string; isCorrect: boolean }[];
  englishOptions: { text: string; isCorrect: boolean }[];
};

export async function getStudySessionWords(
  folderId: string,
  limit = 15
): Promise<StudyWord[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const folderWords = await prisma.word.findMany({
    where: { folderId },
    include: { userProgress: { where: { userId } } },
  });

  if (folderWords.length === 0) return [];

  const now = new Date();

  // Score each word for session priority
  const scored = folderWords.map((w) => {
    const p = w.userProgress[0];
    const isNew = !p;
    const isDue = p ? new Date(p.nextReviewDate) <= now : false;
    
    // PRIORITY LOGIC:
    // 1. Overdue words get highest score (100+)
    // 2. Previously failed words get bonus weight
    // 3. New words get secondary priority (10+)
    // 4. Random noise (0-5) to keep sessions fresh
    
    const duePriority = isDue ? 100 : 0;
    const failPriority = p ? p.timesFailed * 5 : 0;
    const newPriority = isNew ? 10 : 0;
    const score = duePriority + failPriority + newPriority + (Math.random() * 5);

    return {
      word: w,
      progress: p,
      score,
      isNew,
      isDue,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  let session_words = scored.slice(0, limit);
  
  // FINAL SHUFFLE: Ensure the order within the session is mixed
  session_words = session_words.sort(() => Math.random() - 0.5);

  const sessionIds = new Set(session_words.map((s) => s.word.id));

  // Build distractor pools - SCOPED TO CURRENT USER ONLY
  // Get 100 random words from the user's own folders to ensure variety
  const userDistractors = await prisma.word.findMany({
    where: { 
      folder: { userId },
      id: { notIn: Array.from(sessionIds) }
    },
    take: 100,
  });

  const distractorPool = userDistractors.length > 0 ? userDistractors : folderWords;

  return session_words.map(({ word, progress, isNew, isDue }) => {
    const shuffled = [...distractorPool].sort(() => Math.random() - 0.5);

    // 1. Uzbek Options (Choices are in Uzbek)
    const uzSeen = new Set<string>([word.uzbek_translation]);
    const uzDistractors: string[] = [];
    for (const d of shuffled) {
      if (uzDistractors.length >= 3) break;
      if (!uzSeen.has(d.uzbek_translation)) {
        uzSeen.add(d.uzbek_translation);
        uzDistractors.push(d.uzbek_translation);
      }
    }
    const pads = ["???", "—", "bilmayman"];
    while (uzDistractors.length < 3) {
      const p = pads.shift()!;
      if (!uzSeen.has(p)) uzDistractors.push(p);
    }
    const uzbekOptions = [
      { text: word.uzbek_translation, isCorrect: true },
      ...uzDistractors.map(t => ({ text: t, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);

    // 2. English Options (Choices are in English)
    const enSeen = new Set<string>([word.english_word.toLowerCase()]);
    const enDistractors: string[] = [];
    for (const d of shuffled) {
      if (enDistractors.length >= 3) break;
      const dWord = d.english_word.toLowerCase();
      if (!enSeen.has(dWord)) {
        enSeen.add(dWord);
        enDistractors.push(d.english_word);
      }
    }
    const enPads = ["Unknown", "Other", "Don't know"];
    while (enDistractors.length < 3) {
      const p = enPads.shift()!;
      if (!enSeen.has(p.toLowerCase())) enDistractors.push(p);
    }
    const englishOptions = [
      { text: word.english_word, isCorrect: true },
      ...enDistractors.map(t => ({ text: t, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);

    return {
      id: word.id,
      english_word: word.english_word,
      uzbek_translation: word.uzbek_translation,
      example: word.example,
      timesCorrect: progress?.timesCorrect ?? 0,
      timesFailed: progress?.timesFailed ?? 0,
      isLearned: progress?.isLearned ?? false,
      easiness: progress?.easiness ?? 2.5,
      interval: progress?.interval ?? 0,
      isDue,
      isNew,
      uzbekOptions,
      englishOptions,
    };
  });
}
