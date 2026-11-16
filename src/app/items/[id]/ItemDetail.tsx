"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Favicon from "@/components/Favicon";
import TagInput from "@/components/TagInput";
import { writeToClipboard } from "@/lib/clipboard";
import type { Folder, Item } from "@/lib/types";
import { getDomain } from "@/lib/url";
import { NOTE_MAX_LENGTH, TITLE_MAX_LENGTH } from "@/lib/validation";
import styles from "./detail.module.css";

type ItemDetailProps = {
  item: Item;
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

function getTypeLabel(item: Item): string {
  if (item.type === "link") {
    return "LINK";
  }

  if (item.type === "image") {
    return "GAMBAR";
  }

  return "TEKS";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function ItemDetail({ item, folders }: ItemDetailProps) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [favorite, setFavorite] = useState(item.is_favorite);
  const [folderId, setFolderId] = useState(item.folder_id ?? "");
  const [tags, setTags] = useState<string[]>(
    (item.tags ?? []).map((tag) => tag.name),
  );
  const [note, setNote] = useState(item.note ?? "");
  const [savedNote, setSavedNote] = useState(item.note ?? "");
  const [isPrivate, setIsPrivate] = useState(item.is_private);
  const [savingFolder, setSavingFolder] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const copyValue =
    item.type === "link" ? item.url : item.type === "text" ? item.content : null;
  const folderIsPrivate = folders.some(
    (folder) => folder.id === folderId && folder.is_private,
  );
  const effectivelyPrivate =
    isPrivate ||
    folderIsPrivate ||
    Boolean(item.is_effectively_private && item.folder_id === folderId);
  const noteDirty = note.trim() !== savedNote;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (confirmDelete && !deleting) {
        setConfirmDelete(false);
        return;
      }

      if (!deleting) {
        router.push("/");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDelete, deleting, router]);

  async function handleCopy() {
    if (!copyValue) {
      return;
    }

    const copiedOk = await writeToClipboard(copyValue);
    setCopied(copiedOk);
    setError(copiedOk ? null : "Gagal menyalin. Coba lagi.");
  }

  async function toggleFavorite() {
    if (savingFavorite) {
      return;
    }

    const nextFavorite = !favorite;
    setFavorite(nextFavorite);
    setSavingFavorite(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: nextFavorite }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setFavorite(!nextFavorite);
        setError(readError(data));
        return;
      }

      router.refresh();
    } catch {
      setFavorite(!nextFavorite);
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSavingFavorite(false);
    }
  }

  async function changeFolder(nextFolderId: string) {
    if (savingFolder || nextFolderId === folderId) {
      return;
    }

    const previousFolderId = folderId;
    setFolderId(nextFolderId);
    setSavingFolder(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: nextFolderId || null }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setFolderId(previousFolderId);
        setError(readError(data));
        return;
      }

      router.refresh();
    } catch {
      setFolderId(previousFolderId);
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSavingFolder(false);
    }
  }

  async function changeTags(nextTags: string[]) {
    if (savingTags) {
      return;
    }

    const previousTags = tags;
    setTags(nextTags);
    setSavingTags(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: nextTags }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setTags(previousTags);
        setError(readError(data));
        return;
      }

      router.refresh();
    } catch {
      setTags(previousTags);
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSavingTags(false);
    }
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingNote) {
      return;
    }

    const nextNote = note.trim();

    setSavingNote(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: nextNote }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(readError(data));
        return;
      }

      setNote(nextNote);
      setSavedNote(nextNote);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSavingNote(false);
    }
  }

  async function togglePrivacy() {
    if (savingPrivacy) {
      return;
    }

    const nextPrivate = !isPrivate;
    setIsPrivate(nextPrivate);
    setSavingPrivacy(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: nextPrivate }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setIsPrivate(!nextPrivate);
        setError(readError(data));
        return;
      }

      router.refresh();
    } catch {
      setIsPrivate(!nextPrivate);
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSavingPrivacy(false);
    }
  }

  function startEditing() {
    setDraftTitle(title);
    setEditing(true);
    setError(null);
  }

  function cancelEditing() {
    setDraftTitle(title);
    setEditing(false);
    setError(null);
  }

  async function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingTitle) {
      return;
    }

    const nextTitle = draftTitle.trim();

    if (!nextTitle) {
      setError("Judul wajib diisi.");
      return;
    }

    setSavingTitle(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(readError(data));
        return;
      }

      setTitle(nextTitle);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSavingTitle(false);
    }
  }

  async function handleDelete() {
    if (deleting) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(readError(data));
        setConfirmDelete(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className={styles.detail}>
      {item.type === "image" ? (
        <div className={styles.media}>
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.image}
              src={item.image_url}
              alt={title}
            />
          ) : (
            <div className={styles.imageFallback}>Gambar tidak tersedia</div>
          )}
        </div>
      ) : null}

      <div className={styles.metaRow}>
        <span className={styles.badge}>{getTypeLabel(item)}</span>
        {favorite ? <span className={styles.favoriteBadge}>Favorit</span> : null}
        {effectivelyPrivate ? (
          <span className={styles.privateBadge}>Pribadi</span>
        ) : null}
        <span className={styles.date}>Disimpan {formatDate(item.created_at)}</span>
      </div>

      {editing ? (
        <form className={styles.editForm} onSubmit={saveTitle}>
          <label className={styles.label} htmlFor="item-title">
            Judul
          </label>
          <input
            id="item-title"
            className={styles.input}
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            disabled={savingTitle}
            autoFocus
            required
          />
          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={cancelEditing}
              disabled={savingTitle}
            >
              Batal
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={savingTitle}
            >
              {savingTitle ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      ) : (
        <h2 className={styles.title}>{title}</h2>
      )}

      {item.type === "link" && item.url ? (
        <div className={styles.linkBox}>
          <div className={styles.domainRow}>
            <Favicon domain={getDomain(item.url)} size={20} />
            <span className={styles.domain}>{getDomain(item.url)}</span>
          </div>
          <a
            className={styles.openLink}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka tautan
          </a>
        </div>
      ) : null}

      {item.type === "text" && item.content ? (
        <p className={styles.content}>{item.content}</p>
      ) : null}

      <div className={styles.folderField}>
        <label className={styles.label} htmlFor="item-folder">
          Folder
        </label>
        <select
          id="item-folder"
          className={`${styles.input} ${styles.select}`}
          value={folderId}
          onChange={(event) => void changeFolder(event.target.value)}
          disabled={savingFolder}
        >
          <option value="">Tanpa folder</option>
          {folderId && !folders.some((folder) => folder.id === folderId) ? (
            <option value={folderId}>Folder saat ini</option>
          ) : null}
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        <p className={styles.folderHint}>
          {savingFolder
            ? "Menyimpan folder..."
            : folders.length === 0
              ? "Belum ada folder. Buat folder dari halaman Folder."
              : "Pilih folder atau biarkan tanpa folder."}
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Tag</span>
          {savingTags ? (
            <span className={styles.savingText}>Menyimpan...</span>
          ) : null}
        </div>
        <TagInput
          value={tags}
          onChange={(nextTags) => void changeTags(nextTags)}
          disabled={savingTags}
        />
        <p className={styles.folderHint}>
          Tekan Enter atau koma untuk menambah tag.
        </p>
      </div>

      <form className={styles.section} onSubmit={saveNote}>
        <label className={styles.label} htmlFor="item-note">
          Catatan pribadi
        </label>
        <textarea
          id="item-note"
          className={styles.noteInput}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Tambahkan catatan untuk item ini..."
          maxLength={NOTE_MAX_LENGTH}
          rows={4}
          disabled={savingNote}
        />
        <div className={styles.noteFooter}>
          <span className={styles.noteCount}>
            {note.length}/{NOTE_MAX_LENGTH}
          </span>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={savingNote || !noteDirty}
          >
            {savingNote ? "Menyimpan..." : "Simpan catatan"}
          </button>
        </div>
      </form>

      <label className={styles.privateRow} htmlFor="item-private">
        <span className={styles.switchText}>
          <span className={styles.label}>Item pribadi</span>
          <span className={styles.folderHint}>
            {folderIsPrivate
              ? "Item ini pribadi karena foldernya."
              : "Sembunyikan dari Beranda dan pencarian umum."}
          </span>
        </span>
        <span className={styles.switchControl}>
          <input
            id="item-private"
            type="checkbox"
            className={styles.switchInput}
            checked={isPrivate}
            onChange={() => void togglePrivacy()}
            disabled={savingPrivacy}
          />
          <span className={styles.switchTrack} aria-hidden="true" />
        </span>
      </label>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.actionGrid}>
        {copyValue ? (
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleCopy}
          >
            {copied ? "Tersalin" : "Salin"}
          </button>
        ) : null}
        <button
          type="button"
          className={`${styles.actionButton} ${favorite ? styles.actionActive : ""}`}
          onClick={toggleFavorite}
          disabled={savingFavorite}
          aria-pressed={favorite}
        >
          {favorite ? "Favorit" : "Favoritkan"}
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={startEditing}
          disabled={editing}
        >
          Edit judul
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionDanger}`}
          onClick={() => setConfirmDelete(true)}
        >
          Hapus
        </button>
      </div>

      {confirmDelete ? (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setConfirmDelete(false);
            }
          }}
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h3 id="delete-title" className={styles.dialogTitle}>
              Hapus item ini?
            </h3>
            <p className={styles.dialogText}>
              Tindakan ini tidak bisa dibatalkan
              {item.type === "image"
                ? " dan file gambar akan dihapus dari penyimpanan."
                : "."}
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
