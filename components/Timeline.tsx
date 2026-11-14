"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/data";
import type { ReportEvent } from "@/lib/types";

/** Audit trail for one report. `version` (e.g. updated_at) triggers a refetch. */
export default function Timeline({ reportId, version }: { reportId: string; version?: string }) {
  const [events, setEvents] = useState<ReportEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("report_events")
      .select("*")
      .eq("report_id", reportId)
      .order("at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setEvents((data ?? []) as ReportEvent[]);
      });
    return () => {
      cancelled = true;
    };
  }, [reportId, version]);

  if (events.length === 0) return null;
  return (
    <ol className="border-l-2 border-slate-200 pl-3 space-y-1">
      {events.map((e) => (
        <li key={e.id} className="text-xs text-slate-600">
          <span className="font-medium text-slate-800">{e.action}</span>
          {e.detail ? `: ${e.detail}` : ""}{" "}
          <span className="text-slate-400">
            by {e.actor ?? "?"}, {timeAgo(e.at)}
          </span>
        </li>
      ))}
    </ol>
  );
}
