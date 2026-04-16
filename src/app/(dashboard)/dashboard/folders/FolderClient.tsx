"use client";

import { useState, useTransition, useEffect } from "react";
import { createFolder, deleteFolder } from "@/actions/folders";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export function FolderClient({ initialFolders }: { initialFolders: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [folderName, setFolderName] = useState("");
  const [mounted, setMounted] = useState(false);

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
    <div className={`space-y-6 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Create form - Mobile optimized: simple stack or flex-row depending on width */}
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Input
          placeholder="Yangi papka nomi..."
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          required
          className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-12 sm:h-11 rounded-xl flex-1 text-base sm:text-sm"
          disabled={isPending}
        />
        <button
          disabled={isPending || !folderName.trim()}
          type="submit"
          className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-black font-black h-12 sm:h-11 px-5 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 whitespace-nowrap shrink-0 text-sm"
        >
          + Yaratish
        </button>
      </form>

      {/* Folder list */}
      {initialFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-lg font-black text-white/50 mb-1">Papkalar yo&apos;q</h3>
          <p className="text-zinc-600 text-sm font-medium">Yuqoridagi formadan yangi papka yarating</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {initialFolders.map((folder) => (
            <div
              key={folder.id}
              className="bg-white/[0.03] border border-white/10 active:bg-white/[0.08] hover:bg-white/[0.05] hover:border-emerald-500/20 rounded-xl p-4 flex items-center justify-between gap-3 transition-all group"
            >
              <Link href={`/dashboard/folders/${folder.id}`} className="flex items-center gap-3 overflow-hidden flex-1">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-lg shrink-0">📁</div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white truncate group-hover:text-emerald-400 transition-colors">{folder.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{folder._count.words} ta so&apos;z</p>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                {folder._count.words > 0 && (
                  <Link
                    href={`/dashboard/folders/${folder.id}/study`}
                    className="px-3 py-1.5 bg-emerald-500/10 active:bg-emerald-500/30 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] font-black transition-colors"
                  >
                    YODLASH
                  </Link>
                )}
                <button
                  onClick={(e) => handleDelete(e, folder.id)}
                  disabled={isPending}
                  className="text-zinc-600 hover:text-red-400 p-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex items-center justify-center rounded-lg hover:bg-red-500/10 font-bold text-xl"
                  title="O'chirish"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
