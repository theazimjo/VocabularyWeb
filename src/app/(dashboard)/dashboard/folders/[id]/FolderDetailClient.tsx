"use client";

import { useState, useTransition } from "react";
import { addWordToFolder, deleteWord } from "@/actions/customWords";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function FolderDetailClient({
  folderId,
  initialWords,
}: {
  folderId: string;
  initialWords: any[];
}) {
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ english_word: "", uzbek_translation: "", example: "" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.english_word.trim() || !form.uzbek_translation.trim()) return;
    startTransition(async () => {
      try {
        await addWordToFolder(folderId, form);
        setForm({ english_word: "", uzbek_translation: "", example: "" });
        setAdding(false);
        toast.success("So'z qo'shildi!");
      } catch {
        toast.error("Xatolik yuz berdi");
      }
    });
  };

  const handleDelete = async (e: React.MouseEvent, wordId: string) => {
    e.preventDefault();
    if (!confirm("Bu so'zni o'chirasizmi?")) return;
    startTransition(async () => {
      try {
        await deleteWord(wordId);
        toast.success("So'z o'chirildi");
      } catch {
        toast.error("Xatolik yuz berdi");
      }
    });
  };

  return (
    <div className="space-y-6">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-black font-black h-11 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
        >
          + Yangi so&apos;z qo&apos;shish
        </button>
      ) : (
        <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1">Inglizcha *</label>
                <Input
                  placeholder="masalan: Ephemeral"
                  value={form.english_word}
                  onChange={(e) => setForm({ ...form, english_word: e.target.value })}
                  required
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-11 rounded-xl text-base sm:text-sm"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1">O&apos;zbekcha *</label>
                <Input
                  placeholder="masalan: O'tkinchi"
                  value={form.uzbek_translation}
                  onChange={(e) => setForm({ ...form, uzbek_translation: e.target.value })}
                  required
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-11 rounded-xl text-base sm:text-sm"
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1">Misol jumla (ixtiyoriy)</label>
              <Input
                placeholder="masalan: The ephemeral beauty of a sunset..."
                value={form.example}
                onChange={(e) => setForm({ ...form, example: e.target.value })}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-11 rounded-xl text-base sm:text-sm"
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                disabled={isPending}
                className="w-full sm:w-auto text-zinc-400 hover:text-white hover:bg-white/5 h-11 px-5 rounded-xl font-bold text-sm transition-all"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isPending || !form.english_word || !form.uzbek_translation}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-black font-black h-11 px-8 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
              >
                {isPending ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Word list */}
      {initialWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-base font-black text-white/50 mb-1">So&apos;zlar yo&apos;q</h3>
          <p className="text-zinc-600 text-sm font-medium">Yuqoridan birinchi so&apos;zni qo&apos;shing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {initialWords.map((word) => (
            <div
              key={word.id}
              className="bg-white/[0.03] border border-white/10 group active:bg-white/[0.08] hover:bg-white/[0.05] rounded-xl p-4 flex items-center justify-between gap-4 transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-bold text-white text-base">{word.english_word}</span>
                  <span className="text-emerald-400 text-sm font-semibold opacity-90">— {word.uzbek_translation}</span>
                </div>
                {word.example && (
                  <p className="text-xs text-zinc-500 italic mt-1.5 leading-relaxed line-clamp-2">&ldquo;{word.example}&rdquo;</p>
                )}
              </div>
              <button
                onClick={(e) => handleDelete(e, word.id)}
                disabled={isPending}
                className="text-zinc-600 hover:text-red-400 p-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex items-center justify-center rounded-lg hover:bg-red-500/10 font-bold text-xl shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
