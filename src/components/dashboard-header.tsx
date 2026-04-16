import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function DashboardHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-black text-sm group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">V</div>
            <span className="text-lg font-black tracking-tighter text-white sm:block hidden">Vocabry</span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-xs sm:text-sm font-bold text-zinc-400 hover:text-white transition-colors">
              Asosiy
            </Link>
            <Link href="/dashboard/folders" className="text-xs sm:text-sm font-bold text-zinc-400 hover:text-white transition-colors">
              Papkalar
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-zinc-500 font-medium hidden md:block max-w-[120px] truncate">
            {session?.user?.name || session?.user?.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-[10px] sm:text-xs font-black text-zinc-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 px-3 py-2 sm:py-1.5 rounded-lg transition-all active:scale-95 uppercase tracking-widest"
            >
              Chiqish
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
