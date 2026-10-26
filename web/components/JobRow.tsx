import Link from "next/link";
import type { ReactNode } from "react";

export function JobRow({
  href,
  title,
  meta,
  aside,
  footer
}: {
  href: string;
  title: string;
  meta: string;
  aside: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <Link href={href} className="min-w-0 flex-1 rounded-md hover:bg-zinc-900/50">
          <span className="block text-pretty break-words font-medium text-zinc-100">{title}</span>
          <span className="mt-0.5 block truncate text-sm text-zinc-500">{meta}</span>
        </Link>
        <span className="shrink-0 text-right text-sm tabular-nums text-zinc-400">{aside}</span>
      </div>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </li>
  );
}
