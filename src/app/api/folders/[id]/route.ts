import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteFolder, updateFolder } from "@/lib/folders";
import { isUuid, validateFolderUpdate } from "@/lib/validation";

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
      { error: "Folder tidak ditemukan." },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => null);
  const result = validateFolderUpdate(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const folder = await updateFolder(id, result.data);

    if (!folder) {
      return NextResponse.json(
        { error: "Folder tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ folder });
  } catch {
    return NextResponse.json(
      { error: "Gagal mengubah folder." },
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
      { error: "Folder tidak ditemukan." },
      { status: 404 },
    );
  }

  try {
    const deleted = await deleteFolder(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Folder tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus folder." },
      { status: 500 },
    );
  }
}
