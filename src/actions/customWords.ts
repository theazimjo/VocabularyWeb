"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addWordToFolder(
  folderId: string,
  data: { english_word: string; uzbek_translation: string; example?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify folder ownership
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const word = await prisma.word.create({
    data: {
      english_word: data.english_word,
      uzbek_translation: data.uzbek_translation,
      example: data.example || null,
      folderId,
    },
  });

  revalidatePath(`/dashboard/folders/${folderId}`);
  revalidatePath(`/dashboard/folders`); // Update word count in folder list
  return word;
}

export async function getWordsByFolder(folderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify folder ownership
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const words = await prisma.word.findMany({
    where: { folderId },
    orderBy: { createdAt: "desc" },
  });

  return { folder, words };
}

export async function deleteWord(wordId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify ownership via folder relation
  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: { folder: true },
  });

  if (!word || !word.folder || word.folder.userId !== session.user.id) {
    throw new Error("Unauthorized or word not customized");
  }

  await prisma.word.delete({
    where: { id: wordId },
  });

  revalidatePath(`/dashboard/folders/${word.folderId}`);
  revalidatePath(`/dashboard/folders`);
}

export async function updateWord(
  wordId: string,
  data: { english_word: string; uzbek_translation: string; example?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: { folder: true },
  });

  if (!word || !word.folder || word.folder.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const updated = await prisma.word.update({
    where: { id: wordId },
    data: {
      english_word: data.english_word,
      uzbek_translation: data.uzbek_translation,
      example: data.example || null,
    },
  });

  revalidatePath(`/dashboard/folders/${word.folderId}`);
  return updated;
}
