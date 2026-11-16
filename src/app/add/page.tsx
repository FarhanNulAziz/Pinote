import type { Metadata } from "next";
import BottomNav from "@/components/BottomNav";
import { requireSession } from "@/lib/auth";
import { listFolders } from "@/lib/folders";
import type { Folder } from "@/lib/types";
import AddForm from "./AddForm";
import styles from "./add.module.css";

export const metadata: Metadata = {
  title: "Tambah item - Pinote",
};

export default async function AddPage() {
  await requireSession();

  let folders: Folder[] = [];

  try {
    folders = await listFolders();
  } catch {
    folders = [];
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Pinote</p>
          <h1 className={styles.title}>Tambah ke Pinote</h1>
          <p className={styles.subtitle}>
            Simpan tautan, gambar, atau teks dengan judul yang Anda tulis
            sendiri.
          </p>
        </header>

        <AddForm folders={folders} />
      </div>

      <BottomNav />
    </main>
  );
}
