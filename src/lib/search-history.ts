import { getSupabaseAdmin } from "./supabase";
import type { SearchHistoryEntry } from "./types";
import { SEARCH_QUERY_MAX_LENGTH } from "./validation";

const HISTORY_LIMIT = 20;
const HISTORY_COLUMNS = "id,query,searched_at";

export async function listSearchHistory(): Promise<SearchHistoryEntry[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("search_history")
    .select(HISTORY_COLUMNS)
    .order("searched_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    throw new Error("Gagal memuat riwayat pencarian.");
  }

  return (data ?? []) as SearchHistoryEntry[];
}

export async function saveSearchHistory(
  query: string,
): Promise<SearchHistoryEntry[]> {
  const normalized = query.trim().slice(0, SEARCH_QUERY_MAX_LENGTH);

  if (!normalized) {
    return listSearchHistory();
  }

  const client = getSupabaseAdmin();
  const { error } = await client.from("search_history").upsert(
    {
      query: normalized,
      searched_at: new Date().toISOString(),
    },
    { onConflict: "query" },
  );

  if (error) {
    throw new Error("Gagal menyimpan riwayat pencarian.");
  }

  const { data: rows, error: listError } = await client
    .from("search_history")
    .select("id")
    .order("searched_at", { ascending: false });

  if (listError) {
    throw new Error("Gagal memuat riwayat pencarian.");
  }

  const staleIds = (rows ?? [])
    .slice(HISTORY_LIMIT)
    .map((row) => (row as { id: string }).id);

  if (staleIds.length > 0) {
    const { error: deleteError } = await client
      .from("search_history")
      .delete()
      .in("id", staleIds);

    if (deleteError) {
      throw new Error("Gagal merapikan riwayat pencarian.");
    }
  }

  return listSearchHistory();
}

export async function deleteSearchHistory(id: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("search_history")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error("Gagal menghapus riwayat pencarian.");
  }

  return Boolean(data);
}

export async function clearSearchHistory(): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("search_history")
    .delete()
    .not("id", "is", null);

  if (error) {
    throw new Error("Gagal menghapus riwayat pencarian.");
  }
}
