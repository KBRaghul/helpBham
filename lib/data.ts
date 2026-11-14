"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { ColdMode, Report, Session, Shelter } from "./types";

export async function logEvent(
  reportId: string,
  session: Session | null,
  action: string,
  detail?: string,
) {
  await supabase.from("report_events").insert({
    report_id: reportId,
    actor: session?.username ?? "anonymous",
    role: session?.role ?? null,
    action,
    detail: detail ?? null,
  });
}

/** Loads a table and re-loads it whenever Supabase Realtime reports a change. */
function useLiveTable<T>(table: string, order: string, ascending: boolean) {
  const [rows, setRows] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(order, { ascending });
    if (error) setError(error.message);
    else {
      setError(null);
      setRows((data ?? []) as T[]);
    }
    setLoading(false);
  }, [table, order, ascending]);

  useEffect(() => {
    reload();
    const channel = supabase
      .channel(`live-${table}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        reload();
      })
      .subscribe();
    // Fallback poll in case Realtime is not enabled on the project.
    const t = setInterval(reload, 15000);
    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [table, reload]);

  return { rows, error, loading, reload };
}

export function useReports() {
  return useLiveTable<Report>("reports", "created_at", false);
}

export function useShelters() {
  return useLiveTable<Shelter>("shelters", "name", true);
}

export function useColdMode() {
  const { rows, reload } = useLiveTable<{ id: number; cold_mode: ColdMode }>(
    "settings",
    "id",
    true,
  );
  return { mode: (rows[0]?.cold_mode ?? "auto") as ColdMode, reload };
}

export async function setColdMode(mode: ColdMode) {
  return supabase.from("settings").update({ cold_mode: mode }).eq("id", 1);
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

/** Straight-line distance in miles. */
export function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
