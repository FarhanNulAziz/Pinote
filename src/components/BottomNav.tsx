"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, HomeIcon, PlusIcon, SearchIcon } from "./NavIcons";
import styles from "./BottomNav.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: HomeIcon },
  { href: "/search", label: "Cari", icon: SearchIcon },
  { href: "/add", label: "Tambah", icon: PlusIcon, primary: true },
  { href: "/folders", label: "Folder", icon: FolderIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Navigasi utama">
      <div className={styles.inner}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const className = [
            styles.item,
            "primary" in item && item.primary ? styles.primary : "",
            isActive ? styles.active : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={className}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={
                  "primary" in item && item.primary
                    ? styles.primaryCircle
                    : styles.icon
                }
              >
                <Icon />
              </span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
