import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Acceso",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { lang } = await params;

  return <LoginForm lang={lang} />;
}
