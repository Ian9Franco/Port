"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret })
      });
      if (!response.ok) throw new Error("Invalid secret");
      router.push("/");
      router.refresh();
    } catch {
      setError("Secret incorrecto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-xl font-semibold">Port — acceso privado</h1>
      <p className="mt-2 text-sm text-zinc-400">Ingresá el secreto configurado en <code>PORT_UI_SECRET</code>.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          type="password"
          value={secret}
          onChange={event => setSecret(event.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          placeholder="Secret"
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </main>
  );
}
