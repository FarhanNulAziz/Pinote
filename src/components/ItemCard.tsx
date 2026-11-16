import Link from "next/link";
import CardActions from "./CardActions";
import Favicon from "./Favicon";
import { getDomain } from "@/lib/url";
import type { Item } from "@/lib/types";
import styles from "./ItemCard.module.css";

type ItemCardProps = {
  item: Item;
};

export default function ItemCard({ item }: ItemCardProps) {
  const lock = item.is_effectively_private ? (
    <span className={styles.lockBadge} aria-label="Item pribadi">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  ) : null;
  const tags =
    item.tags && item.tags.length > 0 ? (
      <div className={styles.tagRow}>
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag.id} className={styles.tagChip}>
            #{tag.name}
          </span>
        ))}
      </div>
    ) : null;

  if (item.type === "link" && item.url) {
    const domain = getDomain(item.url);

    return (
      <article className={`${styles.card} ${styles.linkCard}`}>
        <Link className={styles.linkBody} href={`/items/${item.id}`}>
          <div className={styles.linkTop}>
            <Favicon domain={domain} size={22} />
            <span className={styles.domain}>{domain}</span>
          </div>
          <h2 className={styles.linkTitle}>{item.title}</h2>
          {tags}
          <span className={styles.badge}>LINK</span>
        </Link>
        {lock}
        <CardActions
          itemId={item.id}
          type={item.type}
          url={item.url}
          content={item.content}
          isFavorite={item.is_favorite}
        />
      </article>
    );
  }

  if (item.type === "image") {
    return (
      <article className={`${styles.card} ${styles.imageCard}`}>
        <Link className={styles.imageLink} href={`/items/${item.id}`}>
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.image}
              src={item.image_url}
              alt={item.title}
              loading="lazy"
            />
          ) : (
            <div className={styles.imageFallback}>Gambar tidak tersedia</div>
          )}
          <div className={styles.imageBody}>
            <h2 className={styles.imageTitle}>{item.title}</h2>
            {tags}
            <span className={styles.badge}>GAMBAR</span>
          </div>
        </Link>
        {lock}
        <CardActions
          itemId={item.id}
          type={item.type}
          url={item.url}
          content={item.content}
          isFavorite={item.is_favorite}
        />
      </article>
    );
  }

  if (item.type === "text" && item.content) {
    return (
      <article className={`${styles.card} ${styles.textCard}`}>
        <Link className={styles.textBody} href={`/items/${item.id}`}>
          <div className={styles.quoteMark} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 7h4v4H7z" />
              <path d="M13 7h4v4h-4z" />
              <path d="M7 11c0 3-1 5-3 6" />
              <path d="M13 11c0 3-1 5-3 6" />
            </svg>
          </div>
          <p className={styles.quoteText}>{item.content}</p>
          <h2 className={styles.textTitle}>{item.title}</h2>
          {tags}
          <span className={styles.badge}>TEKS</span>
        </Link>
        {lock}
        <CardActions
          itemId={item.id}
          type={item.type}
          url={item.url}
          content={item.content}
          isFavorite={item.is_favorite}
        />
      </article>
    );
  }

  return null;
}
