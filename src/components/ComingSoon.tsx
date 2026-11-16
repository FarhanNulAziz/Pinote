import BottomNav from "./BottomNav";
import styles from "./ComingSoon.module.css";

type ComingSoonProps = {
  title: string;
  description: string;
};

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Pinote</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>

        <section className={styles.card}>
          <p>Fitur ini sedang disiapkan dan akan tersedia pada langkah berikutnya.</p>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
