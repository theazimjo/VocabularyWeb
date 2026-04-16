import { getFolders } from "@/actions/folders";
import { FolderClient } from "./FolderClient";

export default async function FoldersPage() {
  const folders = await getFolders();
  const totalWords = folders.reduce((sum: number, f: any) => sum + f._count.words, 0);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-4 sm:p-8 text-zinc-100">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        <header>
          <h1 className="text-3xl font-black tracking-tight text-white">Papkalar</h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            {folders.length} ta papka · {totalWords} ta so&apos;z
          </p>
        </header>
        <FolderClient initialFolders={folders} />
      </div>
    </div>
  );
}
