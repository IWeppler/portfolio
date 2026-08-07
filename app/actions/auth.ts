"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
});

type SignInInput = z.input<typeof signInSchema>;

type SignInResult = {
  success: boolean;
  error?: string;
};

export async function signIn(input: SignInInput): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "invalid_credentials" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: "invalid_credentials" };
  }

  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
