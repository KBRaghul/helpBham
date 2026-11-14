"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import Legend from "@/components/Legend";
import ReportCard from "@/components/ReportCard";
import Timeline from "@/components/Timeline";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  MapFrame,
  Notice,
  PageHeader,
  Select,
} from "@/components/ui";
import { useSession } from "@/lib/auth";
import { logEvent, miles, useReports, useShelters } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { Shelter } from "@/lib/types";

export default function MissionaryPage() {
  const session = useSession();
  const me = session?.username ?? "";
  const isAdmin = session?.role === "admin";
  const { rows: reports, reload: reloadReports } = useReports();
  const { rows: shelters, reload: reloadShelters, error: loadError } = useShelters();

  // Missionaries manage the shelters they own; admin can act as any shelter.
  const myShelters = isAdmin ? shelters : shelters.filter((s) => s.owner === me);
  const [pickedShelterId, setPickedShelterId] = useState<string | null>(null);
  const shelter: Shelter | undefined =
    myShelters.find((s) => s.id === pickedShelterId) ?? myShelters[0];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // New-shelter form (for a missionary with no shelter yet)
  const [newName, setNewName] = useState("");
  const [newBeds, setNewBeds] = useState(10);
  const [newLoc, setNewLoc] = useState<{ lat: number; lng: number } | null>(null);

  const waiting = reports
    .filter((r) => r.status === "needs_bed")
    .map((r) => ({ r, d: shelter ? miles(r, shelter) : 0 }))
    .sort((a, b) => a.d - b.d);
  const placedHere = shelter
    ? reports.filter((r) => r.status === "placed" && r.shelter_id === shelter.id)
    : [];
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  async function saveShelter(patch: Partial<Shelter>) {
    if (!shelter) return;
    setMsg(null);
    const { error } = await supabase.from("shelters").update(patch).eq("id", shelter.id);
    if (error) setMsg(error.message);
    reloadShelters();
  }

  async function accept(reportId: string) {
    if (!shelter) return;
    const r = reports.find((x) => x.id === reportId);
    if (!r) return;
    if (!shelter.open_tonight || shelter.beds_available < r.people_count) {
      setMsg(`Not enough free beds (${shelter.beds_available}) for ${r.people_count} people.`);
      return;
    }
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase
      .from("reports")
      .update({ status: "placed", shelter_id: shelter.id })
      .eq("id", reportId)
      .eq("status", "needs_bed")
      .select();
    if (error) setMsg(error.message);
    else if (!data || data.length === 0) setMsg("Another shelter already accepted this person.");
    else {
      await supabase
        .from("shelters")
        .update({ beds_available: Math.max(0, shelter.beds_available - r.people_count) })
        .eq("id", shelter.id);
      await logEvent(reportId, session ?? null, "placed", shelter.name);
      setSelectedId(null);
    }
    setBusy(false);
    reloadReports();
    reloadShelters();
  }

  async function createShelter(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newLoc) {
      setMsg("Give the shelter a name and tap its location on the map.");
      return;
    }
    const { error } = await supabase.from("shelters").insert({
      name: newName.trim(),
      lat: newLoc.lat,
      lng: newLoc.lng,
      total_beds: newBeds,
      beds_available: newBeds,
      owner: me,
    });
    if (error) setMsg(error.message);
    else {
      setNewName("");
      setNewLoc(null);
    }
    reloadShelters();
  }

  return (
    <>
      <PageHeader
        title="Missionary"
        description="Keep your shelter's capacity up to date and accept people who need a bed tonight."
        actions={<Legend />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <MapFrame>
          <MapView
            pins={waiting.map(({ r }) => ({
              id: r.id,
              lat: r.lat,
              lng: r.lng,
              status: r.status,
              label: `#${r.code} · Needs a Bed`,
            }))}
            shelters={shelters}
            onSelect={setSelectedId}
            selectedId={selectedId}
            onPick={!shelter ? (lat, lng) => setNewLoc({ lat, lng }) : undefined}
            picked={!shelter ? newLoc : null}
          />
        </MapFrame>

        <div className="space-y-6">
          {loadError && <Notice tone="danger">{loadError}</Notice>}
          {msg && <Notice tone="danger">{msg}</Notice>}

          {!shelter && (
            <Card title="Register Your Shelter">
              <form onSubmit={createShelter} className="space-y-4">
                <Field label="Shelter Name">
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                </Field>
                <Field label="Total Beds">
                  <Input
                    type="number"
                    min={0}
                    value={newBeds}
                    onChange={(e) => setNewBeds(Math.max(0, Number(e.target.value) || 0))}
                    className="w-24"
                  />
                </Field>
                <p className="text-sm text-zinc-500">
                  {newLoc ? `Location: ${newLoc.lat}, ${newLoc.lng}` : "Tap the map to set the location."}
                </p>
                <Button type="submit" block>
                  Create Shelter
                </Button>
              </form>
            </Card>
          )}

          {shelter && (
            <Card title={shelter.name}>
              <div className="space-y-5">
                {myShelters.length > 1 && (
                  <Select
                    aria-label="Choose shelter"
                    value={shelter.id}
                    onChange={(e) => setPickedShelterId(e.target.value)}
                  >
                    {myShelters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                )}
                {shelter.address && <p className="-mt-3 text-sm text-zinc-500">{shelter.address}</p>}

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">Beds Free Tonight</div>
                    <div className="text-xs text-zinc-500">of {shelter.total_beds} total</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label="Remove one bed"
                      onClick={() =>
                        saveShelter({ beds_available: Math.max(0, shelter.beds_available - 1) })
                      }
                    >
                      −
                    </Button>
                    <span className="w-10 text-center text-3xl font-semibold tabular-nums">
                      {shelter.beds_available}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label="Add one bed"
                      onClick={() =>
                        saveShelter({
                          beds_available: Math.min(shelter.total_beds, shelter.beds_available + 1),
                        })
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>

                <label className="flex items-center justify-between border-t border-zinc-100 pt-4 text-sm">
                  <span className="font-medium text-zinc-900">Open Tonight</span>
                  <input
                    type="checkbox"
                    checked={shelter.open_tonight}
                    onChange={(e) => saveShelter({ open_tonight: e.target.checked })}
                    className="h-4 w-4 accent-zinc-900"
                  />
                </label>
              </div>
            </Card>
          )}

          {shelter && (
            <Card title={`Waiting for a Bed (${waiting.length})`}>
              {waiting.length === 0 ? (
                <EmptyState>Nobody is waiting right now.</EmptyState>
              ) : (
                <div className="space-y-3">
                  {waiting.map(({ r, d }) => (
                    <div key={r.id} className="space-y-3">
                      <ReportCard
                        report={r}
                        selected={r.id === selectedId}
                        onClick={() => setSelectedId(r.id)}
                        extra={`${d.toFixed(1)} mi away`}
                      />
                      {r.id === selectedId && (
                        <div className="space-y-4 px-1 pb-2">
                          {r.outcome && (
                            <p className="text-sm text-zinc-600">
                              <span className="text-zinc-500">Helper note:</span> {r.outcome}
                            </p>
                          )}
                          <Button block disabled={busy} onClick={() => accept(r.id)}>
                            Accept and Place
                          </Button>
                          {selected && (
                            <Timeline reportId={selected.id} version={selected.updated_at} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {shelter && placedHere.length > 0 && (
            <Card title={`Placed Here (${placedHere.length})`}>
              <div className="space-y-3">
                {placedHere.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
