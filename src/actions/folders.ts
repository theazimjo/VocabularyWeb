"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createFolder(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const folder = await prisma.folder.create({
    data: {
      name,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/folders");
  return folder;
}

export async function getFolders() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const folders = await prisma.folder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { words: true },
      },
    },
  });

  return folders;
}

export async function deleteFolder(folderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify ownership before deleting
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.userId !== session.user.id) {
    throw new Error("Unauthorized or folder not found");
  }

  await prisma.folder.delete({
    where: { id: folderId },
  });

  revalidatePath("/dashboard/folders");
}
