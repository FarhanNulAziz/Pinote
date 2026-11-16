import { isHttpUrl } from "./url";

export const TITLE_MAX_LENGTH = 200;
export const URL_MAX_LENGTH = 2048;
export const CONTENT_MAX_LENGTH = 5000;
export const NOTE_MAX_LENGTH = 1000;
export const TAG_NAME_MAX_LENGTH = 30;
export const SEARCH_QUERY_MAX_LENGTH = 100;
export const FOLDER_NAME_MAX_LENGTH = 100;
export const IMAGE_MAX_SIZE_MB = 10;
export const IMAGE_MAX_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
export const IMAGE_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

type ItemMetadataInput = {
  folderId: string | null;
  note: string | null;
  tags: string[];
  isPrivate: boolean;
};

export type NewItemInput =
  | ({ type: "link"; title: string; url: string } & ItemMetadataInput)
  | ({ type: "text"; title: string; content: string } & ItemMetadataInput);

export type ValidationResult =
  | { ok: true; data: NewItemInput }
  | { ok: false; error: string };

export type ValidatedImage = {
  title: string;
  bytes: Uint8Array;
  mimeType: string;
  extension: string;
} & ItemMetadataInput;

export type ImageValidationResult =
  | { ok: true; data: ValidatedImage }
  | { ok: false; error: string };

function detectImageMime(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function validateTitle(value: unknown): { title: string } | { error: string } {
  const title = typeof value === "string" ? value.trim() : "";

  if (!title) {
    return { error: "Judul wajib diisi." };
  }

  if (title.length > TITLE_MAX_LENGTH) {
    return { error: `Judul maksimal ${TITLE_MAX_LENGTH} karakter.` };
  }

  return { title };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export type FolderNameResult = { name: string } | { error: string };

export function validateFolderName(value: unknown): FolderNameResult {
  const name = typeof value === "string" ? value.trim() : "";

  if (!name) {
    return { error: "Nama folder wajib diisi." };
  }

  if (name.length > FOLDER_NAME_MAX_LENGTH) {
    return {
      error: `Nama folder maksimal ${FOLDER_NAME_MAX_LENGTH} karakter.`,
    };
  }

  return { name };
}

type FolderIdResult = { folderId: string | null } | { error: string };

function parseFolderId(value: unknown): FolderIdResult {
  if (value === undefined || value === null || value === "") {
    return { folderId: null };
  }

  if (typeof value !== "string") {
    return { error: "Folder tidak valid." };
  }

  const folderId = value.trim();

  if (!folderId) {
    return { folderId: null };
  }

  if (!isUuid(folderId)) {
    return { error: "Folder tidak valid." };
  }

  return { folderId };
}

type NoteResult = { note: string | null } | { error: string };

function parseNote(value: unknown): NoteResult {
  if (value === undefined || value === null) {
    return { note: null };
  }

  if (typeof value !== "string") {
    return { error: "Catatan tidak valid." };
  }

  const note = value.trim();

  if (!note) {
    return { note: null };
  }

  if (note.length > NOTE_MAX_LENGTH) {
    return {
      error: `Catatan maksimal ${NOTE_MAX_LENGTH} karakter.`,
    };
  }

  return { note };
}

export function parseTagNames(
  value: unknown,
): { tags: string[] } | { error: string } {
  if (value === undefined || value === null) {
    return { tags: [] };
  }

  if (!Array.isArray(value)) {
    return { error: "Tag tidak valid." };
  }

  const tags: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string") {
      return { error: "Tag tidak valid." };
    }

    const name = entry.trim().toLowerCase();

    if (!name) {
      continue;
    }

    if (name.length > TAG_NAME_MAX_LENGTH) {
      return {
        error: `Nama tag maksimal ${TAG_NAME_MAX_LENGTH} karakter.`,
      };
    }

    if (!seen.has(name)) {
      seen.add(name);
      tags.push(name);
    }
  }

  return { tags };
}

export function parseBooleanValue(
  value: unknown,
  fallback?: boolean,
): { value: boolean } | { error: string } {
  if (value === undefined && fallback !== undefined) {
    return { value: fallback };
  }

  if (typeof value !== "boolean") {
    return { error: "Status privasi tidak valid." };
  }

  return { value };
}

