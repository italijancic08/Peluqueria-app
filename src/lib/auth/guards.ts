import { redirect } from "next/navigation";
import { getProfile } from "./session";
import type { Profile } from "@/types/models";

/** Exige sesión activa. Redirige al login si no hay. Para usar en páginas. */
export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || !profile.activo) redirect("/login");
  return profile;
}

/** Exige rol ADMIN. Para usar en páginas. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.rol !== "ADMIN") redirect("/dashboard");
  return profile;
}

/** Para Server Actions: devuelve el perfil o null, sin redirigir. */
export async function checkAuth(): Promise<Profile | null> {
  const profile = await getProfile();
  return profile && profile.activo ? profile : null;
}

/** Para Server Actions que exigen rol ADMIN, sin redirigir. */
export async function checkAdmin(): Promise<Profile | null> {
  const profile = await checkAuth();
  return profile?.rol === "ADMIN" ? profile : null;
}