import { LibraryPage } from "@/components/dashboard/content/LibraryPage";
import { brandSchema } from "@/lib/content/schema";

export default async function DashboardContentLibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ brand?: string }>;
}) {
  const { lang } = await params;
  const brand = brandSchema.catch("portfolio").parse((await searchParams).brand);

  return <LibraryPage lang={lang} brand={brand} />;
}
