"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scissors } from "lucide-react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const result = await login(email, password);

    if (!result.ok) {
      setError(result.error);
      setCargando(false);
      return;
    }

    const redirectTo = searchParams.get("redirect") || "/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center text-center gap-2 mb-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B4635]">
          <Scissors className="h-6 w-6 text-white" />
        </span>
        <h1 className="text-lg font-semibold text-[#4A3428] font-[family-name:var(--font-display)]">
          Iniciar sesión
        </h1>
        <p className="text-sm text-[#9C8577]">Panel de gestión</p>
      </div>

      {error && (
        <div className="rounded-lg bg-[#F7E9E2] border border-[#E8C9B8] px-3 py-2 text-sm text-[#B1543A]">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-[#4A3428]">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-[#4A3428]">
          Contraseña
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={cargando}>
        {cargando ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}