import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import TopBar from "@/components/TopBar";
import Announcement from "@/components/Announcement";
import Footer from "@/components/Footer";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings(await createClient());
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TopBar />
        <Announcement text={settings.announcement_text} enabled={settings.announcement_enabled} />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer contactEmail={settings.contact_email} tagline={settings.tagline} />
      </body>
    </html>
  );
}
