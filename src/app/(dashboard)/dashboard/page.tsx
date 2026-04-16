import { auth } from "@/auth";
import { getFolders } from "@/actions/folders";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const folders = await getFolders();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-4 sm:p-8 text-zinc-100">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        {/* Greeter */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Salom, {session.user.name?.split(" ")[0] || "Foydalanuvchi"} 👋
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">
            O&apos;z papkalaringizga so&apos;z qo&apos;shing va yodlashni boshlang.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/folders">
            <div className="bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-emerald-500/30 rounded-2xl p-6 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">📁</div>
              <div>
                <h3 className="font-black text-white group-hover:text-emerald-400 transition-colors">Papkalar</h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">{folders.length} ta papka</p>
              </div>
            </div>
          </Link>

          {folders.length > 0 && (
            <Link href={`/dashboard/folders/${folders[0].id}/study`}>
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-6 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer">
                <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">🧠</div>
                <div>
                  <h3 className="font-black text-emerald-400">Yodlashni boshlash</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">{folders[0].name}</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Folder list */}
        {folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-white/10 rounded-3xl">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-black text-white/60 mb-2">Hali papka yo&apos;q</h3>
            <p className="text-zinc-600 text-sm font-medium mb-6 max-w-xs">
              Birinchi papkangizni yarating va so&apos;zlarni qo&apos;shishni boshlang
            </p>
            <Link href="/dashboard/folders">
              <button className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/20">
                + Papka yaratish
              </button>
            </Link>
          </div>
        ) : (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-white">Papkalarim</h2>
              <Link href="/dashboard/folders">
                <span className="text-emerald-400 hover:text-emerald-300 font-bold text-sm transition-colors">
                  Hammasi →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {folders.slice(0, 6).map((folder) => (
                <div key={folder.id} className="bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 transition-all group">
                  <Link href={`/dashboard/folders/${folder.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-lg shrink-0">📁</div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white truncate text-sm">{folder.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{folder._count.words} so&apos;z</p>
                    </div>
                  </Link>
                  {folder._count.words > 0 && (
                    <Link
                      href={`/dashboard/folders/${folder.id}/study`}
                      className="shrink-0 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-black transition-colors"
                    >
                      Yodlash
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
