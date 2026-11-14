"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import Legend from "@/components/Legend";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { useIsColdNight } from "@/components/ColdBanner";
import { useSession } from "@/lib/auth";
import { logEvent, setColdMode, timeAgo, useReports, useShelters } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import {
  STATUS_LABELS,
  type ColdMode,
  type Report,
  type ReportStatus,
} from "@/lib/types";

const STATUSES = Object.keys(STATUS_LABELS) as ReportStatus[];

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

function avgPlacementMinutes(reports: Report[]) {
  const placed = reports.filter((r) => r.status === "placed");
  if (placed.length === 0) return null;
  const total = placed.reduce(
    (sum, r) => sum + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()),
    0,
  );
  return Math.round(total / placed.length / 60000);
}

export default function AdminPage() {
  const session = useSession();
  const { rows: reports, reload, error: loadError } = useReports();
  const { rows: shelters } = useShelters();
  const { active: cold, mode, weather } = useIsColdNight();

  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const count = (s: ReportStatus) => reports.filter((r) => r.status === s).length;
  const freeBeds = shelters
    .filter((s) => s.open_tonight)
    .reduce((n, s) => n + s.beds_available, 0);
  const avg = avgPlacementMinutes(reports);
  const shown = filter === "all" ? reports : reports.filter((r) => r.status === filter);
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  async function setStatus(r: Report, status: ReportStatus) {
    setMsg(null);
    const patch: Partial<Report> = { status };
    if (status === "reported") {
      patch.helper = null;
      patch.claimed_at = null;
    }
    const { error } = await supabase.from("reports").update(patch).eq("id", r.id);
    if (error) setMsg(error.message);
    else await logEvent(r.id, session ?? null, `admin set ${status}`);
    reload();
  }

  async function remove(r: Report) {
    if (!confirm(`Delete report #${r.code}? This can't be undone.`)) return;
    const { error } = await supabase.from("reports").delete().eq("id", r.id);
    if (error) setMsg(error.message);
    setSelectedId(null);
    reload();
  }

  async function changeColdMode(m: ColdMode) {
    const { error } = await setColdMode(m);
    if (error) setMsg(error.message);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Admin dashboard</h1>
        <div className="flex items-center gap-2 text-sm">
          <span>
            Cold-night mode:{" "}
            <strong className={cold ? "text-sky-700" : "text-slate-500"}>
              {cold ? "ACTIVE" : "off"}
            </strong>
            {weather && (
              <span className="text-slate-500">
                {" "}
                ({weather.tempF}°F{weather.source === "fallback" ? ", demo" : ""})
              </span>
            )}
          </span>
          {(["auto", "on", "off"] as ColdMode[]).map((m) => (
            <button
              key={m}
              onClick={() => changeColdMode(m)}
              className={`px-3 py-1 rounded-lg border ${
                mode === m ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 bg-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Stat label="Total reports" value={reports.length} />
        <Stat label="Waiting for helper" value={count("reported")} />
        <Stat label="Helper on the way" value={count("claimed")} />
        <Stat label="Needs a bed" value={count("needs_bed")} />
        <Stat label="Placed" value={count("placed")} />
        <Stat label="Free beds tonight" value={freeBeds} hint={`${shelters.length} shelters`} />
        <Stat
          label="Avg. time to bed"
          value={avg === null ? "–" : `${avg}m`}
          hint="report → placed"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-2">
          <Legend />
          <div className="h-[55vh] rounded-xl overflow-hidden border border-slate-200">
            <MapView
              pins={shown.map((r) => ({
                id: r.id,
                lat: r.lat,
                lng: r.lng,
                status: r.status,
                label: `#${r.code} · ${STATUS_LABELS[r.status]}`,
              }))}
              shelters={shelters}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {(["all", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2 py-1 rounded-lg text-xs border ${
                  filter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {selected && (
            <div className="bg-white rounded-xl border border-slate-900 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono">#{selected.code}</span>
                <StatusBadge status={selected.status} />
              </div>
              <p>
                {selected.people_count}p · needs {selected.needs.join(", ") || "–"} · reporter{" "}
                {selected.reporter ?? "anon"} · helper {selected.helper ?? "–"}
                {selected.shelter_id &&
                  ` · shelter ${shelters.find((s) => s.id === selected.shelter_id)?.name ?? "?"}`}
              </p>
              {selected.note && <p className="text-slate-600">{selected.note}</p>}
              {selected.outcome && <p className="text-slate-600">Outcome: {selected.outcome}</p>}
              {selected.contact && <p className="text-slate-600">Contact: {selected.contact}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">
                  Set status
                  <select
                    value={selected.status}
                    onChange={(e) => setStatus(selected, e.target.value as ReportStatus)}
                    className="rounded border border-slate-300 px-1 py-0.5"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => remove(selected)}
                  className="ml-auto rounded-lg border border-red-300 text-red-700 px-2 py-1 hover:bg-red-50"
                >
                  Delete (spam)
                </button>
              </div>
              <Timeline reportId={selected.id} version={selected.updated_at} />
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-auto max-h-[45vh]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 sticky top-0">
                <tr>
                  <th className="p-2">Code</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">People</th>
                  <th className="p-2">Helper</th>
                  <th className="p-2">Age</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`border-t border-slate-100 cursor-pointer ${
                      r.id === selectedId ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="p-2 font-mono text-xs">
                      {r.urgent && <span className="text-red-600">● </span>}#{r.code}
                    </td>
                    <td className="p-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-2">{r.people_count}</td>
                    <td className="p-2">{r.helper ?? "–"}</td>
                    <td className="p-2 text-slate-500">{timeAgo(r.created_at)}</td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-slate-500">
                      No reports.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <h2 className="font-semibold text-sm mb-1">Shelters</h2>
            <ul className="text-sm space-y-0.5">
              {shelters.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>
                    {s.name} <span className="text-slate-400">({s.owner ?? "no manager"})</span>
                  </span>
                  <span className={s.open_tonight ? "" : "text-slate-400"}>
                    {s.open_tonight ? `${s.beds_available}/${s.beds_total} free` : "closed"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
