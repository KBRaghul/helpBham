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
  extra?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 text-sm transition ${
        selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-slate-500">#{r.code}</span>
        <StatusBadge status={r.status} />
      </div>
      <div className="mt-1">
        {r.urgent && <span className="mr-1 text-red-600 font-semibold">URGENT</span>}
        {r.people_count} {r.people_count === 1 ? "person" : "people"}
        {r.needs.length > 0 && <span className="text-slate-500"> · needs {r.needs.join(", ")}</span>}
      </div>
      {r.note && <div className="text-slate-600 truncate">{r.note}</div>}
      <div className="text-xs text-slate-500 mt-1">
        {timeAgo(r.created_at)}
        {r.helper ? ` · helper: ${r.helper}` : ""}
        {extra}
      </div>
    </button>
  );
}
