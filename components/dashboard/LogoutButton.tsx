"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";

type LogoutButtonProps = {
  lang: string;
};

export function LogoutButton({ lang }: LogoutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);

    try {
      await signOut();
      router.push(`/${lang}/panel-acceso`);
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isSigningOut}
      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-paragraph transition-colors hover:bg-white/[0.05] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {isSigningOut ? "Cerrando sesión" : "Cerrar sesión"}
    </button>
  );
}
