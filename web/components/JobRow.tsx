import Link from "next/link";
import type { ReactNode } from "react";

export function JobRow({
  href,
  title,
  meta,
  aside
}: {
  href: string;
  title: string;
  meta: string;
  aside: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-zinc-900/50 sm:items-center"
      >
        <span className="min-w-0">
          <span className="block text-pretty break-words font-medium text-zinc-100">{title}</span>
          <span className="mt-0.5 block truncate text-sm text-zinc-500">{meta}</span>
        </span>
        <span className="shrink-0 text-right text-sm tabular-nums text-zinc-400">{aside}</span>
      </Link>
    </li>
  );
}
