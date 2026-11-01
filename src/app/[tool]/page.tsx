import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GeneratorLoader, Header } from "@/components/Chrome";
import { Faq, Features, Footer, FreeVsPro, GENERAL_FAQ, Hero } from "@/components/Landing";
import { TYPE_INFO } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return TYPE_INFO.map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[tool]">): Promise<Metadata> {
  const { tool } = await params;
  const info = TYPE_INFO.find((t) => t.slug === tool);
  if (!info) return {};
  return {
    title: info.h1,
    description: info.intro,
    alternates: { canonical: `/${info.slug}` },
    openGraph: { title: info.h1, description: info.intro, url: `/${info.slug}` },
  };
}

export default async function ToolPage({ params }: PageProps<"/[tool]">) {
  const { tool } = await params;
  const info = TYPE_INFO.find((t) => t.slug === tool);
  if (!info) notFound();
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero title={info.h1} intro={info.intro} />
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <GeneratorLoader initialType={info.type} />
        </div>
        <Features />
        <FreeVsPro />
        <Faq items={[...info.tips, ...GENERAL_FAQ]} />
      </main>
      <Footer />
    </>
  );
}
