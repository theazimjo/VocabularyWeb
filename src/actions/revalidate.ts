"use server";

import { revalidatePath } from "next/cache";

/**
 * Manually revalidate the folder path after a study session is completed.
 * This ensures the progress bars and word stats are updated.
 */
export async function revalidateFolder(folderId: string) {
  if (!folderId) return;
  
  // Revalidate folder list
  revalidatePath("/dashboard/folders");
  
  // Revalidate specific folder detail
  revalidatePath(`/dashboard/folders/${folderId}`);
}
