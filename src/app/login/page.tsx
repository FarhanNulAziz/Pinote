"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./login.module.css";

function readError(data: unknown): string {
  if (data && typeof data === "object") {
    const message = (data as Record<string, unknown>).error;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Terjadi kesalahan. Coba lagi.";
}

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readError(data));
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand} aria-hidden="true">
          V
        </div>
        <h1 className={styles.title}>Masuk ke Pinote</h1>
        <p className={styles.subtitle}>
          Masukkan sandi untuk membuka simpanan pribadi Anda.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="password">
            Sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            required
            disabled={loading}
          />

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className={styles.button}
            disabled={loading || password.length === 0}
          >
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
