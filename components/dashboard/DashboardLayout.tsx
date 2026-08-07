import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { AdminHeader } from "@/components/dashboard/AdminHeader";

type DashboardLayoutProps = {
  children: React.ReactNode;
  lang: string;
  userEmail?: string | null;
};

export function DashboardLayout({
  children,
  lang,
  userEmail,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardSidebar lang={lang} />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <AdminHeader lang={lang} userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto px-4 pb-12 pt-8 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
