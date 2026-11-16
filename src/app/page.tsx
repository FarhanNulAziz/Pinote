import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import FilterPills from "@/components/FilterPills";
import ItemCard from "@/components/ItemCard";
import { requireSession } from "@/lib/auth";
import { listItems } from "@/lib/items";
import {
  filterItemsByPrivacy,
  getPrivateFolderIds,
  withEffectivePrivacy,
} from "@/lib/privacy";
import type { HomeFilter, Item } from "@/lib/types";
import styles from "./page.module.css";

type HomePageProps = {
  searchParams: Promise<{ type?: string | string[] }>;
};

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 11) {
    return "Halo, selamat pagi";
  }

  if (hour < 15) {
    return "Halo, selamat siang";
  }

  if (hour < 18) {
    return "Halo, selamat sore";
  }

  return "Halo, selamat malam";
}

function getFilterLabel(filter: HomeFilter): string {
  if (filter === "link") {
    return "link";
  }

  if (filter === "image") {
    return "gambar";
  }

  if (filter === "text") {
    return "teks";
  }

  if (filter === "favorite") {
    return "favorit";
  }

  if (filter === "private") {
    return "pribadi";
  }

  return "item";
}

export default async function Home({ searchParams }: HomePageProps) {
  await requireSession();

  const params = await searchParams;
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const active: HomeFilter =
    rawType === "link" ||
    rawType === "image" ||
    rawType === "text" ||
    rawType === "favorite" ||
    rawType === "private"
      ? rawType
      : "all";

  let allItems: Item[] = [];
  let visibleItems: Item[] = [];
  let loadError = false;

  try {
    const [fetchedItems, privateFolderIds] = await Promise.all([
      listItems("all"),
      getPrivateFolderIds(),
    ]);
    allItems = withEffectivePrivacy(fetchedItems, privateFolderIds);
    visibleItems = filterItemsByPrivacy(
      allItems,
      privateFolderIds,
      "visible",
    );
  } catch {
    loadError = true;
  }

  const items =
    active === "all"
      ? visibleItems
      : active === "private"
        ? allItems.filter((item) => item.is_effectively_private)
        : active === "favorite"
          ? visibleItems.filter((item) => item.is_favorite)
          : visibleItems.filter((item) => item.type === active);
  const filterLabel = getFilterLabel(active);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.avatar} aria-hidden="true">
            P
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.greeting}>{getGreeting()}</h1>
            <p className={styles.count}>
              {visibleItems.length} item tersimpan
            </p>
          </div>
          <Link
            href="/search"
            className={styles.searchLink}
            aria-label="Cari item di Pinote"
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
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span>Cari di Pinote</span>
          </Link>
          <form
            className={styles.logoutForm}
            action="/api/logout"
            method="post"
          >
            <button type="submit" className={styles.logout}>
              Keluar
            </button>
          </form>
        </header>

        <FilterPills active={active} />

        {loadError ? (
          <section className={styles.stateCard} role="alert">
            <h2 className={styles.stateTitle}>Gagal memuat item</h2>
            <p className={styles.stateText}>
              Terjadi masalah saat mengambil data. Coba muat ulang halaman ini.
            </p>
          </section>
        ) : items.length === 0 ? (
          <section className={styles.stateCard}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
                <path d="M8 9h8" />
                <path d="M8 13h8" />
                <path d="M8 17h5" />
              </svg>
            </div>
            <h2 className={styles.stateTitle}>
              {allItems.length === 0
                ? "Belum ada item"
                : active === "all"
                  ? "Belum ada item untuk ditampilkan"
                  : `Belum ada item ${filterLabel}`}
            </h2>
            <p className={styles.stateText}>
              {allItems.length === 0
                ? "Simpan tautan, gambar, atau teks pertama Anda di Pinote."
                : active === "favorite"
                  ? "Tandai item dengan ikon bookmark untuk menyimpannya di sini."
                  : active === "private"
                    ? "Tandai item atau folder sebagai pribadi untuk melihatnya di sini."
                    : active === "all"
                      ? "Item pribadi hanya muncul saat filter Pribadi dipilih."
                      : "Tambahkan item baru untuk mengisi filter ini."}
            </p>
            <Link href="/add" className={styles.cta}>
              {allItems.length === 0 ? "Tambah item pertama" : "Tambah item"}
            </Link>
          </section>
        ) : (
          <div className={styles.feed}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
