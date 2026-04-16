import { auth } from "@/auth";
import { getFolders } from "@/actions/folders";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [folders, learnedCount] = await Promise.all([
    getFolders(),
    prisma.userProgress.count({
      where: { userId: session.user.id, isLearned: true },
    }),
  ]);

  const totalWords = folders.reduce((s, f) => s + f._count.words, 0);
  const foldersWithWords = folders.filter((f) => f._count.words > 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 text-zinc-100">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">

        {/* Greeting */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Salom, {session.user.name?.split(" ")[0] || "Foydalanuvchi"} 👋
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">
            {totalWords === 0
              ? "Birinchi papkangizni yarating va yodlashni boshlang."
              : `${totalWords} ta so'z · ${learnedCount} ta yodlangan`}
          </p>
        </div>

        {/* If has folders with words: show study cards */}
        {foldersWithWords.length > 0 ? (
          <>
            <section className="space-y-3">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1 ml-1">
                Yodlash uchun papkalar
              </h2>
              {foldersWithWords.map((folder) => (
                <div
                  key={folder.id}
                  className="bg-white/[0.03] border border-white/10 active:bg-white/[0.08] sm:hover:border-emerald-500/25 rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-all group"
                >
                  <Link
                    href={`/dashboard/folders/${folder.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-11 h-11 shrink-0 bg-emerald-500/10 group-active:bg-emerald-500/20 sm:group-hover:bg-emerald-500/15 rounded-2xl flex items-center justify-center text-lg transition-colors">
                      📁
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white sm:group-hover:text-emerald-400 transition-colors truncate text-sm sm:text-base">
                        {folder.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-600 mt-0.5 font-bold uppercase tracking-wider">{folder._count.words} ta so'z</p>
                    </div>
                  </Link>
                </div>
              ))}
            </section>

            {/* Quick link to all folders */}
            <Link
              href="/dashboard/folders"
              className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/8 rounded-2xl transition-all group"
            >
              <span className="text-zinc-500 group-hover:text-zinc-300 font-bold text-sm transition-colors">
                Barcha papkalar ({folders.length})
              </span>
              <span className="text-zinc-600 group-hover:text-emerald-400 transition-colors">→</span>
            </Link>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-white/10 rounded-3xl space-y-4">
            <div className="text-5xl">📚</div>
            <div>
              <h3 className="text-lg font-black text-white/60">Hali so'z yo'q</h3>
              <p className="text-zinc-500 text-sm max-w-[200px]">
                Papka yarating, so'zlarni qo'shing va yodlashni boshlang
              </p>
            </div>
            <Link href="/dashboard/folders">
              <button className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-black font-black px-7 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 text-sm">
                + Papka yaratish
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
