"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Favicon from "@/components/Favicon";
import type {
  Item,
  ItemType,
  PopularTag,
  SearchHistoryEntry,
} from "@/lib/types";
import { getDomain } from "@/lib/url";
import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/validation";
import styles from "./search.module.css";

type SearchExplorerProps = {
  initialHistory: SearchHistoryEntry[];
};

type SearchStatus = "idle" | "loading" | "success" | "error";

const TYPE_FILTERS: { value: ItemType; label: string }[] = [
  { value: "link", label: "Link" },
  { value: "image", label: "Gambar" },
  { value: "text", label: "Teks" },
];

function readError(data: unknown): string {
  if (data && typeof data === "object") {
    const message = (data as Record<string, unknown>).error;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Terjadi kesalahan. Coba lagi.";
}

function getTypeLabel(type: ItemType): string {
  if (type === "link") {
    return "LINK";
  }

  if (type === "image") {
    return "GAMBAR";
  }

  return "TEKS";
}

function getDescription(item: Item): string {
  if (item.type === "link" && item.url) {
    return getDomain(item.url);
  }

  if (item.type === "text" && item.content) {
    return item.content;
  }

  return item.type === "image" ? "Gambar tersimpan" : "";
}

function SearchIcon() {
  return (
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
  );
}

function CloseIcon() {
  return (
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
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 7h4v4H7z" />
      <path d="M13 7h4v4h-4z" />
      <path d="M7 11c0 3-1 5-3 6" />
      <path d="M13 11c0 3-1 5-3 6" />
    </svg>
  );
}

export default function SearchExplorer({
  initialHistory,
}: SearchExplorerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<ItemType[]>([]);
  const [results, setResults] = useState<Item[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [reloadToken, setReloadToken] = useState(0);
  const [history, setHistory] = useState(initialHistory);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [includePrivate, setIncludePrivate] = useState(false);

  const keyword = query.trim();
  const showExplore = keyword.length === 0;

  useEffect(() => {
    if (!keyword) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({ q: keyword });

      if (selectedTypes.length > 0) {
        params.set("types", selectedTypes.join(","));
      }

      if (includePrivate) {
        params.set("includePrivate", "true");
      }

      try {
        const response = await fetch(`/api/items?${params.toString()}`, {
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const data: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const items =
          data && typeof data === "object"
            ? (data as Record<string, unknown>).items
            : null;

        setResults(Array.isArray(items) ? (items as Item[]) : []);
        setStatus("success");
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setStatus("error");
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [keyword, selectedTypes, includePrivate, reloadToken, router]);

  useEffect(() => {
    let active = true;

    async function loadPopularTags() {
      try {
        const response = await fetch("/api/tags/popular");

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const data: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          if (active) {
            setPopularError("Gagal memuat tag populer.");
          }
          return;
        }

        const tags =
          data && typeof data === "object"
            ? (data as Record<string, unknown>).tags
            : null;

        if (active) {
          setPopularTags(Array.isArray(tags) ? (tags as PopularTag[]) : []);
          setPopularError(null);
        }
      } catch {
        if (active) {
          setPopularError("Gagal memuat tag populer.");
        }
      }
    }

    void loadPopularTags();

    return () => {
      active = false;
    };
  }, [router]);

  function updateQuery(value: string) {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
  }

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    updateQuery(event.target.value);
  }

  function clearQuery() {
    updateQuery("");
    inputRef.current?.focus();
  }

  function toggleType(type: ItemType) {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((value) => value !== type)
        : [...current, type],
    );

    if (keyword) {
      setStatus("loading");
    }
  }

  async function recordHistory(value: string) {
    try {
      const response = await fetch("/api/search-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setHistoryError(readError(data));
        return;
      }

      const entries =
        data && typeof data === "object"
          ? (data as Record<string, unknown>).history
          : null;

      if (Array.isArray(entries)) {
        setHistory(entries as SearchHistoryEntry[]);
      }

      setHistoryError(null);
    } catch {
      setHistoryError("Gagal menyimpan riwayat pencarian.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!keyword) {
      inputRef.current?.focus();
      return;
    }

    if (status === "error") {
      setStatus("loading");
      setReloadToken((token) => token + 1);
    }

    void recordHistory(keyword);
  }

  function runSearch(value: string) {
    const nextKeyword = value.trim();

    if (!nextKeyword) {
      return;
    }

    if (nextKeyword !== keyword) {
      setQuery(nextKeyword);
      setStatus("loading");
    }

    void recordHistory(nextKeyword);
  }

  async function removeHistoryEntry(id: string) {
    if (historyBusy) {
      return;
    }

    setHistoryBusy(true);
    setHistoryError(null);

    try {
      const response = await fetch(`/api/search-history/${id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setHistoryError(readError(data));
        return;
      }

      setHistory((current) => current.filter((entry) => entry.id !== id));
    } catch {
      setHistoryError("Gagal menghapus riwayat pencarian.");
    } finally {
      setHistoryBusy(false);
    }
  }

  async function clearHistory() {
    if (historyBusy) {
      return;
    }

    setHistoryBusy(true);
    setHistoryError(null);

    try {
      const response = await fetch("/api/search-history", {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setHistoryError(readError(data));
        return;
      }

      setHistory([]);
    } catch {
      setHistoryError("Gagal menghapus riwayat pencarian.");
    } finally {
      setHistoryBusy(false);
    }
  }

  return (
    <div className={styles.explorer}>
      <form
        className={styles.searchBar}
        role="search"
        onSubmit={handleSubmit}
      >
        <button
          type="submit"
          className={styles.searchButton}
          aria-label="Jalankan pencarian"
        >
          <SearchIcon />
        </button>
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          value={query}
          onChange={handleQueryChange}
          placeholder="Cari judul, isi, atau catatan..."
          maxLength={SEARCH_QUERY_MAX_LENGTH}
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Kata kunci pencarian"
        />
        {query ? (
          <button
            type="button"
            className={styles.clearButton}
            onClick={clearQuery}
            aria-label="Bersihkan pencarian"
          >
            <CloseIcon />
          </button>
        ) : null}
      </form>

      <div className={styles.sidebar}>
        <div className={styles.filters}>
          <div
            className={styles.typeFilters}
            role="group"
            aria-label="Filter jenis"
          >
            {TYPE_FILTERS.map((filter) => {
              const isActive = selectedTypes.includes(filter.value);

              return (
                <button
                  key={filter.value}
                  type="button"
                  className={`${styles.typePill} ${isActive ? styles.typePillActive : ""}`}
                  onClick={() => toggleType(filter.value)}
                  aria-pressed={isActive}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <label className={styles.privateSwitch} htmlFor="search-private">
            <span className={styles.privateSwitchText}>
              <span className={styles.privateSwitchTitle}>
                Termasuk item pribadi
              </span>
              <span className={styles.privateSwitchHint}>
                Tampilkan juga item dan folder yang ditandai pribadi.
              </span>
            </span>
            <span className={styles.switchControl}>
              <input
                id="search-private"
                type="checkbox"
                className={styles.switchInput}
                checked={includePrivate}
                onChange={(event) => {
                  setIncludePrivate(event.target.checked);

                  if (keyword) {
                    setStatus("loading");
                  }
                }}
              />
              <span className={styles.switchTrack} aria-hidden="true" />
            </span>
          </label>
        </div>

        <aside
          className={`${styles.sidePanel} ${showExplore ? "" : styles.sidePanelMobileHidden}`}
          aria-label="Riwayat dan tag populer"
        >
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Riwayat pencarian</h2>
              {history.length > 0 ? (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={clearHistory}
                  disabled={historyBusy}
                >
                  Hapus semua
                </button>
              ) : null}
            </div>

            {historyError ? (
              <p className={styles.historyError} role="alert">
                {historyError}
              </p>
            ) : null}

            {history.length === 0 ? (
              <p className={styles.muted}>Belum ada riwayat pencarian.</p>
            ) : (
              <ul className={styles.historyList}>
                {history.map((entry) => (
                  <li key={entry.id} className={styles.historyItem}>
                    <button
                      type="button"
                      className={styles.historyQuery}
                      onClick={() => runSearch(entry.query)}
                    >
                      <ClockIcon />
                      <span>{entry.query}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.historyDelete}
                      onClick={() => removeHistoryEntry(entry.id)}
                      disabled={historyBusy}
                      aria-label={`Hapus riwayat ${entry.query}`}
                    >
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Tag populer</h2>
            </div>

            {popularError ? (
              <p className={styles.historyError} role="alert">
                {popularError}
              </p>
            ) : popularTags.length === 0 ? (
              <p className={styles.muted}>
                Belum ada tag. Tambahkan tag saat menyimpan item.
              </p>
            ) : (
              <div className={styles.tagCloud}>
                {popularTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={styles.tagChip}
                    onClick={() => runSearch(tag.name)}
                  >
                    #{tag.name}
                    <span className={styles.tagCount}>{tag.itemCount}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <div className={styles.mainPanel}>
        {showExplore ? (
          <section className={styles.tipCard}>
            <div className={styles.tipIcon} aria-hidden="true">
              <SearchIcon />
            </div>
            <div>
              <h2 className={styles.tipTitle}>Tips pencarian</h2>
              <p className={styles.tipText}>
                Cari berdasarkan judul, domain, isi teks, catatan, atau tag.
                Tekan Enter untuk menyimpan kata kunci ke riwayat.
              </p>
            </div>
          </section>
        ) : (
          <section className={styles.resultsSection} aria-live="polite">
            {status === "loading" ? (
              <p className={styles.status}>Mencari...</p>
            ) : null}

            {status === "error" ? (
              <div className={styles.errorCard} role="alert">
                <h2 className={styles.errorTitle}>Gagal mencari</h2>
                <p className={styles.errorText}>
                  Terjadi masalah saat mencari item. Coba lagi.
                </p>
              </div>
            ) : null}

            {status === "success" && results.length === 0 ? (
              <div className={styles.emptyCard}>
                <h2 className={styles.emptyTitle}>Tidak ada hasil</h2>
                <p className={styles.emptyText}>
                  Coba kata kunci lain atau ubah filter jenis item.
                </p>
              </div>
            ) : null}

            {status === "success" && results.length > 0 ? (
              <>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {results.length} hasil untuk “{keyword}”
                  </h2>
                </div>
                <div className={styles.results}>
                  {results.map((item) => {
                    const description = getDescription(item);

                    return (
                      <Link
                        key={item.id}
                        href={`/items/${item.id}`}
                        className={styles.result}
                      >
                        <div className={styles.thumb}>
                          {item.type === "link" && item.url ? (
                            <Favicon domain={getDomain(item.url)} size={24} />
                          ) : item.type === "image" && item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className={styles.thumbImage}
                              src={item.image_url}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <span className={styles.thumbQuote}>
                              <QuoteIcon />
                            </span>
                          )}
                        </div>
                        <div className={styles.resultBody}>
                          <div className={styles.resultMeta}>
                            <span className={styles.badge}>
                              {getTypeLabel(item.type)}
                            </span>
                            {item.is_favorite ? (
                              <span className={styles.favoriteBadge}>
                                Favorit
                              </span>
                            ) : null}
                            {item.is_effectively_private ? (
                              <span className={styles.privateBadge}>
                                Pribadi
                              </span>
                            ) : null}
                          </div>
                          <h3 className={styles.resultTitle}>{item.title}</h3>
                          {description ? (
                            <p className={styles.resultText}>{description}</p>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}
