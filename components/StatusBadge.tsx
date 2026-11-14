import { STATUS_COLORS, STATUS_LABELS, type ReportStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-700">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[status] }} />
      {STATUS_LABELS[status]}
    </span>
  );
}
