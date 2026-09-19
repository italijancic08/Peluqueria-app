import { redirect } from "next/navigation";
import { getProfile } from "./session";
import type { Profile } from "@/types/models";

/** Exige sesión activa. Redirige al login si no hay. */
export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || !profile.activo) redirect("/login");
  return profile;
}

/** Exige rol ADMIN. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.rol !== "ADMIN") redirect("/dashboard");
  return profile;
}

/** Para Server Actions: devuelve error en vez de redirigir. */
export async function checkAdmin(): Promise<Profile | null> {
  const profile = await getProfile();
  return profile?.rol === "ADMIN" && profile.activo ? profile : null;
}