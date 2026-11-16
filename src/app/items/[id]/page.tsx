import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { requireSession } from "@/lib/auth";
import { listFolders } from "@/lib/folders";
import { getItem } from "@/lib/items";
import { getPrivateFolderIds, isItemPrivate } from "@/lib/privacy";
import type { Folder, Item } from "@/lib/types";
import { isUuid } from "@/lib/validation";
import ItemDetail from "./ItemDetail";
import styles from "./detail.module.css";

export const metadata: Metadata = {
  title: "Detail item - Pinote",
};

type ItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ItemPage({ params }: ItemPageProps) {
  await requireSession();

  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  let item: Item | null = null;
  let folders: Folder[] = [];
  let loadError = false;

  try {
    item = await getItem(id);

    if (item) {
      const privateFolderIds = await getPrivateFolderIds();
      item = {
        ...item,
        is_effectively_private: isItemPrivate(item, privateFolderIds),
      };
      folders = await listFolders();
    }
  } catch {
    loadError = true;
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.back} aria-label="Kembali ke beranda">
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
          <h1 className={styles.headerTitle}>Detail item</h1>
          <Link
            href="/"
            className={styles.close}
            aria-label="Tutup detail item"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </Link>
        </header>

        {loadError ? (
          <section className={styles.stateCard} role="alert">
            <h2 className={styles.stateTitle}>Gagal memuat item</h2>
            <p className={styles.stateText}>
              Terjadi masalah saat mengambil data. Coba muat ulang halaman ini.
            </p>
            <Link href="/" className={styles.stateCta}>
              Kembali ke beranda
            </Link>
          </section>
        ) : !item ? (
          notFound()
        ) : (
          <ItemDetail item={item} folders={folders} />
        )}
      </div>

      <BottomNav />
    </main>
  );
}
