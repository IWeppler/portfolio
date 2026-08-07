import { LoginForm } from "@/components/auth/LoginForm";

type LoginPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { lang } = await params;

  return <LoginForm lang={lang} />;
}
