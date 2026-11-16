import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createFolder, listFolders } from "@/lib/folders";
import { parseBooleanValue, validateFolderName } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  try {
    const folders = await listFolders();
    return NextResponse.json({ folders });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat folder." },
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
  const record =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};
  const result = validateFolderName(record.name);
  const privacy = parseBooleanValue(record.isPrivate, false);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if ("error" in privacy) {
    return NextResponse.json({ error: privacy.error }, { status: 400 });
  }

  try {
    const folder = await createFolder(result.name, privacy.value);
    return NextResponse.json({ folder }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Gagal membuat folder." },
      { status: 500 },
    );
  }
}
