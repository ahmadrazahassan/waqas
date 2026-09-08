import { AnnouncementBar } from "@/components/marketing/announcement-bar";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CtaBand } from "@/components/marketing/cta-band";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <CtaBand />
      <SiteFooter />
    </>
  );
}
