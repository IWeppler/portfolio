"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, LogIn, Mail } from "lucide-react";
import { signIn } from "@/app/actions/auth";

type LoginFormProps = {
  lang: string;
};

export function LoginForm({ lang }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signIn({ email, password });

      if (!result.success) {
        setError("Email o contraseña incorrectos.");
        return;
      }

      router.push(`/${lang}/dashboard`);
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-surface p-6 shadow-2xl shadow-black/10 md:p-8">
        <div className="mb-6 flex flex-col gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
            <Lock className="h-5 w-5 text-orange" />
          </div>
          <h1 className="mt-2 text-2xl font-medium uppercase tracking-tight">
            Acceso al panel
          </h1>
          <p className="text-sm text-paragraph">
            Iniciá sesión con tu cuenta de administrador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Email</span>
            <span className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paragraph" />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-md border border-white/10 bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-paragraph/70 focus:border-orange"
                placeholder="vos@ejemplo.com"
              />
            </span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Contraseña
            </span>
            <span className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paragraph" />
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-md border border-white/10 bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-paragraph/70 focus:border-orange"
                placeholder="••••••••"
              />
            </span>
          </label>

          {error && (
            <p className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-orange/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isSubmitting ? "Ingresando" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
