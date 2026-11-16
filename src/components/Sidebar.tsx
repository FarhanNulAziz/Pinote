"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  SearchIcon,
} from "./NavIcons";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: HomeIcon, match: "home" },
  { href: "/search", label: "Cari", icon: SearchIcon, match: "search" },
  { href: "/folders", label: "Folder", icon: FolderIcon, match: "folders" },
] as const;

function isActive(pathname: string, match: (typeof NAV_ITEMS)[number]["match"]) {
  if (match === "home") {
    return pathname === "/";
  }

  return pathname.startsWith(`/${match}`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const addActive = pathname.startsWith("/add");

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">
          P
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>Pinote</span>
          <span className={styles.brandHint}>Simpanan pribadi</span>
        </span>
      </div>

      <nav className={styles.nav} aria-label="Navigasi utama">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.match);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.item} ${active ? styles.active : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.icon}>
                <Icon />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/add"
        className={`${styles.add} ${addActive ? styles.addActive : ""}`}
        aria-current={addActive ? "page" : undefined}
      >
        <span className={styles.addIcon}>
          <PlusIcon />
        </span>
        Tambah
      </Link>

      <form className={styles.logoutForm} action="/api/logout" method="post">
        <button type="submit" className={styles.logout}>
          <span className={styles.icon}>
            <LogoutIcon />
          </span>
          Keluar
        </button>
      </form>
    </aside>
  );
}
