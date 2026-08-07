import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getSessionUser } from "@/lib/supabase/server";

type DashboardRouteLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function DashboardRouteLayout({
  children,
  params,
}: DashboardRouteLayoutProps) {
  const { lang } = await params;

  const user = await getSessionUser();

  if (!user) {
    redirect(`/${lang}/panel-acceso`);
  }

  return (
    <DashboardLayout lang={lang} userEmail={user.email}>
      {children}
    </DashboardLayout>
  );
}
