import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnOps — Student success, made actionable",
  description: "An engineering growth and student success workspace with explainable progress signals and mentor interventions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
