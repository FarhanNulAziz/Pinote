import { getSupabaseAdmin } from "./supabase";
import type { Item } from "./types";

export type PrivacyItem = Pick<Item, "folder_id" | "is_private">;
export type PrivacyMode = "visible" | "private" | "all";

export async function getPrivateFolderIds(): Promise<Set<string>> {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .select("id")
    .eq("is_private", true);

  if (error) {
    throw new Error("Gagal memuat status privasi folder.");
  }

  return new Set((data ?? []).map((folder) => folder.id as string));
}

export function isItemPrivate(
  item: PrivacyItem,
  privateFolderIds: ReadonlySet<string>,
): boolean {
  return (
    item.is_private ||
    (item.folder_id !== null && privateFolderIds.has(item.folder_id))
  );
}

export function filterItemsByPrivacy<T extends PrivacyItem>(
  items: T[],
  privateFolderIds: ReadonlySet<string>,
  mode: PrivacyMode,
): T[] {
  if (mode === "all") {
    return items;
  }

  const wantPrivate = mode === "private";

  return items.filter(
    (item) => isItemPrivate(item, privateFolderIds) === wantPrivate,
  );
}

export function withEffectivePrivacy<T extends PrivacyItem>(
  items: T[],
  privateFolderIds: ReadonlySet<string>,
): (T & { is_effectively_private: boolean })[] {
  return items.map((item) => ({
    ...item,
    is_effectively_private: isItemPrivate(item, privateFolderIds),
  }));
}
