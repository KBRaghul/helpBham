"use client";

import { useMemo, useState } from "react";
import MapView from "@/components/MapView";
import Legend from "@/components/Legend";
import ReportCard from "@/components/ReportCard";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { useSession } from "@/lib/auth";
import { logEvent, miles, useReports, useShelters } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { CLAIM_TTL_MS, type Report } from "@/lib/types";

type Tab = "open" | "mine";

function isStale(r: Report) {
  return (
    r.status === "claimed" &&
    !!r.claimed_at &&
    Date.now() - new Date(r.claimed_at).getTime() > CLAIM_TTL_MS
  );
}

function staleCutoffIso() {
  return new Date(Date.now() - CLAIM_TTL_MS).toISOString();
}

export default function HelperPage() {
  const session = useSession();
  const me = session?.username ?? "";
  const { rows: reports, error: loadError, reload } = useReports();
  const { rows: shelters } = useShelters();

  const [tab, setTab] = useState<Tab>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const active = reports.filter((r) => ["reported", "claimed", "needs_bed"].includes(r.status));
  const open = useMemo(
    () =>
      reports
        .filter((r) => r.status === "reported" || isStale(r))
        // urgent first, then oldest first
        .sort(
          (a, b) =>
            Number(b.urgent) - Number(a.urgent) ||
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [reports],
  );
  const mine = reports.filter(
    (r) => r.helper === me && ["claimed", "needs_bed"].includes(r.status) && !isStale(r),
  );
  const list = tab === "open" ? open : mine;
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  const nearestShelters = selected
    ? shelters
        .filter((s) => s.open_tonight && s.beds_available > 0)
        .map((s) => ({ s, d: miles(selected, s) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)
    : [];

  async function act(
    fn: () => PromiseLike<{ error: { message: string } | null; data?: unknown[] | null }>,
    action: string,
    detail?: string,
    conflictMsg?: string,
  ) {
    if (!selected) return;
    setBusy(true);
    setMsg(null);
    const { error, data } = await fn();
    if (error) setMsg(error.message);
    else if (Array.isArray(data) && data.length === 0)
      setMsg(conflictMsg ?? "Someone else updated this report first.");
    else {
      await logEvent(selected.id, session ?? null, action, detail);
      setOutcome("");
    }
    setBusy(false);
    reload();
  }

  function claim() {
    if (!selected) return;
    const cutoff = staleCutoffIso();
    return act(
      () =>
        supabase
          .from("reports")
          .update({ status: "claimed", helper: me, claimed_at: new Date().toISOString() })
          .eq("id", selected.id)
          .or(`status.eq.reported,and(status.eq.claimed,claimed_at.lt.${cutoff})`)
          .select(),
      "claimed",
      isStale(selected) ? `took over stale claim from ${selected.helper}` : undefined,
      "Another helper just claimed this one.",
    ).then(() => setTab("mine"));
  }

  function update(patch: Partial<Report>, action: string, detail?: string) {
    if (!selected) return;
    return act(
      () =>
        supabase.from("reports").update(patch).eq("id", selected.id).eq("helper", me).select(),
      action,
      detail,
    );
  }

  const mineSelected = selected && selected.helper === me && !isStale(selected);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Helper</h1>
          <Legend />
        </div>
        <div className="h-[65vh] rounded-xl overflow-hidden border border-slate-200">
          <MapView
            pins={active.map((r) => ({
              id: r.id,
              lat: r.lat,
              lng: r.lng,
              status: r.status,
              label: `#${r.code} · ${r.people_count}p${r.urgent ? " · URGENT" : ""}`,
            }))}
            shelters={shelters}
            onSelect={setSelectedId}
            selectedId={selectedId}
          />
        </div>
      </section>

      <aside className="space-y-3">
        {selected && (
          <div className="bg-white rounded-xl border border-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">#{selected.code}</span>
              <StatusBadge status={selected.status} />
            </div>
            <div className="text-sm space-y-1">
              {selected.urgent && (
                <p className="text-red-700 font-semibold">
                  Urgent: may be unwell. Call 911 if they are unresponsive.
                </p>
              )}
              <p>
                {selected.people_count} {selected.people_count === 1 ? "person" : "people"}
                {selected.needs.length > 0 && ` · needs ${selected.needs.join(", ")}`}
              </p>
              {selected.note && <p className="text-slate-600">{selected.note}</p>}
              {selected.contact && (
                <p className="text-slate-600">Reporter contact: {selected.contact}</p>
              )}
              <a
                className="text-blue-600 underline"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
              >
                Directions ↗
              </a>
            </div>

            {(selected.status === "reported" || isStale(selected)) && (
              <button
                disabled={busy}
                onClick={claim}
                className="w-full rounded-lg bg-amber-500 text-white py-2 font-medium hover:bg-amber-600 disabled:opacity-50"
              >
                {isStale(selected) ? "Take over stale claim" : "I'm on my way (claim)"}
              </button>
            )}

            {mineSelected && selected.status === "claimed" && (
              <div className="space-y-2">
                <input
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="What happened? Supplies given?"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={busy}
                    onClick={() =>
                      update(
                        { status: "needs_bed", outcome: outcome || null },
                        "needs a bed",
                        outcome || undefined,
                      )
                    }
                    className="rounded-lg bg-purple-600 text-white py-2 text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    Needs a shelter bed
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      update(
                        { status: "closed", outcome: outcome || "resolved on site" },
                        "closed",
                        outcome || "resolved on site",
                      )
                    }
                    className="rounded-lg bg-slate-700 text-white py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
                  >
                    Resolved / not found
                  </button>
                </div>
                <button
                  disabled={busy}
                  onClick={() =>
                    update(
                      { status: "reported", helper: null, claimed_at: null },
                      "released",
                      outcome || undefined,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 py-1.5 text-sm hover:bg-slate-50"
                >
                  I can&apos;t go (release)
                </button>
              </div>
            )}

            {mineSelected && selected.status === "needs_bed" && (
              <p className="text-sm text-purple-700">
                Waiting for a shelter to accept. Stay with them if you can.
              </p>
            )}

            {nearestShelters.length > 0 && selected.status !== "placed" && (
              <div className="text-sm">
                <div className="font-medium">Nearest shelters with beds</div>
                <ul className="text-slate-600">
                  {nearestShelters.map(({ s, d }) => (
                    <li key={s.id}>
                      🏠 {s.name}: {s.beds_available} beds · {d.toFixed(1)} mi
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <Timeline reportId={selected.id} version={selected.updated_at} />
          </div>
        )}

        <div className="flex gap-2">
          {(["open", "mine"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-sm ${
                tab === t ? "bg-slate-900 text-white" : "bg-white border border-slate-200"
              }`}
            >
              {t === "open" ? `Open (${open.length})` : `My jobs (${mine.length})`}
            </button>
          ))}
        </div>
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {list.length === 0 && (
            <p className="text-sm text-slate-500">
              {tab === "open" ? "No open reports right now." : "You have no active jobs."}
            </p>
          )}
          {list.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              selected={r.id === selectedId}
              onClick={() => setSelectedId(r.id)}
              extra={isStale(r) ? " · claim expired" : undefined}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
