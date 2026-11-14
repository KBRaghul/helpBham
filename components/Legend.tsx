import { STATUS_COLORS, STATUS_LABELS, type ReportStatus } from "@/lib/types";

export default function Legend({ showShelters = true }: { showShelters?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500" aria-label="Map legend">
      {(Object.keys(STATUS_COLORS) as ReportStatus[]).map((s) => (
        <li key={s} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s] }} />
          {STATUS_LABELS[s]}
        </li>
      ))}
      {showShelters && (
        <li className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
          Shelter
        </li>
      )}
    </ul>
  );
}