export type UpdatedItemInput = {
  title?: string;
  isFavorite?: boolean;
  folderId?: string | null;
  note?: string | null;
  tags?: string[];
  isPrivate?: boolean;
};

export type FolderUpdateInput = {
  name?: string;
  isPrivate?: boolean;
};

export type FolderUpdateValidationResult =
  | { ok: true; data: FolderUpdateInput }
  | { ok: false; error: string };

export function validateFolderUpdate(body: unknown): FolderUpdateValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Data tidak valid." };
  }

  const record = body as Record<string, unknown>;
  const data: FolderUpdateInput = {};

  if (record.name !== undefined) {
    const nameResult = validateFolderName(record.name);

    if ("error" in nameResult) {
      return { ok: false, error: nameResult.error };
    }

    data.name = nameResult.name;
  }

  if (record.isPrivate !== undefined) {
    const privacyResult = parseBooleanValue(record.isPrivate);

    if ("error" in privacyResult) {
      return { ok: false, error: privacyResult.error };
    }

    data.isPrivate = privacyResult.value;
  }

  if (data.name === undefined && data.isPrivate === undefined) {
    return { ok: false, error: "Tidak ada perubahan." };
  }

  return { ok: true, data };
}

export type UpdateValidationResult =
  | { ok: true; data: UpdatedItemInput }
  | { ok: false; error: string };

export function validateItemUpdate(body: unknown): UpdateValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Data tidak valid." };
  }

  const record = body as Record<string, unknown>;
  const data: UpdatedItemInput = {};

  if (record.title !== undefined) {
    if (typeof record.title !== "string") {
      return { ok: false, error: "Judul tidak valid." };
    }

    const title = record.title.trim();

    if (!title) {
      return { ok: false, error: "Judul wajib diisi." };
    }

    if (title.length > TITLE_MAX_LENGTH) {
      return {
        ok: false,
        error: `Judul maksimal ${TITLE_MAX_LENGTH} karakter.`,
      };
    }

    data.title = title;
  }

  if (record.isFavorite !== undefined) {
    if (typeof record.isFavorite !== "boolean") {
      return { ok: false, error: "Status favorit tidak valid." };
    }

    data.isFavorite = record.isFavorite;
  }

  if (record.folderId !== undefined) {
    const folderResult = parseFolderId(record.folderId);

    if ("error" in folderResult) {
      return { ok: false, error: folderResult.error };
    }

    data.folderId = folderResult.folderId;
  }

  if (record.note !== undefined) {
    const noteResult = parseNote(record.note);

    if ("error" in noteResult) {
      return { ok: false, error: noteResult.error };
    }

    data.note = noteResult.note;
  }

  if (record.tags !== undefined) {
    const tagsResult = parseTagNames(record.tags);

    if ("error" in tagsResult) {
      return { ok: false, error: tagsResult.error };
    }

    data.tags = tagsResult.tags;
  }

  if (record.isPrivate !== undefined) {
    const privacyResult = parseBooleanValue(record.isPrivate);

    if ("error" in privacyResult) {
      return { ok: false, error: privacyResult.error };
    }

    data.isPrivate = privacyResult.value;
  }

  if (
    data.title === undefined &&
    data.isFavorite === undefined &&
    data.folderId === undefined &&
    data.note === undefined &&
    data.tags === undefined &&
    data.isPrivate === undefined
  ) {
    return { ok: false, error: "Tidak ada perubahan." };
  }

  return { ok: true, data };
}

