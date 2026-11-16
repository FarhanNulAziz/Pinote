import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteSearchHistory } from "@/lib/search-history";
import { isUuid } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json(
      { error: "Riwayat tidak ditemukan." },
      { status: 404 },
    );
  }

  try {
    const deleted = await deleteSearchHistory(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Riwayat tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus riwayat pencarian." },
      { status: 500 },
    );
  }
}
