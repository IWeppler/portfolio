import { ContentPage } from "@/components/dashboard/content/ContentPage";
import { brandSchema } from "@/lib/content/schema";

export default async function DashboardContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ brand?: string }>;
}) {
  const { lang } = await params;
  const brand = brandSchema.catch("portfolio").parse((await searchParams).brand);

  return <ContentPage lang={lang} brand={brand} />;
}
