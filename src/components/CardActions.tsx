"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { writeToClipboard } from "@/lib/clipboard";
import type { ItemType } from "@/lib/types";
import styles from "./ItemCard.module.css";

type CardActionsProps = {
  itemId: string;
  type: ItemType;
  url: string | null;
  content: string | null;
  isFavorite: boolean;
};

export default function CardActions({
  itemId,
  type,
  url,
  content,
  isFavorite,
}: CardActionsProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(isFavorite);
  const [copied, setCopied] = useState(false);
  const [pendingFavorite, setPendingFavorite] = useState(false);
  const copyValue = type === "link" ? url : type === "text" ? content : null;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    if (!copyValue) {
      return;
    }

    setCopied(await writeToClipboard(copyValue));
  }

  async function toggleFavorite() {
    if (pendingFavorite) {
      return;
    }

    const nextFavorite = !favorite;
    setFavorite(nextFavorite);
    setPendingFavorite(true);

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: nextFavorite }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setFavorite(!nextFavorite);
        return;
      }

      router.refresh();
    } catch {
      setFavorite(!nextFavorite);
    } finally {
      setPendingFavorite(false);
    }
  }

  return (
    <div className={styles.actions}>
      {copyValue ? (
        <button
          type="button"
          className={styles.action}
          onClick={handleCopy}
          aria-label={copied ? "Tersalin" : "Salin"}
          title={copied ? "Tersalin" : "Salin"}
        >
          {copied ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M15 5H6a2 2 0 0 0-2 2v9" />
            </svg>
          )}
        </button>
      ) : null}

      <Link
        href={`/items/${itemId}`}
        className={styles.action}
        aria-label="Lihat detail"
        title="Preview"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      </Link>

      <button
        type="button"
        className={`${styles.action} ${favorite ? styles.actionFavorite : ""}`}
        onClick={toggleFavorite}
        disabled={pendingFavorite}
        aria-pressed={favorite}
        aria-label={
          favorite ? "Hapus dari favorit" : "Tambahkan ke favorit"
        }
        title={favorite ? "Hapus dari favorit" : "Tambahkan ke favorit"}
      >
        <svg
          viewBox="0 0 24 24"
          fill={favorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-4.2L5 20V5.5a1 1 0 0 1 1-1Z" />
        </svg>
      </button>

      <span className={styles.actionStatus} role="status" aria-live="polite">
        {copied ? "Tersalin" : ""}
      </span>
    </div>
  );
}
