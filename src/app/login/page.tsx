import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LoginPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-emerald-500/8 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 group mb-6">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-black text-lg group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">V</div>
              <span className="text-xl font-black tracking-tighter text-white">Vocabry</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white mb-1">Tizimga kirish</h1>
          <p className="text-zinc-500 text-sm font-medium">Email va parolingizni kiriting</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <form
            action={async (formData) => {
              "use server";
              let success = false;
              try {
                await signIn("credentials", {
                  email: formData.get("email"),
                  password: formData.get("password"),
                  redirect: false,
                });
                success = true;
              } catch (error) {
                if (error instanceof AuthError) {
                  redirect("/login?error=CredentialsSignin");
                }
                throw error;
              }
              if (success) redirect("/dashboard");
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">Email</label>
              <Input
                name="email"
                type="email"
                placeholder="email@example.com"
                required
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">Parol</label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-11 rounded-xl"
              />
            </div>

            {searchParams?.error && (
              <div className="text-red-400 text-sm font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
                Email yoki parol noto&apos;g&apos;ri
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black h-11 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
            >
              Kirish
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-600 mt-6 font-medium">
          Akkountingiz yo&apos;qmi?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </p>
      </div>
    </div>
  );
}
