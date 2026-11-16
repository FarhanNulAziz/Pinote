"use client";

import Image from "next/image";
import { useState } from "react";
import { getFaviconUrl } from "@/lib/url";
import styles from "./Favicon.module.css";

type FaviconProps = {
  domain: string;
  size?: number;
};

export default function Favicon({ domain, size = 24 }: FaviconProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !domain) {
    return (
      <span
        className={styles.fallback}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 5" />
          <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" />
        </svg>
      </span>
    );
  }

  return (
    <Image
      className={styles.image}
      src={getFaviconUrl(domain)}
      alt=""
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
