"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FOLDER_NAME_MAX_LENGTH } from "@/lib/validation";
import styles from "./folders.module.css";

function readError(data: unknown): string {
  if (data && typeof data === "object") {
    const message = (data as Record<string, unknown>).error;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Terjadi kesalahan. Coba lagi.";
}

export default function NewFolderForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function closeForm() {
    if (saving) {
      return;
    }

    setOpen(false);
    setName("");
    setIsPrivate(false);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName, isPrivate }),
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

      setName("");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.newFolder}>
      {!open ? (
        <button
          type="button"
          className={styles.newButton}
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Folder baru
        </button>
      ) : (
        <form className={styles.newForm} onSubmit={handleSubmit}>
          <label className={styles.formLabel} htmlFor="folder-name">
            Nama folder
          </label>
          <input
            id="folder-name"
            className={styles.formInput}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Inspirasi UI/UX"
            maxLength={FOLDER_NAME_MAX_LENGTH}
            disabled={saving}
            autoFocus
            required
          />
          <label className={styles.switchRow} htmlFor="folder-private">
            <span className={styles.switchText}>
              <span className={styles.switchTitle}>Folder pribadi</span>
              <span className={styles.switchHint}>
                Semua item di dalamnya disembunyikan dari Beranda dan Cari.
              </span>
            </span>
            <span className={styles.switchControl}>
              <input
                id="folder-private"
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
            <p className={styles.formError} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={closeForm}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saving}
            >
              {saving ? "Membuat..." : "Buat folder"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
