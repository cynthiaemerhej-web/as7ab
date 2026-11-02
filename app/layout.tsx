import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.com";
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TopBar />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer contactEmail={contactEmail} tagline={SITE_TAGLINE} />
      </body>
    </html>
  );
}
