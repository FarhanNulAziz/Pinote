import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { isAuthenticated } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pinote",
  description: "Simpan link, gambar, dan teks dengan aman.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const authenticated = await isAuthenticated();

  return (
    <html lang="id" className={geistSans.variable}>
      <body className={authenticated ? "app-shell" : undefined}>
        {authenticated ? <Sidebar /> : null}
        {children}
      </body>
    </html>
  );
}
