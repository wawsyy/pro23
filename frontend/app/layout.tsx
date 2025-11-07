import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Encrypted Trip Planner",
  description:
    "Plan and analyse private itineraries with local AES encryption and FHE-powered smart contracts.",
  other: {
    "Content-Language": "en",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased" lang="en">
        <Providers>
          <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_#dbeafe,_transparent_45%)]" />
            <main className="relative mx-auto flex max-w-screen-2xl flex-col gap-10 px-4 pb-24 pt-10 md:px-10">
              <SiteNav />
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
