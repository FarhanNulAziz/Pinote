import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createImageItem,
  createItem,
  listItems,
  searchItems,
} from "@/lib/items";
import {
  filterItemsByPrivacy,
  getPrivateFolderIds,
  withEffectivePrivacy,
} from "@/lib/privacy";
import type { HomeFilter, Item } from "@/lib/types";
import {
  SEARCH_QUERY_MAX_LENGTH,
  validateImageUpload,
  validateNewItem,
} from "@/lib/validation";

export const runtime = "nodejs";

const ALL_TYPES: Item["type"][] = ["link", "image", "text"];

function parseSearchTypes(value: string | null): Item["type"][] | null {
  if (!value) {
    return ALL_TYPES;
  }

  const types = Array.from(
    new Set(
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  );

  if (types.length === 0) {
    return ALL_TYPES;
  }

  if (
    types.some(
      (type) => type !== "link" && type !== "image" && type !== "text",
    )
  ) {
    return null;
  }

  return types as Item["type"][];
}

function parseFilter(value: string | null): HomeFilter | null {
  if (!value || value === "all") {
    return "all";
  }

  if (
    value === "link" ||
    value === "image" ||
    value === "text" ||
    value === "favorite" ||
    value === "private"
  ) {
    return value;
  }

  return null;
}

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim();

  if (query.length > SEARCH_QUERY_MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Kata kunci maksimal ${SEARCH_QUERY_MAX_LENGTH} karakter.`,
      },
      { status: 400 },
    );
  }

  const includePrivate = params.get("includePrivate") === "true";

  if (query) {
    const types = parseSearchTypes(params.get("types"));

    if (!types) {
      return NextResponse.json(
        { error: "Filter jenis tidak valid." },
        { status: 400 },
      );
    }

    try {
      const privateFolderIds = await getPrivateFolderIds();
      const matches = await searchItems(query, types);
      const items = withEffectivePrivacy(
        filterItemsByPrivacy(
          matches,
          privateFolderIds,
          includePrivate ? "all" : "visible",
        ),
        privateFolderIds,
      );

      return NextResponse.json({ items });
    } catch {
      return NextResponse.json(
        { error: "Gagal mencari item." },
        { status: 500 },
      );
    }
  }

  const filter = parseFilter(params.get("type"));

  if (!filter) {
    return NextResponse.json({ error: "Filter tidak valid" }, { status: 400 });
  }

  try {
    const privateFolderIds = await getPrivateFolderIds();
    const matches = await listItems(filter === "private" ? "all" : filter);
    const items = withEffectivePrivacy(
      filter === "private"
        ? filterItemsByPrivacy(matches, privateFolderIds, "private")
        : includePrivate
          ? matches
          : filterItemsByPrivacy(matches, privateFolderIds, "visible"),
      privateFolderIds,
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat item." },
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

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);

    if (!form || form.get("type") !== "image") {
      return NextResponse.json(
        { error: "Jenis item tidak valid." },
        { status: 400 },
      );
    }

    const tagsValue = form.get("tags");
    let tags: unknown = [];

    if (typeof tagsValue === "string" && tagsValue) {
      try {
        tags = JSON.parse(tagsValue);
      } catch {
        return NextResponse.json(
          { error: "Tag tidak valid." },
          { status: 400 },
        );
      }
    }

    const image = await validateImageUpload(
      form.get("title"),
      form.get("file"),
      form.get("folderId"),
      form.get("note"),
      tags,
      form.get("isPrivate") === "true",
    );

    if (!image.ok) {
      return NextResponse.json({ error: image.error }, { status: 400 });
    }

    try {
      const item = await createImageItem(image.data);
      return NextResponse.json({ item }, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: "Gagal menyimpan item." },
        { status: 500 },
      );
    }
  }

  const body = await request.json().catch(() => null);
  const result = validateNewItem(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const item = await createItem(result.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan item." },
      { status: 500 },
    );
  }
}
