"use client";

import { useState } from "react";
import { registerUser } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      setLoading(false);
      return;
    }

    try {
      await registerUser({ name, email, password });
      router.push("/login?registered=1");
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-black text-white mb-1">Ro'yxatdan o'tish</h1>
          <p className="text-zinc-500 text-sm font-medium">Yangi akkount yarating</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">Ism</label>
              <Input
                name="name"
                type="text"
                placeholder="Ismingiz"
                required
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-11 rounded-xl"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">Email</label>
              <Input
                name="email"
                type="email"
                placeholder="email@example.com"
                required
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-11 rounded-xl"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">Parol</label>
              <Input
                name="password"
                type="password"
                placeholder="Kamida 6 ta belgi"
                required
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-11 rounded-xl"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-black font-black h-11 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
            >
              {loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-600 mt-6 font-medium">
          Akkountingiz bormi?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
}
