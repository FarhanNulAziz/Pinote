import Link from "next/link";
import type { HomeFilter } from "@/lib/types";
import styles from "./FilterPills.module.css";

type FilterPillsProps = {
  active: HomeFilter;
};

const FILTERS: { value: HomeFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "link", label: "Link" },
  { value: "image", label: "Gambar" },
  { value: "text", label: "Teks" },
  { value: "favorite", label: "Favorit" },
  { value: "private", label: "Pribadi" },
];

export default function FilterPills({ active }: FilterPillsProps) {
  return (
    <nav className={styles.pills} aria-label="Filter item">
      {FILTERS.map((filter) => {
        const href = filter.value === "all" ? "/" : `/?type=${filter.value}`;
        const isActive = filter.value === active;

        return (
          <Link
            key={filter.value}
            href={href}
            className={`${styles.pill} ${isActive ? styles.active : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {filter.value === "private" ? (
              <svg
                className={styles.icon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            ) : null}
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}
