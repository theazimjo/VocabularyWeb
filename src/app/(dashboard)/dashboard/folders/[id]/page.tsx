import { getWordsByFolder } from "@/actions/customWords";
import { getFolderStats } from "@/actions/progress";
import { FolderDetailClient } from "./FolderDetailClient";
import { FolderHeaderClient } from "./FolderHeaderClient";
import { BottomActionsClient } from "./BottomActionsClient";
import Link from "next/link";

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ folder, words }, stats] = await Promise.all([
    getWordsByFolder(id),
    getFolderStats(id),
  ]);

  const learnedPct = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0;
  const seenPct    = stats.total > 0 ? Math.round((stats.seen    / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#020202] text-zinc-100">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-8 pt-6 pb-12 space-y-8 animate-fade-in-up">
        {/* Navigation & Header */}
        <header className="space-y-4">
          <Link
            href="/dashboard/folders"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white font-black text-[9px] uppercase tracking-[0.3em] transition-all group"
          >
            <div className="w-7 h-7 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-zinc-800 transition-all shadow-lg">
               <span className="group-hover:-translate-x-0.5 transition-transform text-xs">←</span>
            </div>
            Papkalar
          </Link>

          <div className="space-y-4">
            <FolderHeaderClient folder={folder} stats={stats} />
          </div>
        </header>

        <FolderDetailClient folderId={folder.id} initialWords={words} />
      </main>

      {/* STICKY BOTTOM ACTIONS BARS */}
      {words.length > 0 && (
        <footer className="sticky bottom-0 z-[60] mt-auto">
          <BottomActionsClient folderId={folder.id} dueCount={stats.dueNow} />
        </footer>
      )}
    </div>
  );
}
