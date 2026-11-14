import StatusBadge from "./StatusBadge";
import { timeAgo } from "@/lib/data";
import type { Report } from "@/lib/types";

export default function ReportCard({
  report: r,
  selected,
  onClick,
  extra,
}: {
  report: Report;
  selected?: boolean;
  onClick?: () => void;
  extra?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      aria-pressed={onClick ? selected : undefined}
      className={`block w-full rounded-lg border p-4 text-left transition-colors ${
        selected ? "border-zinc-900 bg-white ring-1 ring-zinc-900" : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-zinc-500">#{r.code}</span>
        <StatusBadge status={r.status} />
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-900">
        {r.people_count} {r.people_count === 1 ? "Person" : "People"}
        {r.urgent && (
          <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700">
            Urgent
          </span>
        )}
      </p>
      {r.needs.length > 0 && (
        <p className="mt-0.5 text-sm capitalize text-zinc-600">{r.needs.join(", ")}</p>
      )}
      {r.note && <p className="mt-0.5 truncate text-sm text-zinc-500">{r.note}</p>}
      <p className="mt-2 text-xs text-zinc-500">
        {timeAgo(r.created_at)}
        {r.helper ? ` · ${r.helper}` : ""}
        {extra ? ` · ${extra}` : ""}
      </p>
    </Tag>
  );
}
