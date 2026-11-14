"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import Legend from "@/components/Legend";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { useIsColdNight } from "@/components/ColdBanner";
import {
  Button,
  Card,
  Chip,
  KeyValue,
  MapFrame,
  Notice,
  PageHeader,
  Select,
  Stat,
  Tabs,
} from "@/components/ui";
import { useSession } from "@/lib/auth";
import { callRpc, setColdMode, timeAgo, useLock, useReports, useShelters } from "@/lib/data";
import { STATUS_LABELS, type ColdMode, type Report, type ReportStatus } from "@/lib/types";

const STATUSES = Object.keys(STATUS_LABELS) as ReportStatus[];
const COLD_LABEL: Record<ColdMode, string> = { auto: "Auto", on: "On", off: "Off" };

function avgPlacementMinutes(reports: Report[]) {
  // placed_at is set once, at placement, so later edits don't inflate this.
  const placed = reports.filter((r) => r.status === "placed" && r.placed_at);
  if (placed.length === 0) return null;
  const total = placed.reduce(
    (sum, r) => sum + (new Date(r.placed_at!).getTime() - new Date(r.created_at).getTime()),
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
  const [placing, setPlacing] = useState(false);
  const [placeShelterId, setPlaceShelterId] = useState("");
  const { busy, run } = useLock();

  const count = (s: ReportStatus) => reports.filter((r) => r.status === s).length;
  const freeBeds = shelters.filter((s) => s.open_tonight).reduce((n, s) => n + s.beds_available, 0);
  const avg = avgPlacementMinutes(reports);
  const shown = filter === "all" ? reports : reports.filter((r) => r.status === filter);
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  function select(id: string) {
    setSelectedId(id);
    setPlacing(false);
    setMsg(null);
  }

  // Status changes go through admin_set_status so beds stay consistent:
  // leaving "Placed" returns beds, entering "Placed" requires a shelter.
  function setStatus(r: Report, status: ReportStatus, shelterId?: string) {
    if (status === "placed" && !shelterId) {
      setPlacing(true);
      setPlaceShelterId(
        shelters.find((s) => s.open_tonight && s.beds_available >= r.people_count)?.id ?? "",
      );
      return;
    }
    return run(async () => {
      setMsg(null);
      const err = await callRpc("admin_set_status", {
        p_report: r.id,
        p_status: status,
        p_actor: session?.username ?? "admin",
        p_shelter: shelterId ?? null,
      });
      if (err) setMsg(err);
      else setPlacing(false);
      reload();
    });
  }

  function remove(r: Report) {
    if (!confirm(`Delete report #${r.code}? This can't be undone.`)) return;
    return run(async () => {
      const err = await callRpc("delete_report", { p_report: r.id });
      if (err) setMsg(err);
      else setSelectedId(null);
      reload();
    });
  }

  async function changeColdMode(m: ColdMode) {
    const { error } = await setColdMode(m);
    if (error) setMsg(error.message);
  }

  return (
    <>
      <PageHeader
        title="Admin"
        description="Monitor every report and shelter across Birmingham."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              Cold-Night Mode{" "}
              <span className={cold ? "font-medium text-sky-700" : "text-zinc-500"}>
                {cold ? "Active" : "Inactive"}
              </span>
              {weather?.source === "live" && <span className="tabular-nums"> · {weather.tempF}°F</span>}
            </span>
            <Tabs
              value={mode}
              onChange={changeColdMode}
              items={(["auto", "on", "off"] as ColdMode[]).map((m) => ({
                value: m,
                label: COLD_LABEL[m],
              }))}
            />
          </div>
        }
      />

      {loadError && <Notice tone="danger">{loadError}</Notice>}
      {msg && <Notice tone="danger">{msg}</Notice>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Reports" value={reports.length} />
        <Stat label="Unclaimed" value={count("reported")} />
        <Stat label="En Route" value={count("claimed")} />
        <Stat label="Need a Bed" value={count("needs_bed")} />
        <Stat label="Free Beds" value={freeBeds} hint={`Across ${shelters.length} shelters`} />
        <Stat label="Avg. Time to Bed" value={avg === null ? "–" : `${avg} min`} hint="Report to placed" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Legend />
          <MapFrame>
            <MapView
              pins={shown.map((r) => ({
                id: r.id,
                lat: r.lat,
                lng: r.lng,
                status: r.status,
                label: `#${r.code} · ${STATUS_LABELS[r.status]}`,
              }))}
              shelters={shelters}
              onSelect={select}
              selectedId={selectedId}
            />
          </MapFrame>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(["all", ...STATUSES] as const).map((s) => (
              <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
                {s === "all" ? "All" : STATUS_LABELS[s]}
              </Chip>
            ))}
          </div>

          {selected && (
            <Card
              title={`Report #${selected.code}`}
              action={<StatusBadge status={selected.status} />}
            >
              <div className="space-y-5">
                <dl className="divide-y divide-zinc-100">
                  <KeyValue label="People">{selected.people_count}</KeyValue>
                  <KeyValue label="Needs">
                    <span className="capitalize">{selected.needs.join(", ") || "–"}</span>
                  </KeyValue>
                  <KeyValue label="Reporter">{selected.reporter ?? "Anonymous"}</KeyValue>
                  <KeyValue label="Helper">{selected.helper ?? "–"}</KeyValue>
                  {selected.shelter_id && (
                    <KeyValue label="Shelter">
                      {shelters.find((s) => s.id === selected.shelter_id)?.name ?? "–"}
                    </KeyValue>
                  )}
                  {selected.note && <KeyValue label="Notes">{selected.note}</KeyValue>}
                  {selected.outcome && <KeyValue label="Outcome">{selected.outcome}</KeyValue>}
                  {selected.contact && <KeyValue label="Contact">{selected.contact}</KeyValue>}
                </dl>
                <div className="flex items-center gap-2">
                  <Select
                    aria-label="Change status"
                    value={placing ? "placed" : selected.status}
                    disabled={busy}
                    onChange={(e) => {
                      const next = e.target.value as ReportStatus;
                      if (next !== "placed") setPlacing(false);
                      if (next !== selected.status || next === "placed") setStatus(selected, next);
                    }}
                    className="flex-1"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </Select>
                  <Button variant="danger" disabled={busy} onClick={() => remove(selected)}>
                    Delete
                  </Button>
                </div>
                {placing && (
                  <div className="space-y-2 rounded-lg bg-zinc-50 p-3">
                    <div className="text-sm font-medium text-zinc-900">Place at Shelter</div>
                    <div className="flex items-center gap-2">
                      <Select
                        aria-label="Shelter"
                        value={placeShelterId}
                        onChange={(e) => setPlaceShelterId(e.target.value)}
                        className="flex-1"
                      >
                        <option value="" disabled>
                          Choose a shelter
                        </option>
                        {shelters.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            disabled={!s.open_tonight || s.beds_available < selected.people_count}
                          >
                            {s.name} · {s.open_tonight ? `${s.beds_available} Free` : "Closed"}
                          </option>
                        ))}
                      </Select>
                      <Button
                        disabled={busy || !placeShelterId}
                        onClick={() => setStatus(selected, "placed", placeShelterId)}
                      >
                        Confirm
                      </Button>
                      <Button variant="ghost" onClick={() => setPlacing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                <Timeline reportId={selected.id} version={selected.updated_at} />
              </div>
            </Card>
          )}

          <div className="max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <caption className="sr-only">All reports</caption>
              <thead className="sticky top-0 bg-white text-left">
                <tr className="border-b border-zinc-200 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th scope="col" className="px-4 py-3 font-medium">Code</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">People</th>
                  <th scope="col" className="px-4 py-3 font-medium">Helper</th>
                  <th scope="col" className="px-4 py-3 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => select(r.id)}
                    className={`cursor-pointer border-b border-zinc-100 last:border-0 ${
                      r.id === selectedId ? "bg-zinc-50" : "hover:bg-zinc-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                      #{r.code}
                      {r.urgent && (
                        <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 font-sans text-xs font-medium text-red-700">
                          Urgent
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.people_count}</td>
                    <td className="px-4 py-3 text-zinc-600">{r.helper ?? "–"}</td>
                    <td className="px-4 py-3 text-zinc-500">{timeAgo(r.created_at)}</td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                      No reports.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Card title="Shelters">
            <ul className="divide-y divide-zinc-100 text-sm">
              {shelters.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-zinc-900">{s.name}</div>
                    <div className="text-xs text-zinc-500">{s.owner ?? "No manager"}</div>
                  </div>
                  <span className={`tabular-nums ${s.open_tonight ? "text-zinc-900" : "text-zinc-500"}`}>
                    {s.open_tonight ? `${s.beds_available} / ${s.total_beds} Free` : "Closed"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
