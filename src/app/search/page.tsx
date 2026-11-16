import type { Metadata } from "next";
import BottomNav from "@/components/BottomNav";
import { requireSession } from "@/lib/auth";
import { listSearchHistory } from "@/lib/search-history";
import type { SearchHistoryEntry } from "@/lib/types";
import SearchExplorer from "./SearchExplorer";
import styles from "./search.module.css";

export const metadata: Metadata = {
  title: "Cari - Pinote",
};

export default async function SearchPage() {
  await requireSession();

  let initialHistory: SearchHistoryEntry[] = [];

  try {
    initialHistory = await listSearchHistory();
  } catch {
    initialHistory = [];
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Pinote</p>
          <h1 className={styles.title}>Cari</h1>
          <p className={styles.subtitle}>
            Temukan kembali tautan, gambar, dan teks yang pernah Anda simpan.
          </p>
        </header>

        <SearchExplorer initialHistory={initialHistory} />
      </div>

      <BottomNav />
    </main>
  );
}
