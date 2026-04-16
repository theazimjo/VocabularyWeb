"use client";

import { useState, useTransition } from "react";
import { updateFolder } from "@/actions/folders";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function FolderHeaderClient({
  folder,
  stats,
}: {
  folder: any;
  stats: any;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRename = () => {
    if (!name.trim() || name === folder.name) {
      setIsEditing(false);
      setName(folder.name);
      return;
    }

    startTransition(async () => {
      try {
        await updateFolder(folder.id, name);
        setIsEditing(false);
        toast.success("Papka nomi o'zgartirildi");
      } catch {
        toast.error("Xatolik yuz berdi");
        setName(folder.name);
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2 max-w-md animate-in slide-in-from-left-2 duration-200">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10 text-white font-bold text-2xl h-12 rounded-2xl focus-visible:ring-emerald-500/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setIsEditing(false); setName(folder.name); }
              }}
              disabled={isPending}
            />
            <button
              onClick={handleRename}
              disabled={isPending}
              className="p-3 rounded-2xl bg-emerald-500 text-black font-black hover:bg-emerald-400 active:scale-90 transition-all shadow-lg shadow-emerald-500/10"
            >
              ✓
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight truncate">
              {folder.name}
            </h1>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-xl text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Nomini o'zgartirish"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
        )}
        <p className="text-zinc-500 text-sm font-medium mt-1">
          {stats.total} ta so&apos;z · {stats.learned} ta yodlangan
        </p>
      </div>
    </div>
  );
}
