"use client";

import { useState, type KeyboardEvent } from "react";
import { TAG_NAME_MAX_LENGTH } from "@/lib/validation";
import styles from "./TagInput.module.css";

type TagInputProps = {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
};

export default function TagInput({
  id,
  value,
  onChange,
  disabled = false,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(rawValue: string) {
    const name = rawValue.trim().toLowerCase();

    if (!name || value.includes(name)) {
      setDraft("");
      return;
    }

    onChange([...value, name]);
    setDraft("");
  }

  function removeTag(name: string) {
    onChange(value.filter((tag) => tag !== name));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();

      if (draft.trim()) {
        addTag(draft);
      }

      return;
    }

    if (event.key === "Backspace" && !draft && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className={`${styles.wrapper} ${disabled ? styles.disabled : ""}`}>
      {value.length > 0 ? (
        <div className={styles.tags}>
          {value.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeTag(tag)}
                disabled={disabled}
                aria-label={`Hapus tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className={styles.entry}>
        <input
          id={id}
          type="text"
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) {
              addTag(draft);
            }
          }}
          placeholder="Tambah tag lalu Enter"
          maxLength={TAG_NAME_MAX_LENGTH}
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.add}
          onClick={() => addTag(draft)}
          disabled={disabled || !draft.trim()}
        >
          Tambah
        </button>
      </div>
    </div>
  );
}
