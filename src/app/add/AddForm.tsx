"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import Favicon from "@/components/Favicon";
import TagInput from "@/components/TagInput";
import {
  CONTENT_MAX_LENGTH,
  IMAGE_ALLOWED_EXTENSIONS,
  IMAGE_ALLOWED_MIME_TYPES,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_SIZE_MB,
  NOTE_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  URL_MAX_LENGTH,
} from "@/lib/validation";
import { getDomain, isHttpUrl } from "@/lib/url";
import type { Folder } from "@/lib/types";
import styles from "./add.module.css";

type Tab = "link" | "image" | "text";

type AddFormProps = {
  folders: Folder[];
};

function readError(data: unknown): string {
  if (data && typeof data === "object") {
    const message = (data as Record<string, unknown>).error;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Terjadi kesalahan. Coba lagi.";
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");

  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
}

export default function AddForm({ folders }: AddFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [folderId, setFolderId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const trimmedUrl = url.trim();
  const hasUrl = trimmedUrl.length > 0;
  const urlIsValid = hasUrl && isHttpUrl(trimmedUrl);
  const previewDomain = urlIsValid ? getDomain(trimmedUrl) : "";
  const urlError = hasUrl && !urlIsValid;
  const canSubmit =
    title.trim().length > 0 &&
    (tab === "link"
      ? urlIsValid
      : tab === "image"
        ? imageFile !== null
        : content.trim().length > 0);

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    setError(null);
  }

  function releasePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  function selectImage(file: File | null) {
    setError(null);

    if (!file) {
      releasePreview();
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    const extension = getExtension(file.name);

    if (
      !IMAGE_ALLOWED_EXTENSIONS.includes(
        extension as (typeof IMAGE_ALLOWED_EXTENSIONS)[number],
      )
    ) {
      releasePreview();
      setImageFile(null);
      setImagePreview(null);
      setError("Format gambar harus JPG, JPEG, PNG, atau WEBP.");
      return;
    }

    if (
      !IMAGE_ALLOWED_MIME_TYPES.includes(
        file.type as (typeof IMAGE_ALLOWED_MIME_TYPES)[number],
      )
    ) {
      releasePreview();
      setImageFile(null);
      setImagePreview(null);
      setError("Format gambar harus JPG, JPEG, PNG, atau WEBP.");
      return;
    }

    if (file.size > IMAGE_MAX_BYTES) {
      releasePreview();
      setImageFile(null);
      setImagePreview(null);
      setError(`Ukuran gambar maksimal ${IMAGE_MAX_SIZE_MB} MB.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    releasePreview();
    previewUrlRef.current = objectUrl;
    setImageFile(file);
    setImagePreview(objectUrl);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectImage(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    selectImage(event.dataTransfer.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || !canSubmit) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      let response: Response;

      if (tab === "image") {
        const formData = new FormData();
        formData.append("type", "image");
        formData.append("title", title);

        if (folderId) {
          formData.append("folderId", folderId);
        }

        if (imageFile) {
          formData.append("file", imageFile);
        }

        formData.append("note", note);
        formData.append("tags", JSON.stringify(tags));
        formData.append("isPrivate", String(isPrivate));

        response = await fetch("/api/items", {
          method: "POST",
          body: formData,
        });
      } else {
        const payload =
          tab === "link"
            ? {
                type: "link",
                title,
                url,
                folderId: folderId || null,
                note,
                tags,
                isPrivate,
              }
            : {
                type: "text",
                title,
                content,
                folderId: folderId || null,
                note,
                tags,
                isPrivate,
              };

        response = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setError(readError(data));
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.tabs} role="tablist" aria-label="Jenis item">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "link"}
          className={`${styles.tab} ${tab === "link" ? styles.tabActive : ""}`}
          onClick={() => selectTab("link")}
        >
          Simpan Tautan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "image"}
          className={`${styles.tab} ${tab === "image" ? styles.tabActive : ""}`}
          onClick={() => selectTab("image")}
        >
          Upload Gambar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "text"}
          className={`${styles.tab} ${tab === "text" ? styles.tabActive : ""}`}
          onClick={() => selectTab("text")}
        >
          Simpan Teks
        </button>
      </div>

      {tab === "link" ? (
        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="url">
              URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              inputMode="url"
              className={styles.input}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://contoh.com/artikel"
              maxLength={URL_MAX_LENGTH}
              autoComplete="off"
              disabled={submitting}
            />
            {urlError ? (
              <p className={styles.fieldError} role="alert">
                URL harus diawali http:// atau https://.
              </p>
            ) : null}
            {previewDomain ? (
              <div className={styles.preview}>
                <Favicon domain={previewDomain} size={22} />
                <span>{previewDomain}</span>
              </div>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="link-title">
              Judul
            </label>
            <input
              id="link-title"
              name="title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul yang mudah Anda ingat"
              maxLength={TITLE_MAX_LENGTH}
              disabled={submitting}
              required
            />
            <p className={styles.hint}>
              Judul diisi manual. Pinote tidak mengambil data dari situs.
            </p>
          </div>
        </div>
      ) : tab === "image" ? (
        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.label}>Gambar</span>
            <label
              className={`${styles.upload} ${imagePreview ? styles.uploadHasImage : ""}`}
              htmlFor="image-file"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={styles.imagePreview}
                  src={imagePreview}
                  alt="Pratinjau gambar terpilih"
                />
              ) : (
                <span className={styles.uploadContent}>
                  <svg
                    className={styles.uploadIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 16.5 9 11l4 4 2.5-2.5L20 17" />
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <circle cx="9" cy="8.5" r="1.2" />
                  </svg>
                  <span className={styles.uploadTitle}>
                    Ketuk untuk memilih gambar
                  </span>
                  <span className={styles.uploadHint}>
                    atau tarik file ke sini
                  </span>
                </span>
              )}
              <input
                id="image-file"
                name="file"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className={styles.fileInput}
                onChange={handleFileChange}
                disabled={submitting}
              />
            </label>
            <p className={styles.hint}>
              JPG, JPEG, PNG, WEBP - maks. {IMAGE_MAX_SIZE_MB} MB
            </p>
            {imagePreview ? (
              <button
                type="button"
                className={styles.removeFile}
                onClick={() => selectImage(null)}
                disabled={submitting}
              >
                Hapus gambar terpilih
              </button>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="image-title">
              Judul
            </label>
            <input
              id="image-title"
              name="title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul gambar"
              maxLength={TITLE_MAX_LENGTH}
              disabled={submitting}
              required
            />
          </div>
        </div>
      ) : (
        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="text-title">
              Judul
            </label>
            <input
              id="text-title"
              name="title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul catatan"
              maxLength={TITLE_MAX_LENGTH}
              disabled={submitting}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="content">
              Isi teks
            </label>
            <textarea
              id="content"
              name="content"
              className={styles.textarea}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Tulis kata atau kalimat yang ingin disimpan..."
              maxLength={CONTENT_MAX_LENGTH}
              rows={8}
              disabled={submitting}
              required
            />
            <p className={styles.counter}>
              {content.length}/{CONTENT_MAX_LENGTH}
            </p>
          </div>
        </div>
      )}

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="folder">
            Folder
          </label>
          <select
            id="folder"
            name="folder"
            className={styles.select}
            value={folderId}
            onChange={(event) => setFolderId(event.target.value)}
            disabled={submitting}
          >
            <option value="">Tanpa folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <p className={styles.hint}>
            Opsional. Item bisa dipindahkan ke folder lain nanti.
          </p>
        </div>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="item-note">
            Catatan pribadi
          </label>
          <textarea
            id="item-note"
            name="note"
            className={styles.noteTextarea}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Tambahkan catatan untuk item ini..."
            maxLength={NOTE_MAX_LENGTH}
            rows={4}
            disabled={submitting}
          />
          <p className={styles.counter}>
            {note.length}/{NOTE_MAX_LENGTH}
          </p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="item-tags">
            Tag
          </label>
          <TagInput
            id="item-tags"
            value={tags}
            onChange={setTags}
            disabled={submitting}
          />
          <p className={styles.hint}>
            Tekan Enter atau koma untuk menambah tag. Opsional.
          </p>
        </div>

        <label className={styles.switchRow} htmlFor="is-private">
          <span className={styles.switchText}>
            <span className={styles.switchTitle}>Tandai pribadi</span>
            <span className={styles.switchHint}>
              Disembunyikan dari Beranda dan hasil pencarian umum.
            </span>
          </span>
          <span className={styles.switchControl}>
            <input
              id="is-private"
              type="checkbox"
              className={styles.switchInput}
              checked={isPrivate}
              onChange={(event) => setIsPrivate(event.target.checked)}
              disabled={submitting}
            />
            <span className={styles.switchTrack} aria-hidden="true" />
          </span>
        </label>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.submitBar}>
        <button
          type="submit"
          className={styles.submit}
          disabled={submitting || !canSubmit}
        >
          {submitting
            ? "Menyimpan..."
            : tab === "link"
              ? "Simpan tautan"
              : tab === "image"
                ? "Unggah gambar"
                : "Simpan teks"}
        </button>
      </div>
    </form>
  );
}
