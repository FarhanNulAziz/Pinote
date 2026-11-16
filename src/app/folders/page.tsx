import type { Metadata } from "next";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import Favicon from "@/components/Favicon";
import { requireSession } from "@/lib/auth";
import { listFoldersWithSummary } from "@/lib/folders";
import type { FolderSummary, Item, ItemType } from "@/lib/types";
import { getDomain } from "@/lib/url";
import NewFolderForm from "./NewFolderForm";
import styles from "./folders.module.css";

export const metadata: Metadata = {
  title: "Folder - Pinote",
};

function formatCounts(counts: Record<ItemType, number>): string {
  const parts: string[] = [];

  if (counts.link > 0) {
    parts.push(`${counts.link} link`);
  }

  if (counts.image > 0) {
    parts.push(`${counts.image} gambar`);
  }

  if (counts.text > 0) {
    parts.push(`${counts.text} teks`);
  }

  return parts.length > 0 ? parts.join(", ") : "Belum ada item";
}

function PreviewTile({ item }: { item: Item }) {
  if (item.type === "image") {
    return (
      <div className={`${styles.tile} ${styles.tileImage}`}>
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className={styles.tileImageContent} />
        ) : (
          <svg
            className={styles.tileIcon}
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
        )}
      </div>
    );
  }

  if (item.type === "link" && item.url) {
    return (
      <div className={`${styles.tile} ${styles.tileLink}`}>
        <Favicon domain={getDomain(item.url)} size={20} />
      </div>
    );
  }

  return (
    <div className={`${styles.tile} ${styles.tileText}`}>
      <svg
        className={styles.tileIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 11h5M8 7h8" />
        <path d="M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-4 3v-3H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      </svg>
    </div>
  );
}

function FolderPreview({ folder }: { folder: FolderSummary }) {
  const previewCount = Math.min(folder.previewItems.length, 4);

  if (previewCount === 0) {
    return (
      <div className={styles.collage}>
        <div className={styles.collageEmpty}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
          </svg>
          <span>Kosong</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.collage} ${styles[`collage${previewCount}`] ?? ""}`}
    >
      {folder.previewItems.slice(0, 4).map((item) => (
        <PreviewTile key={item.id} item={item} />
      ))}
    </div>
  );
}

export default async function FoldersPage() {
  await requireSession();

  let folders: FolderSummary[] = [];
  let loadError = false;

  try {
    folders = await listFoldersWithSummary();
  } catch {
    loadError = true;
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Pinote</p>
          <h1 className={styles.title}>Folder</h1>
          <p className={styles.subtitle}>
            Kelompokkan tautan, gambar, dan teks agar mudah dibuka kembali.
          </p>
        </header>

        <NewFolderForm />

        {loadError ? (
          <section className={styles.stateCard} role="alert">
            <h2 className={styles.stateTitle}>Gagal memuat folder</h2>
            <p className={styles.stateText}>
              Terjadi masalah saat mengambil data folder. Coba muat ulang
              halaman ini.
            </p>
            <Link href="/folders" className={styles.stateCta}>
              Coba lagi
            </Link>
          </section>
        ) : folders.length === 0 ? (
          <section className={styles.stateCard}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
              </svg>
            </span>
            <h2 className={styles.stateTitle}>Belum ada folder</h2>
            <p className={styles.stateText}>
              Buat folder pertama untuk mulai mengelompokkan item Pinote.
            </p>
            <Link href="/add" className={styles.stateCta}>
              Tambah item
            </Link>
          </section>
        ) : (
          <div className={styles.grid}>
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/folders/${folder.id}`}
                className={styles.folderCard}
              >
                <FolderPreview folder={folder} />
                <div className={styles.folderBody}>
                  <div className={styles.folderTop}>
                    <h2 className={styles.folderName}>{folder.name}</h2>
                    <span
                      className={`${styles.statusBadge} ${folder.is_private ? styles.statusPrivate : ""}`}
                    >
                      {folder.is_private ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                      ) : null}
                      {folder.is_private ? "Pribadi" : "Biasa"}
                    </span>
                  </div>
                  <p className={styles.folderCounts}>
                    {formatCounts(folder.counts)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
