import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="p-4 sm:p-6 text-zinc-100 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-white tracking-tight mb-8">Sozlamalar</h1>

      <div className="space-y-6">
        {/* Profile Info */}
        <section className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">Profil</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-2xl font-black text-emerald-400">
              {session.user.name?.[0] || session.user.email?.[0] || "U"}
            </div>
            <div>
              <p className="font-bold text-white text-lg">{session.user.name || "Foydalanuvchi"}</p>
              <p className="text-zinc-500 text-sm">{session.user.email}</p>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">Harakatlar</h2>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] border border-red-500/20 text-red-400 py-4 rounded-2xl font-black text-sm transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              CHIQISH
            </button>
          </form>
        </section>

        <p className="text-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em] pt-4">
          Vocabry v0.1.0
        </p>
      </div>
    </div>
  );
}
