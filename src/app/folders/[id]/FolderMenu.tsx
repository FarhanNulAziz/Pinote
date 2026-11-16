"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Folder } from "@/lib/types";
import { FOLDER_NAME_MAX_LENGTH } from "@/lib/validation";
import styles from "./folder.module.css";

type FolderMenuProps = {
  folder: Folder;
};

type DialogMode = "rename" | "privacy" | "delete" | null;

function readError(data: unknown): string {
  if (data && typeof data === "object") {
    const message = (data as Record<string, unknown>).error;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Terjadi kesalahan. Coba lagi.";
}

export default function FolderMenu({ folder }: FolderMenuProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [name, setName] = useState(folder.name);
  const [isPrivate, setIsPrivate] = useState(folder.is_private);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openDialog(mode: Exclude<DialogMode, null>) {
    setMenuOpen(false);
    setDialog(mode);
    setError(null);

    if (mode === "rename") {
      setName(folder.name);
    }

    if (mode === "privacy") {
      setIsPrivate(folder.is_private);
    }
  }

  function closeDialog() {
    if (saving || deleting) {
      return;
    }

    setDialog(null);
    setError(null);
  }

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const nextName = name.trim();

    if (!nextName) {
      setError("Nama folder wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setError(readError(data));
        return;
      }

      setDialog(null);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePrivacy() {
    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setError(readError(data));
        return;
      }

      setDialog(null);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
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

      router.push("/folders");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.menuWrap}>
      <button
        type="button"
        className={styles.menuButton}
        aria-label="Menu folder"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="12" cy="19" r="1.7" />
        </svg>
      </button>

      {menuOpen ? (
        <>
          <button
            type="button"
            className={styles.menuBackdrop}
            aria-label="Tutup menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className={styles.menuPanel} role="menu">
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => openDialog("rename")}
            >
              Ubah nama
            </button>
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => openDialog("privacy")}
            >
              Ubah status privasi
            </button>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              role="menuitem"
              onClick={() => openDialog("delete")}
            >
              Hapus folder
            </button>
          </div>
        </>
      ) : null}

      {dialog === "rename" ? (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <form
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-folder-title"
            onSubmit={handleRename}
          >
            <h2 id="rename-folder-title" className={styles.dialogTitle}>
              Ubah nama folder
            </h2>
            <label className={styles.dialogLabel} htmlFor="rename-folder">
              Nama folder
            </label>
            <input
              id="rename-folder"
              className={styles.dialogInput}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={FOLDER_NAME_MAX_LENGTH}
              disabled={saving}
              autoFocus
              required
            />
            {error ? (
              <p className={styles.dialogError} role="alert">
                {error}
              </p>
            ) : null}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeDialog}
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {dialog === "privacy" ? (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-folder-title"
          >
            <h2 id="privacy-folder-title" className={styles.dialogTitle}>
              Status folder
            </h2>
            <p className={styles.dialogText}>
              Folder pribadi menyembunyikan semua isinya dari Beranda dan Cari.
            </p>
            <label className={styles.switchRow} htmlFor="folder-privacy-status">
              <span className={styles.switchText}>
                <span className={styles.switchTitle}>Folder pribadi</span>
                <span className={styles.switchHint}>
                  {isPrivate
                    ? "Isi folder disembunyikan dari tampilan umum."
                    : "Isi folder tampil di Beranda dan Cari."}
                </span>
              </span>
              <span className={styles.switchControl}>
                <input
                  id="folder-privacy-status"
                  type="checkbox"
                  className={styles.switchInput}
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                  disabled={saving}
                />
                <span className={styles.switchTrack} aria-hidden="true" />
              </span>
            </label>
            {error ? (
              <p className={styles.dialogError} role="alert">
                {error}
              </p>
            ) : null}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeDialog}
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void handlePrivacy()}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dialog === "delete" ? (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-folder-title"
          >
            <h2 id="delete-folder-title" className={styles.dialogTitle}>
              Hapus folder ini?
            </h2>
            <p className={styles.dialogText}>
              Item di dalam folder tidak akan dihapus. Item akan menjadi tanpa
              folder.
            </p>
            {error ? (
              <p className={styles.dialogError} role="alert">
                {error}
              </p>
            ) : null}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeDialog}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? "Menghapus..." : "Hapus folder"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
