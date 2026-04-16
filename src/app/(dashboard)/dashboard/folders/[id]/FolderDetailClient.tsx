"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { addWordToFolder, deleteWord, updateWord } from "@/actions/customWords";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [form, setForm] = useState({ english_word: "", uzbek_translation: "", example: "" });

  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setForm({ english_word: "", uzbek_translation: "", example: "" });
    setEditingWord(null);
    setModalOpen(false);
  };

  const openAdd = () => {
    setEditingWord(null);
    setForm({ english_word: "", uzbek_translation: "", example: "" });
    setModalOpen(true);
  };

  const openEdit = (word: any) => {
    setEditingWord(word);
    setForm({
      english_word: word.english_word,
      uzbek_translation: word.uzbek_translation,
      example: word.example || "",
    });
    setModalOpen(true);
    setActiveMenu(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.english_word.trim() || !form.uzbek_translation.trim()) return;

    startTransition(async () => {
      try {
        if (editingWord) {
          await updateWord(editingWord.id, form);
          toast.success("O'zgartirildi!");
        } else {
          await addWordToFolder(folderId, form);
          toast.success("So'z qo'shildi!");
        }
        resetForm();
      } catch {
        toast.error("Xatolik yuz berdi");
      }
    });
  };

  const handleDelete = async (wordId: string) => {
    if (!confirm("Bu so'zni o'chirasizmi?")) return;
    startTransition(async () => {
      try {
        await deleteWord(wordId);
        toast.success("So'z o'chirildi");
        setActiveMenu(null);
      } catch {
        toast.error("Xatolik yuz berdi");
      }
    });
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`space-y-6 font-sans transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex justify-between items-center bg-zinc-900/40 p-3.5 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Lug&apos;at
          </h3>
          <p className="text-zinc-400 text-[10px] font-black">
            {initialWords.length} <span className="opacity-40 tracking-tighter ml-1">TA SO&apos;Z</span>
          </p>
        </div>
        
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl border border-emerald-500/20 transition-all active:scale-95 group"
        >
          <span className="text-lg font-black leading-none group-hover:rotate-90 transition-transform">+</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Qo&apos;shish</span>
        </button>
      </div>

      {initialWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 px-6 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-zinc-900/10">
          <div className="text-6xl mb-6 grayscale opacity-30">📚</div>
          <h3 className="text-xl font-black text-white/40 mb-1 tracking-tight">Lug&apos;at hali bo&apos;sh</h3>
          <p className="text-zinc-700 text-sm font-medium">Boshlash uchun yangi so&apos;z qo&apos;shing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {initialWords.map((word) => (
            <div
              key={word.id}
              className={`group bg-zinc-900/30 backdrop-blur-md border border-white/5 hover:border-emerald-500/20 hover:bg-zinc-900/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all duration-300 relative ${activeMenu === word.id ? "z-50 border-white/20" : "z-10"}`}
            >
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-white text-[15px] sm:text-base tracking-tight">{word.english_word}</span>
                  <div className="h-3 w-px bg-white/10" />
                  <span className="text-emerald-400 font-bold text-sm sm:text-[15px] line-clamp-1">{word.uzbek_translation}</span>
                </div>
                {word.example && (
                  <p className="text-[10px] text-zinc-600 italic mt-1.5 font-medium leading-relaxed truncate opacity-60 group-hover:opacity-100 transition-opacity">&ldquo;{word.example}&rdquo;</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => speak(word.english_word)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900/50 hover:bg-emerald-500 text-zinc-500 hover:text-black border border-white/5 transition-all active:scale-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === word.id ? null : word.id)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 ${activeMenu === word.id ? 'bg-white/10 text-white border border-white/20' : 'text-zinc-700 hover:text-white hover:bg-zinc-800 border border-transparent'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenu === word.id && (
                    <div
                      className="absolute right-0 top-12 w-44 bg-zinc-900 border border-white/10 rounded-[1.5rem] shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-3xl"
                      ref={menuRef}
                    >
                      <button
                        onClick={() => openEdit(word)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDelete(word.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all mt-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        O&apos;chirish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB removed and moved to header */}

      {/* Modal - Bottom Sheet on Mobile, Centered on Desktop */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex sm:items-center items-end justify-center backdrop-blur-md bg-black/60 animate-in fade-in duration-300"
          onClick={resetForm}
        >
          <div
            className="bg-[#0c0c0e] border-t sm:border border-white/10 w-full max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl p-8 sm:p-10 animate-in slide-in-from-bottom-full duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />

            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {editingWord ? "Tahrirlash" : "Yangi so&apos;z"}
              </h2>
              <button
                onClick={resetForm}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all active:scale-90"
              >✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Inglizcha</label>
                  <Input
                    placeholder="..."
                    value={form.english_word}
                    onChange={(e) => setForm({ ...form, english_word: e.target.value })}
                    required
                    className="bg-zinc-900 border-white/5 text-white placeholder:text-white/10 focus-visible:ring-emerald-500/30 h-14 rounded-2xl text-lg font-bold"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">O&apos;zbekcha</label>
                  <Input
                    placeholder="..."
                    value={form.uzbek_translation}
                    onChange={(e) => setForm({ ...form, uzbek_translation: e.target.value })}
                    required
                    className="bg-zinc-900 border-white/5 text-white placeholder:text-white/10 focus-visible:ring-emerald-500/30 h-14 rounded-2xl text-lg font-bold"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2 pb-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Example</label>
                  <textarea
                    placeholder="Gapda misol keltiring..."
                    value={form.example}
                    onChange={(e) => setForm({ ...form, example: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 p-4 min-h-[100px] rounded-2xl text-sm font-medium resize-none transition-all"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isPending}
                  className="h-14 sm:h-auto rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-600 hover:text-white transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isPending || !form.english_word || !form.uzbek_translation}
                  className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-40"
                >
                  {isPending ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}