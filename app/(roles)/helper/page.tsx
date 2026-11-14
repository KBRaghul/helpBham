"use client";

import { useMemo, useState } from "react";
import MapView from "@/components/MapView";
import Legend from "@/components/Legend";
import DirectionsLink from "@/components/DirectionsLink";
import ReportCard from "@/components/ReportCard";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import {
  Button,
  Card,
  EmptyState,
  Input,
  KeyValue,
  MapFrame,
  Notice,
  PageHeader,
  SectionLabel,
  Tabs,
} from "@/components/ui";
import { useSession } from "@/lib/auth";
import { logEvent, miles, useLock, useReports, useShelters } from "@/lib/data";
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
  const { busy, run } = useLock();
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
    const report = selected;
    return run(async () => {
      setMsg(null);
      const { error, data } = await fn();
      if (error) setMsg(error.message);
      else if (Array.isArray(data) && data.length === 0)
        setMsg(conflictMsg ?? "Someone else updated this report first.");
      else {
        await logEvent(report.id, session ?? null, action, detail);
        setOutcome("");
      }
      reload();
    });
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
          .or(`status.eq.reported,and(status.eq.claimed,claimed_at.lt."${cutoff}")`)
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
    <>
      <PageHeader
        title="Helper"
        description="Claim an open report, check on the person and request a bed if they need one."
        actions={<Legend />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <MapFrame>
          <MapView
            pins={active.map((r) => ({
              id: r.id,
              lat: r.lat,
              lng: r.lng,
              status: r.status,
              label: `#${r.code} · ${r.people_count} ${r.people_count === 1 ? "Person" : "People"}`,
            }))}
            shelters={shelters}
            onSelect={setSelectedId}
            selectedId={selectedId}
          />
        </MapFrame>

        <div className="space-y-6">
          {selected && (
            <Card
              title={`Report #${selected.code}`}
              action={<StatusBadge status={selected.status} />}
            >
              <div className="space-y-5">
                {selected.urgent && (
                  <Notice tone="danger">
                    Urgent: may be unwell. Call 911 if they are unresponsive.
                  </Notice>
                )}

                <dl className="divide-y divide-zinc-100">
                  <KeyValue label="People">{selected.people_count}</KeyValue>
                  {selected.needs.length > 0 && (
                    <KeyValue label="Needs">
                      <span className="capitalize">{selected.needs.join(", ")}</span>
                    </KeyValue>
                  )}
                  {selected.note && <KeyValue label="Notes">{selected.note}</KeyValue>}
                  {/* Reporter contact is only shown to the helper handling the report. */}
                  {selected.contact && mineSelected && (
                    <KeyValue label="Reporter">{selected.contact}</KeyValue>
                  )}
                  <KeyValue label="Location">
                    <DirectionsLink
                      lat={selected.lat}
                      lng={selected.lng}
                      className="font-medium text-zinc-900 underline underline-offset-2"
                    />
                  </KeyValue>
                </dl>

                {(selected.status === "reported" || isStale(selected)) && (
                  <Button block disabled={busy} onClick={claim}>
                    {isStale(selected) ? "Take Over Claim" : "Claim Report"}
                  </Button>
                )}

                {mineSelected && selected.status === "claimed" && (
                  <div className="space-y-3">
                    <Input
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                      placeholder="What happened? Supplies given?"
                      aria-label="Outcome notes"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        disabled={busy}
                        onClick={() =>
                          update(
                            { status: "needs_bed", outcome: outcome || null },
                            "needs a bed",
                            outcome || undefined,
                          )
                        }
                      >
                        Request Bed
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          update(
                            { status: "closed", outcome: outcome || "resolved on site" },
                            "closed",
                            outcome || "resolved on site",
                          )
                        }
                      >
                        Mark Resolved
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      block
                      disabled={busy}
                      onClick={() =>
                        update(
                          { status: "reported", helper: null, claimed_at: null },
                          "released",
                          outcome || undefined,
                        )
                      }
                    >
                      Release Claim
                    </Button>
                  </div>
                )}

                {mineSelected && selected.status === "needs_bed" && (
                  <Notice>Waiting for a shelter to accept. Stay with them if you can.</Notice>
                )}

                {msg && <Notice tone="danger">{msg}</Notice>}

                {nearestShelters.length > 0 && selected.status !== "placed" && (
                  <div>
                    <SectionLabel>Nearest Shelters</SectionLabel>
                    <ul className="mt-2 divide-y divide-zinc-100 text-sm">
                      {nearestShelters.map(({ s, d }) => (
                        <li key={s.id} className="flex justify-between py-1.5">
                          <span className="text-zinc-900">{s.name}</span>
                          <span className="tabular-nums text-zinc-500">
                            {s.beds_available} Beds · {d.toFixed(1)} mi
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Timeline reportId={selected.id} version={selected.updated_at} />
              </div>
            </Card>
          )}

          <div className="space-y-4">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "open", label: `Open (${open.length})` },
                { value: "mine", label: `My Jobs (${mine.length})` },
              ]}
            />
            {loadError && <Notice tone="danger">{loadError}</Notice>}
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {list.length === 0 ? (
                <EmptyState>
                  {tab === "open" ? "No open reports right now." : "You have no active jobs."}
                </EmptyState>
              ) : (
                list.map((r) => (
                  <ReportCard
                    key={r.id}
                    report={r}
                    selected={r.id === selectedId}
                    onClick={() => setSelectedId(r.id)}
                    extra={isStale(r) ? "Claim expired" : undefined}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
