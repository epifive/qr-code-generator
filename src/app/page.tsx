import { GeneratorLoader, Header } from "@/components/Chrome";
import { Faq, Features, Footer, FreeVsPro, GENERAL_FAQ, Hero } from "@/components/Landing";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero
          title="Free QR code generator with logos, colours and UPI"
          intro="Make QR codes for links, UPI payments, WiFi, contact cards, WhatsApp and more. Style them, add your logo and a call to action, test the scan, then download PNG, SVG or a print-ready PDF."
        />
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <GeneratorLoader />
        </div>
        <Features />
        <FreeVsPro />
        <Faq items={GENERAL_FAQ} />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: SITE.fullName,
            url: SITE.url,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            description: SITE.description,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@type": "Organization", name: "EpiFive", url: SITE.brandUrl },
          }),
        }}
      />
    </>
  );
}
