"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { createFolder, deleteFolder } from "@/actions/folders";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export function FolderClient({ initialFolders }: { initialFolders: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [folderName, setFolderName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    startTransition(async () => {
      try {
        await createFolder(folderName);
        setFolderName("");
        setIsModalOpen(false);
        toast.success("Papka yaratildi!");
      } catch {
        toast.error("Xatolik yuz berdi");
      }
    });
  };

  const handleDelete = async (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Bu papka va undagi barcha so'zlar o'chiriladi. Davom etasizmi?")) return;
    startTransition(async () => {
      try {
        await deleteFolder(folderId);
        toast.success("Papka o'chirildi");
      } catch {
        toast.error("Xatolik yuz berdi");
      }
    });
  };

  return (
    <div className={`transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Folder list */}
      {initialFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-white/10 rounded-[2.5rem] bg-zinc-900/10">
          <div className="text-6xl mb-6 grayscale opacity-20">📁</div>
          <h3 className="text-xl font-black text-white/40 mb-1 tracking-tight">Papkalar yo'q</h3>
          <p className="text-zinc-700 text-sm font-medium">Boshlash uchun yangi papka yarating</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {initialFolders.map((folder) => (
            <div
              key={folder.id}
              className="bg-white/[0.03] border border-white/10 active:bg-white/[0.08] sm:hover:border-emerald-500/20 rounded-[22px] p-4.5 flex items-center justify-between gap-3 transition-all group"
            >
              <Link href={`/dashboard/folders/${folder.id}`} className="flex items-center gap-4 overflow-hidden flex-1">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-2xl shrink-0">📁</div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white truncate sm:group-hover:text-emerald-400 transition-colors text-sm sm:text-base tracking-tight">{folder.name}</h3>
                  <p className="text-[10px] sm:text-xs text-zinc-600 mt-1 font-black uppercase tracking-[0.15em]">{folder._count.words} ta so'z</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Render FAB and Modal in a Portal to break out of CSS transform containers */}
      {mounted && createPortal(
        <>
          {/* FAB - Floating Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-[100px] right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-black rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 transition-all z-[60] group border-4 border-black"
            aria-label="Yangi papka yaratish"
          >
            <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Modal Dialog */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setIsModalOpen(false)}
              />
              <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white tracking-tight">Yangi papka</h2>
                  <p className="text-zinc-500 text-sm mt-1 font-medium">Nomini kiriting va boshlang</p>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Nomi</label>
                    <Input
                      placeholder="Masalan: IELTS Vocabulary"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      autoFocus
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-700 h-14 rounded-2xl focus-visible:ring-emerald-500/50 text-base"
                      disabled={isPending}
                    />
                  </div>
                  <button
                    disabled={isPending || !folderName.trim()}
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black h-14 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 text-sm uppercase tracking-widest mt-2"
                  >
                    {isPending ? "Yaratilmoqda..." : "Yaratish"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}
