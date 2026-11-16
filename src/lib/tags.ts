import { filterItemsByPrivacy, getPrivateFolderIds } from "./privacy";
import { getSupabaseAdmin } from "./supabase";
import type { Item, PopularTag, Tag } from "./types";

type ItemTagLink = {
  item_id: string;
  tag_id: string;
};

export async function attachTags(items: Item[]): Promise<Item[]> {
  if (items.length === 0) {
    return items;
  }

  const itemIds = items.map((item) => item.id);
  const client = getSupabaseAdmin();
  const { data: links, error: linkError } = await client
    .from("item_tags")
    .select("item_id,tag_id")
    .in("item_id", itemIds);

  if (linkError) {
    throw new Error("Gagal memuat tag item.");
  }

  const itemLinks = (links ?? []) as ItemTagLink[];

  if (itemLinks.length === 0) {
    return items.map((item) => ({ ...item, tags: [] }));
  }

  const tagIds = Array.from(new Set(itemLinks.map((link) => link.tag_id)));
  const { data: tagRows, error: tagError } = await client
    .from("tags")
    .select("id,name")
    .in("id", tagIds)
    .order("name");

  if (tagError) {
    throw new Error("Gagal memuat tag item.");
  }

  const tagById = new Map<string, Tag>(
    ((tagRows ?? []) as Tag[]).map((tag) => [tag.id, tag]),
  );
  const tagsByItem = new Map<string, Tag[]>();

  for (const link of itemLinks) {
    const tag = tagById.get(link.tag_id);

    if (!tag) {
      continue;
    }

    const group = tagsByItem.get(link.item_id);

    if (group) {
      group.push(tag);
    } else {
      tagsByItem.set(link.item_id, [tag]);
    }
  }

  return items.map((item) => ({
    ...item,
    tags: tagsByItem.get(item.id) ?? [],
  }));
}

export async function setItemTags(
  itemId: string,
  names: string[],
): Promise<Tag[]> {
  const normalized = Array.from(
    new Set(
      names
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0),
    ),
  );
  const client = getSupabaseAdmin();

  if (normalized.length === 0) {
    const { error } = await client
      .from("item_tags")
      .delete()
      .eq("item_id", itemId);

    if (error) {
      throw new Error("Gagal menyimpan tag item.");
    }

    return [];
  }

  const { data: tagRows, error: tagError } = await client
    .from("tags")
    .upsert(
      normalized.map((name) => ({ name })),
      { onConflict: "name" },
    )
    .select("id,name");

  if (tagError || !tagRows) {
    throw new Error("Gagal menyimpan tag item.");
  }

  const tagByName = new Map<string, Tag>(
    (tagRows as Tag[]).map((tag) => [tag.name, tag]),
  );
  const orderedTags = normalized
    .map((name) => tagByName.get(name))
    .filter((tag): tag is Tag => Boolean(tag));

  const { error: deleteError } = await client
    .from("item_tags")
    .delete()
    .eq("item_id", itemId);

  if (deleteError) {
    throw new Error("Gagal menyimpan tag item.");
  }

  const { error: insertError } = await client.from("item_tags").insert(
    orderedTags.map((tag) => ({
      item_id: itemId,
      tag_id: tag.id,
    })),
  );

  if (insertError) {
    throw new Error("Gagal menyimpan tag item.");
  }

  return orderedTags;
}

export async function listPopularTags(limit = 10): Promise<PopularTag[]> {
  const client = getSupabaseAdmin();
  const privateFolderIds = await getPrivateFolderIds();
  const { data: itemRows, error: itemError } = await client
    .from("items")
    .select("id,folder_id,is_private");

  if (itemError) {
    throw new Error("Gagal memuat tag populer.");
  }

  const visibleItems = filterItemsByPrivacy(
    (itemRows ?? []) as { id: string; folder_id: string | null; is_private: boolean }[],
    privateFolderIds,
    "visible",
  );
  const visibleIds = visibleItems.map((item) => item.id);

  if (visibleIds.length === 0) {
    return [];
  }

  const { data: links, error: linkError } = await client
    .from("item_tags")
    .select("item_id,tag_id")
    .in("item_id", visibleIds);

  if (linkError) {
    throw new Error("Gagal memuat tag populer.");
  }

  const itemLinks = (links ?? []) as ItemTagLink[];

  if (itemLinks.length === 0) {
    return [];
  }

  const counts = new Map<string, number>();

  for (const link of itemLinks) {
    counts.set(link.tag_id, (counts.get(link.tag_id) ?? 0) + 1);
  }

  const tagIds = Array.from(counts.keys());
  const { data: tagRows, error: tagError } = await client
    .from("tags")
    .select("id,name")
    .in("id", tagIds);

  if (tagError) {
    throw new Error("Gagal memuat tag populer.");
  }

  return ((tagRows ?? []) as Tag[])
    .map((tag) => ({
      ...tag,
      itemCount: counts.get(tag.id) ?? 0,
    }))
    .sort(
      (a, b) => b.itemCount - a.itemCount || a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}
