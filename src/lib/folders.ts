import { attachImageUrls, ITEM_COLUMNS } from "./items";
import { getSupabaseAdmin } from "./supabase";
import { attachTags } from "./tags";
import type { Folder, FolderSummary, Item, ItemType } from "./types";

const FOLDER_COLUMNS = "id,name,is_private,created_at";

export async function listFolders(): Promise<Folder[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .select(FOLDER_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat folder.");
  }

  return (data ?? []) as Folder[];
}

export async function getFolder(id: string): Promise<Folder | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .select(FOLDER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat folder.");
  }

  return (data as Folder | null) ?? null;
}

export async function createFolder(
  name: string,
  isPrivate = false,
): Promise<Folder> {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .insert({ name, is_private: isPrivate })
    .select(FOLDER_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("Gagal membuat folder.");
  }

  return data as Folder;
}

export async function updateFolder(
  id: string,
  input: { name?: string; isPrivate?: boolean },
): Promise<Folder | null> {
  const patch: Record<string, string | boolean> = {};

  if (input.name !== undefined) {
    patch.name = input.name;
  }

  if (input.isPrivate !== undefined) {
    patch.is_private = input.isPrivate;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .update(patch)
    .eq("id", id)
    .select(FOLDER_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal mengubah folder.");
  }

  return (data as Folder | null) ?? null;
}

export async function deleteFolder(id: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error("Gagal menghapus folder.");
  }

  return Boolean(data);
}

export async function listFolderItems(folderId: string): Promise<Item[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("folder_id", folderId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat item folder.");
  }

  const items = await attachImageUrls((data ?? []) as Item[]);
  return attachTags(items);
}

export async function listFoldersWithSummary(): Promise<FolderSummary[]> {
  const folders = await listFolders();

  if (folders.length === 0) {
    return [];
  }

  const { data, error } = await getSupabaseAdmin()
    .from("items")
    .select(ITEM_COLUMNS)
    .not("folder_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat isi folder.");
  }

  const items = await attachImageUrls((data ?? []) as Item[]);
  const itemsByFolder = new Map<string, Item[]>();

  for (const item of items) {
    if (!item.folder_id) {
      continue;
    }

    const group = itemsByFolder.get(item.folder_id);

    if (group) {
      group.push(item);
    } else {
      itemsByFolder.set(item.folder_id, [item]);
    }
  }

  return folders.map((folder) => {
    const folderItems = itemsByFolder.get(folder.id) ?? [];
    const counts: Record<ItemType, number> = { link: 0, image: 0, text: 0 };

    for (const item of folderItems) {
      counts[item.type] += 1;
    }

    return {
      ...folder,
      itemCount: folderItems.length,
      counts,
      previewItems: folderItems.slice(0, 4),
    };
  });
}