export async function validateImageUpload(
  titleValue: unknown,
  fileValue: unknown,
  folderValue?: unknown,
  noteValue?: unknown,
  tagsValue?: unknown,
  privacyValue?: unknown,
): Promise<ImageValidationResult> {
  const titleResult = validateTitle(titleValue);

  if ("error" in titleResult) {
    return { ok: false, error: titleResult.error };
  }

  const folderResult = parseFolderId(folderValue);

  if ("error" in folderResult) {
    return { ok: false, error: folderResult.error };
  }

  const noteResult = parseNote(noteValue);

  if ("error" in noteResult) {
    return { ok: false, error: noteResult.error };
  }

  const tagsResult = parseTagNames(tagsValue);

  if ("error" in tagsResult) {
    return { ok: false, error: tagsResult.error };
  }

  const privacyResult = parseBooleanValue(privacyValue, false);

  if ("error" in privacyResult) {
    return { ok: false, error: privacyResult.error };
  }

  if (!(fileValue instanceof File)) {
    return { ok: false, error: "Pilih gambar yang ingin diunggah." };
  }

  const file = fileValue;
  const dotIndex = file.name.lastIndexOf(".");
  const extension =
    dotIndex >= 0 ? file.name.slice(dotIndex + 1).toLowerCase() : "";
  const expectedMime = EXTENSION_MIME[extension];

  if (!expectedMime) {
    return {
      ok: false,
      error: "Format gambar harus JPG, JPEG, PNG, atau WEBP.",
    };
  }

  if (
    !IMAGE_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof IMAGE_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return {
      ok: false,
      error: "Format gambar harus JPG, JPEG, PNG, atau WEBP.",
    };
  }

  if (file.size === 0) {
    return { ok: false, error: "File gambar kosong." };
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return {
      ok: false,
      error: `Ukuran gambar maksimal ${IMAGE_MAX_SIZE_MB} MB.`,
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedMime = detectImageMime(bytes);

  if (!detectedMime || detectedMime !== expectedMime) {
    return {
      ok: false,
      error: "Isi file tidak cocok dengan format gambar yang dipilih.",
    };
  }

  if (file.type !== detectedMime) {
    return {
      ok: false,
      error: "Tipe file tidak cocok dengan isi gambar.",
    };
  }

  return {
    ok: true,
    data: {
      title: titleResult.title,
      bytes,
      mimeType: detectedMime,
      extension,
      folderId: folderResult.folderId,
      note: noteResult.note,
      tags: tagsResult.tags,
      isPrivate: privacyResult.value,
    },
  };
}

export function validateNewItem(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Data tidak valid." };
  }

  const record = body as Record<string, unknown>;
  const type = record.type;

  if (type !== "link" && type !== "text") {
    return { ok: false, error: "Jenis item tidak valid." };
  }

  const title = typeof record.title === "string" ? record.title.trim() : "";

  if (!title) {
    return { ok: false, error: "Judul wajib diisi." };
  }

  if (title.length > TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Judul maksimal ${TITLE_MAX_LENGTH} karakter.`,
    };
  }

  const folderResult = parseFolderId(record.folderId);

  if ("error" in folderResult) {
    return { ok: false, error: folderResult.error };
  }

  const folderId = folderResult.folderId;
  const noteResult = parseNote(record.note);

  if ("error" in noteResult) {
    return { ok: false, error: noteResult.error };
  }

  const tagsResult = parseTagNames(record.tags);

  if ("error" in tagsResult) {
    return { ok: false, error: tagsResult.error };
  }

  const privacyResult = parseBooleanValue(record.isPrivate, false);

  if ("error" in privacyResult) {
    return { ok: false, error: privacyResult.error };
  }

  const metadata = {
    folderId,
    note: noteResult.note,
    tags: tagsResult.tags,
    isPrivate: privacyResult.value,
  };

  if (type === "link") {
    const url = typeof record.url === "string" ? record.url.trim() : "";

    if (!url) {
      return { ok: false, error: "URL wajib diisi." };
    }

    if (url.length > URL_MAX_LENGTH) {
      return {
        ok: false,
        error: `URL maksimal ${URL_MAX_LENGTH} karakter.`,
      };
    }

    if (!isHttpUrl(url)) {
      return {
        ok: false,
        error: "URL harus diawali http:// atau https://.",
      };
    }

    return { ok: true, data: { type: "link", title, url, ...metadata } };
  }

  const content =
    typeof record.content === "string" ? record.content.trim() : "";

  if (!content) {
    return { ok: false, error: "Isi teks wajib diisi." };
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Isi teks maksimal ${CONTENT_MAX_LENGTH} karakter.`,
    };
  }

  return { ok: true, data: { type: "text", title, content, ...metadata } };
}
