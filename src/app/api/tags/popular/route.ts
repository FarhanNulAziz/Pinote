import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listPopularTags } from "@/lib/tags";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  try {
    const tags = await listPopularTags();
    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat tag populer." },
      { status: 500 },
    );
  }
}
