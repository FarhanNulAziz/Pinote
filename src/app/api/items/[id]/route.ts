import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteItem, updateItem } from "@/lib/items";
import { isUuid, validateItemUpdate } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json(
      { error: "Item tidak ditemukan." },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => null);
  const result = validateItemUpdate(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const item = await updateItem(id, result.data);

    if (!item) {
      return NextResponse.json(
        { error: "Item tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui item." },
      { status: 500 },
    );
  }
}

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
      { error: "Item tidak ditemukan." },
      { status: 404 },
    );
  }

  try {
    const deleted = await deleteItem(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Item tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus item." },
      { status: 500 },
    );
  }
}
