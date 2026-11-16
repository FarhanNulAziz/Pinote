import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "./supabase";
import { attachTags, setItemTags } from "./tags";
import type { HomeFilter, Item } from "./types";
import type {
  NewItemInput,
  UpdatedItemInput,
  ValidatedImage,
} from "./validation";

export const ITEM_COLUMNS =
  "id,type,title,url,content,note,image_path,folder_id,is_favorite,is_private,created_at";
const IMAGE_BUCKET = "images";
const IMAGE_SIGNED_URL_TTL = 60 * 60;

export async function attachImageUrls(items: Item[]): Promise<Item[]> {
  const imagePaths = items
    .filter((item) => item.type === "image" && item.image_path)
    .map((item) => item.image_path as string);

  if (imagePaths.length === 0) {
    return items;
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(IMAGE_BUCKET)
    .createSignedUrls(imagePaths, IMAGE_SIGNED_URL_TTL);

  if (error || !data) {
    return items;
  }

  const urlByPath = new Map<string, string>();

  for (const entry of data) {
    if (entry.path && entry.signedUrl) {
      urlByPath.set(entry.path, entry.signedUrl);
    }
  }

  return items.map((item) => {
    if (item.type !== "image" || !item.image_path) {
      return item;
    }

    return { ...item, image_url: urlByPath.get(item.image_path) ?? null };
  });
}

export async function listItems(filter: HomeFilter = "all"): Promise<Item[]> {
  const types: Item["type"][] =
    filter === "all" || filter === "favorite" || filter === "private"
      ? ["link", "image", "text"]
      : [filter];

  let query = getSupabaseAdmin()
    .from("items")
    .select(ITEM_COLUMNS)
    .in("type", types);

  if (filter === "favorite") {
    query = query.eq("is_favorite", true);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    throw new Error("Gagal memuat item.");
  }

  const items = await attachImageUrls((data ?? []) as Item[]);
  return attachTags(items);
}

const SEARCH_COLUMNS = ["title", "url", "content", "note"] as const;

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export async function searchItems(
  query: string,
  types: Item["type"][] = ["link", "image", "text"],
): Promise<Item[]> {
  const pattern = `%${escapeLikePattern(query)}%`;

  const matches = await Promise.all(
    SEARCH_COLUMNS.map(async (column) => {
      const { data, error } = await getSupabaseAdmin()
        .from("items")
        .select(ITEM_COLUMNS)
        .in("type", types)
        .ilike(column, pattern)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("Gagal mencari item.");
      }

      return (data ?? []) as Item[];
    }),
  );

  const byId = new Map<string, Item>();

  for (const items of matches) {
    for (const item of items) {
      byId.set(item.id, item);
    }
  }

  const client = getSupabaseAdmin();
  const { data: tagRows, error: tagError } = await client
    .from("tags")
    .select("id")
    .ilike("name", pattern);

  if (tagError) {
    throw new Error("Gagal mencari item.");
  }

  const tagIds = (tagRows ?? []).map((tag) => tag.id as string);

  if (tagIds.length > 0) {
    const { data: linkRows, error: linkError } = await client
      .from("item_tags")
      .select("item_id")
      .in("tag_id", tagIds);

    if (linkError) {
      throw new Error("Gagal mencari item.");
    }

    const itemIds = Array.from(
      new Set((linkRows ?? []).map((link) => link.item_id as string)),
    );

    if (itemIds.length > 0) {
      const { data: tagItems, error: tagItemError } = await client
        .from("items")
        .select(ITEM_COLUMNS)
        .in("type", types)
        .in("id", itemIds)
        .order("created_at", { ascending: false });

      if (tagItemError) {
        throw new Error("Gagal mencari item.");
      }

      for (const item of (tagItems ?? []) as Item[]) {
        byId.set(item.id, item);
      }
    }
  }

  const items = Array.from(byId.values()).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const withImageUrls = await attachImageUrls(items);
  return attachTags(withImageUrls);
}

export async function getItem(id: string): Promise<Item | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat item.");
  }

  if (!data) {
    return null;
  }

  const items = await attachImageUrls([data as Item]);
  const withTags = await attachTags(items);
  return withTags[0] ?? null;
}

export async function updateItem(
  id: string,
  input: UpdatedItemInput,
): Promise<Item | null> {
  const patch: Record<string, string | boolean | null> = {};

  if (input.title !== undefined) {
    patch.title = input.title;
  }

  if (input.isFavorite !== undefined) {
    patch.is_favorite = input.isFavorite;
  }

  if (input.folderId !== undefined) {
    patch.folder_id = input.folderId;
  }

  if (input.note !== undefined) {
    patch.note = input.note;
  }

  if (input.isPrivate !== undefined) {
    patch.is_private = input.isPrivate;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("items")
    .update(patch)
    .eq("id", id)
    .select(ITEM_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memperbarui item.");
  }

  if (!data) {
    return null;
  }

  if (input.tags !== undefined) {
    await setItemTags(id, input.tags);
  }

  const items = await attachImageUrls([data as Item]);
  const withTags = await attachTags(items);
  return withTags[0] ?? null;
}

export async function deleteItem(id: string): Promise<boolean> {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from("items")
    .delete()
    .eq("id", id)
    .select("type,image_path")
    .maybeSingle();

  if (error) {
    throw new Error("Gagal menghapus item.");
  }

  if (!data) {
    return false;
  }

  const deleted = data as { type: Item["type"]; image_path: string | null };

  if (deleted.type === "image" && deleted.image_path) {
    await client.storage
      .from(IMAGE_BUCKET)
      .remove([deleted.image_path])
      .catch(() => undefined);
  }

  return true;
}

export async function createItem(input: NewItemInput): Promise<Item> {
  const client = getSupabaseAdmin();
  const payload: Record<string, string | boolean | null> =
    input.type === "link"
      ? {
          type: input.type,
          title: input.title,
          url: input.url,
          note: input.note,
          is_private: input.isPrivate,
          folder_id: input.folderId,
        }
      : {
          type: input.type,
          title: input.title,
          content: input.content,
          note: input.note,
          is_private: input.isPrivate,
          folder_id: input.folderId,
        };

  const { data, error } = await client
    .from("items")
    .insert(payload)
    .select(ITEM_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("Gagal menyimpan item.");
  }

  const item = data as Item;

  try {
    const tags = await setItemTags(item.id, input.tags);
    return { ...item, tags };
  } catch (tagError) {
    await client.from("items").delete().eq("id", item.id);
    throw tagError;
  }
}

export async function createImageItem(input: ValidatedImage): Promise<Item> {
  const client = getSupabaseAdmin();
  const storage = client.storage.from(IMAGE_BUCKET);
  const imagePath = `${randomUUID()}.${input.extension}`;

  const { error: uploadError } = await storage.upload(imagePath, input.bytes, {
    contentType: input.mimeType,
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    throw new Error("Gagal mengunggah gambar.");
  }

  const { data, error } = await client
    .from("items")
    .insert({
      type: "image",
      title: input.title,
      image_path: imagePath,
      note: input.note,
      is_private: input.isPrivate,
      folder_id: input.folderId,
    })
    .select(ITEM_COLUMNS)
    .single();

  if (error || !data) {
    await storage.remove([imagePath]).catch(() => undefined);
    throw new Error("Gagal menyimpan item.");
  }

  const item = data as Item;

  try {
    const tags = await setItemTags(item.id, input.tags);
    return { ...item, tags };
  } catch (tagError) {
    await client.from("items").delete().eq("id", item.id);
    await storage.remove([imagePath]).catch(() => undefined);
    throw tagError;
  }
}
