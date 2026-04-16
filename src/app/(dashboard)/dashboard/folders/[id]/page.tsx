import { getWordsByFolder } from "@/actions/customWords";
import { FolderDetailClient } from "./FolderDetailClient";
import Link from "next/link";

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { folder, words } = await getWordsByFolder(id);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-4 sm:p-8 text-zinc-100">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link href="/dashboard/folders" className="text-zinc-500 hover:text-white font-bold text-sm transition-colors">
            ← Papkalarga qaytish
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight text-white">{folder.name}</h1>
            <p className="text-zinc-500 text-sm font-medium">{words.length} ta so&apos;z</p>
          </div>
          {words.length > 0 && (
            <Link href={`/dashboard/folders/${folder.id}/study`}>
              <button className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-5 h-10 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 text-sm flex items-center gap-2">
                🧠 Yodlash
              </button>
            </Link>
          )}
        </header>
        <FolderDetailClient folderId={folder.id} initialWords={words} />
      </div>
    </div>
  );
}
