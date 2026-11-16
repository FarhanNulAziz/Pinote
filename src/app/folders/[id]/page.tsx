import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Favicon from "@/components/Favicon";
import { requireSession } from "@/lib/auth";
import { getFolder, listFolderItems, listFolders } from "@/lib/folders";
import type { Folder, Item } from "@/lib/types";
import { getDomain } from "@/lib/url";
import { isUuid } from "@/lib/validation";
import FolderMenu from "./FolderMenu";
import styles from "./folder.module.css";

export const metadata: Metadata = {
  title: "Isi folder - Pinote",
};

type FolderPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getDescription(item: Item): string {
  if (item.type === "link" && item.url) {
    return getDomain(item.url);
  }

  if (item.type === "text" && item.content) {
    return item.content;
  }

  return "Gambar tersimpan";
}

function ItemThumb({ item }: { item: Item }) {
  if (item.type === "image") {
    return (
      <span className={`${styles.thumb} ${styles.thumbImage}`}>
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className={styles.thumbContent} />
        ) : (
          <svg
            className={styles.thumbIcon}
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
      </span>
    );
  }

  if (item.type === "link" && item.url) {
    return (
      <span className={`${styles.thumb} ${styles.thumbLink}`}>
        <Favicon domain={getDomain(item.url)} size={22} />
      </span>
    );
  }

  return (
    <span className={`${styles.thumb} ${styles.thumbText}`}>
      <svg
        className={styles.thumbIcon}
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
    </span>
  );
}

export default async function FolderPage({ params }: FolderPageProps) {
  await requireSession();

  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  let folder: Folder | null = null;
  let items: Item[] = [];
  let allFolders: Folder[] = [];
  let loadError = false;

  try {
    folder = await getFolder(id);

    if (folder) {
      items = await listFolderItems(id);
    }
  } catch {
    loadError = true;
  }

  try {
    allFolders = await listFolders();
  } catch {
    allFolders = [];
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.folderSidebar} aria-label="Daftar folder">
          <div className={styles.sidebarHeader}>
            <p className={styles.eyebrow}>Folder</p>
            <h2 className={styles.sidebarTitle}>Semua folder</h2>
          </div>

          {allFolders.length === 0 ? (
            <p className={styles.sidebarMuted}>Belum ada folder lain.</p>
          ) : (
            <nav className={styles.folderNav}>
              {allFolders.map((entry) => {
                const active = entry.id === id;

                return (
                  <Link
                    key={entry.id}
                    href={`/folders/${entry.id}`}
                    className={`${styles.folderNavItem} ${active ? styles.folderNavItemActive : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className={styles.folderNavName}>{entry.name}</span>
                    {entry.is_private ? (
                      <svg
                        className={styles.folderNavLock}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-label="Folder pribadi"
                      >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          )}
        </aside>

        <div className={styles.container}>
        {loadError ? (
          <>
            <header className={styles.header}>
              <div className={styles.headerRow}>
                <Link
                  href="/folders"
                  className={styles.back}
                  aria-label="Kembali ke folder"
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
                    <path d="m15 5-7 7 7 7" />
                  </svg>
                </Link>
                <h1 className={styles.headerFallback}>Folder</h1>
              </div>
            </header>
            <section className={styles.stateCard} role="alert">
              <h2 className={styles.stateTitle}>Gagal memuat folder</h2>
              <p className={styles.stateText}>
                Terjadi masalah saat mengambil isi folder. Coba muat ulang
                halaman ini.
              </p>
              <Link href="/folders" className={styles.stateCta}>
                Kembali ke folder
              </Link>
            </section>
          </>
        ) : !folder ? (
          notFound()
        ) : (
          <>
            <header className={styles.header}>
              <div className={styles.headerRow}>
                <Link
                  href="/folders"
                  className={styles.back}
                  aria-label="Kembali ke folder"
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
                    <path d="m15 5-7 7 7 7" />
                  </svg>
                </Link>
                <div className={styles.headerText}>
                  <p className={styles.eyebrow}>Folder</p>
                  <h1 className={styles.title}>{folder.name}</h1>
                  <p className={styles.subtitle}>
                    {items.length} item
                    {folder.is_private ? " · Pribadi" : ""}
                  </p>
                </div>
                <FolderMenu folder={folder} />
              </div>
            </header>

            {items.length === 0 ? (
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
                <h2 className={styles.stateTitle}>Folder ini masih kosong</h2>
                <p className={styles.stateText}>
                  Tambahkan item baru lalu pilih folder ini sebagai tempat
                  penyimpanan.
                </p>
                <Link href="/add" className={styles.stateCta}>
                  Tambah item
                </Link>
              </section>
            ) : (
              <div className={styles.list}>
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className={styles.itemRow}
                  >
                    <ItemThumb item={item} />
                    <span className={styles.itemBody}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemMeta}>
                        <span className={styles.itemDescription}>
                          {getDescription(item)}
                        </span>
                        <span className={styles.dot} aria-hidden="true">
                          ·
                        </span>
                        <span className={styles.itemDate}>
                          {formatDate(item.created_at)}
                        </span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
