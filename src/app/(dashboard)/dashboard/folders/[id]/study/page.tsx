import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getStudySessionWords } from "@/actions/words";
import { prisma } from "@/lib/prisma";
import SmartStudyClient from "./SmartStudyClient";
import FlashcardClient from "./FlashcardClient";
import Link from "next/link";

export default async function StudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const isFlashcard = sp.mode === "flashcard";

  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder || folder.userId !== session.user.id) notFound();

  const words = await getStudySessionWords(id, 20);

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 text-zinc-100">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-2xl font-black mb-2">So'zlar yo'q</h2>
        <p className="text-zinc-500 mb-6 text-sm max-w-xs mx-auto">
          Avval papkaga so'zlar qo'shing, keyin yodlashni boshlang.
        </p>
        <Link
          href={`/dashboard/folders/${id}`}
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 font-bold text-sm transition-all"
        >
          ← Papkaga qaytish
        </Link>
      </div>
    );
  }

  if (isFlashcard) {
    return (
      <FlashcardClient
        words={words}
        folderId={id}
        folderName={folder.name}
        direction="mixed"
      />
    );
  }

  return (
    <SmartStudyClient
      words={words}
      folderId={id}
      folderName={folder.name}
    />
  );
}
