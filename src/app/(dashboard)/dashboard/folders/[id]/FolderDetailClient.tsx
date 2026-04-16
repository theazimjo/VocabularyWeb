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
  
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em]">Sizning so&apos;zlaringiz</h3>
        <button
          onClick={openAdd}
          className="bg-emerald-500 text-black font-black h-9 px-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 text-xs flex items-center gap-2"
        >
          <span>+</span> Qo&apos;shish
        </button>
      </div>

      {initialWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
          <div className="text-5xl mb-4 grayscale opacity-50">📚</div>
          <h3 className="text-lg font-black text-white/40 mb-1">Ro&apos;yxat bo&apos;sh</h3>
          <p className="text-zinc-700 text-sm font-medium">Hoziroq birinchi so&apos;zni qo&apos;shing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {initialWords.map((word) => (
            <div
              key={word.id}
              className="bg-zinc-900/30 border border-white/5 hover:border-white/10 group rounded-2xl p-4 flex items-center justify-between gap-4 transition-all relative"
            >
              <div className="min-w-0 flex-1 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-white text-[15px] sm:text-base leading-tight tracking-tight">{word.english_word}</span>
                  <span className="text-zinc-500 text-xs font-medium opacity-60">•</span>
                  <span className="text-emerald-500/80 text-sm sm:text-[15px] font-bold truncate">{word.uzbek_translation}</span>
                </div>
                {word.example && (
                  <p className="text-[11px] text-zinc-600 italic mt-1 font-medium leading-relaxed truncate">&ldquo;{word.example}&rdquo;</p>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => speak(word.english_word)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-500/5 hover:bg-emerald-500 text-emerald-500 hover:text-black transition-all active:scale-90"
                  title="Eshitish"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === word.id ? null : word.id)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 ${activeMenu === word.id ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenu === word.id && (
                    <div 
                      className="absolute right-0 top-11 w-40 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-40 p-1.5 animate-in fade-in zoom-in-95 duration-150"
                      ref={menuRef}
                    >
                      <button
                        onClick={() => openEdit(word)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-black text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDelete(word.id)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-black text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
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

      {/* Modal - Bottom Sheet on Mobile, Centered on Desktop */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 flex sm:items-center items-end justify-center backdrop-blur-md bg-black/60 animate-in fade-in duration-300"
          onClick={resetForm}
        >
          <div 
            className="bg-[#0c0c0e] border-t sm:border border-white/10 w-full max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl p-8 sm:p-10 animate-in slide-in-from-bottom-1/2 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {editingWord ? "Tahrirlash" : "Yangi so'z"}
              </h2>
              <button onClick={resetForm} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">✕</button>
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
                    className="bg-white/[0.03] border-white/5 text-white placeholder:text-white/10 focus-visible:ring-emerald-500/30 h-14 rounded-2xl text-lg font-bold transition-all"
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
                    className="bg-white/[0.03] border-white/5 text-white placeholder:text-white/10 focus-visible:ring-emerald-500/30 h-14 rounded-2xl text-lg font-bold transition-all"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2 pb-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Example</label>
                  <textarea
                    placeholder="Gapda ishlatib ko'ring..."
                    value={form.example}
                    onChange={(e) => setForm({ ...form, example: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 p-4 min-h-[100px] rounded-2xl text-sm font-medium resize-none transition-all"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-3 pb-safe">
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
                  className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-40"
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
