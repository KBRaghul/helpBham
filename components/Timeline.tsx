"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/data";
import type { ReportEvent } from "@/lib/types";
import { SectionLabel } from "./ui";

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
    <div>
      <SectionLabel>Activity</SectionLabel>
      <ol className="mt-3 space-y-3 border-l border-zinc-200 pl-4">
        {events.map((e) => (
          <li key={e.id} className="relative text-sm">
            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-zinc-400" />
            <span className="font-medium capitalize text-zinc-900">{e.action}</span>
            {e.detail && <span className="text-zinc-600"> · {e.detail}</span>}
            <div className="text-xs text-zinc-500">
              {e.actor ?? "Unknown"} · {timeAgo(e.at)}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
