import { getWordsByFolder } from "@/actions/customWords";
import { getFolderStats } from "@/actions/progress";
import { FolderDetailClient } from "./FolderDetailClient";
import { FolderHeaderClient } from "./FolderHeaderClient";
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
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 text-zinc-100">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">

        {/* Header Navigation */}
        <header className="space-y-6">
          <Link
            href="/dashboard/folders"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white font-bold text-sm transition-all group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Papkalar
          </Link>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <FolderHeaderClient folder={folder} stats={stats} />
              
              {words.length > 0 && (
                <div className="flex gap-2">
                  <Link href={`/dashboard/folders/${folder.id}/study?mode=flashcard`} className="flex-1 sm:flex-none">
                    <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-zinc-300 font-bold px-4 h-11 rounded-2xl transition-all text-xs flex items-center justify-center gap-2">
                      🔄 Flashkarta
                    </button>
                  </Link>
                  <Link href={`/dashboard/folders/${folder.id}/study`} className="flex-1 sm:flex-none">
                    <button className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-black font-black px-6 h-11 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-sm flex items-center justify-center gap-2">
                      🧠 Yodlash
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Progress bars */}
            {stats.total > 0 && (
              <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-6 space-y-5 shadow-xl">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    <span>O&apos;zlashtirish</span>
                    <span className="text-emerald-400">{learnedPct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                      style={{ width: `${learnedPct}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    <span>Sessiya qamrovi</span>
                    <span className="text-blue-400">{seenPct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500/70 rounded-full transition-all duration-1000"
                      style={{ width: `${seenPct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <FolderDetailClient folderId={folder.id} initialWords={words} />
      </div>
    </div>
  );
}
