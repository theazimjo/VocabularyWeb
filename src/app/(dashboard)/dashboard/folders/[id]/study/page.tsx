import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getStudySessionWords } from "@/actions/words";
import { prisma } from "@/lib/prisma";
import StudyQuizClient from "./StudyQuizClient";
import Link from "next/link";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const folder = await prisma.folder.findUnique({
    where: { id },
  });

  if (!folder || folder.userId !== session.user.id) notFound();

  const words = await getStudySessionWords(id, 10);

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 text-zinc-100">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-3xl font-black mb-2">So&apos;zlar yo&apos;q</h2>
        <p className="text-zinc-500 mb-6 max-w-xs">
          Avval papkaga so&apos;zlar qo&apos;shing, keyin yodlashni boshlang.
        </p>
        <Link
          href={`/dashboard/folders/${id}`}
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 font-bold transition-all"
        >
          ← Papkaga qaytish
        </Link>
      </div>
    );
  }

  return (
    <StudyQuizClient words={words} folderId={id} folderName={folder.name} />
  );
}
