import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  clearSearchHistory,
  listSearchHistory,
  saveSearchHistory,
} from "@/lib/search-history";
import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  try {
    const history = await listSearchHistory();
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat riwayat pencarian." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const query =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).query
      : null;

  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json(
      { error: "Kata kunci wajib diisi." },
      { status: 400 },
    );
  }

  const normalized = query.trim();

  if (normalized.length > SEARCH_QUERY_MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Kata kunci maksimal ${SEARCH_QUERY_MAX_LENGTH} karakter.`,
      },
      { status: 400 },
    );
  }

  try {
    const history = await saveSearchHistory(normalized);
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan riwayat pencarian." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  try {
    await clearSearchHistory();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus riwayat pencarian." },
      { status: 500 },
    );
  }
}
