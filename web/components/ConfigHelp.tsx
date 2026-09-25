export function ConfigHelp({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-xl font-semibold text-amber-300">Port UI — configuración requerida</h1>
      <p className="mt-4 text-sm text-zinc-300">{message}</p>
      <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-300">
        <p className="font-medium text-zinc-100">En Vercel (Project → Settings → Environment Variables):</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><code>PORT_DATA_BACKEND</code> = <code>github</code></li>
          <li><code>GITHUB_TOKEN</code> — PAT con acceso al repo <code>Ian9Franco/Port</code> (contents + Actions)</li>
          <li><code>GITHUB_REPOSITORY</code> = <code>Ian9Franco/Port</code></li>
          <li><code>PORT_UI_SECRET</code> — contraseña de la UI</li>
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          El build de Next.js puede pasar aunque falten variables; el error aparece al cargar datos en runtime.
        </p>
      </section>
    </main>
  );
}
