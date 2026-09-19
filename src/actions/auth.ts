"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/models";
import { redirect } from "next/navigation";

export async function login(
  email: string,
  password: string
): Promise<ActionResult> {
  if (!email || !password) {
    return { ok: false, error: "Completá email y contraseña." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: "Email o contraseña incorrectos." };
  }

  return { ok: true, data: undefined };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}