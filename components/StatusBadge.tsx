import { STATUS_COLORS, STATUS_LABELS, type ReportStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ background: STATUS_COLORS[status] }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
