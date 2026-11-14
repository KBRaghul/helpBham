import { STATUS_COLORS, STATUS_LABELS, type ReportStatus } from "@/lib/types";

export default function Legend({ showShelters = true }: { showShelters?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
      {(Object.keys(STATUS_COLORS) as ReportStatus[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s] }} />
          {STATUS_LABELS[s]}
        </span>
      ))}
      {showShelters && (
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-white ring-1 ring-blue-600 bg-blue-600" />
          Shelter
        </span>
      )}
    </div>
  );
}
