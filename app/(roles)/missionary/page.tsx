"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import Legend from "@/components/Legend";
import ReportCard from "@/components/ReportCard";
import Timeline from "@/components/Timeline";
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
      beds_total: newBeds,
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
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Shelter / Missionary</h1>
          <Legend />
        </div>
        <div className="h-[65vh] rounded-xl overflow-hidden border border-slate-200">
          <MapView
            pins={waiting.map(({ r }) => ({
              id: r.id,
              lat: r.lat,
              lng: r.lng,
              status: r.status,
              label: `#${r.code} · ${r.people_count}p needs a bed`,
            }))}
            shelters={shelters}
            onSelect={setSelectedId}
            selectedId={selectedId}
            onPick={!shelter ? (lat, lng) => setNewLoc({ lat, lng }) : undefined}
            picked={!shelter ? newLoc : null}
          />
        </div>
      </section>

      <aside className="space-y-3">
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {msg && <p className="text-sm text-red-600">{msg}</p>}

        {!shelter && (
          <form
            onSubmit={createShelter}
            className="bg-white rounded-xl border border-slate-200 p-4 space-y-2"
          >
            <h2 className="font-semibold">Register your shelter</h2>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Shelter name"
              className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
            <label className="text-sm flex items-center gap-2">
              Beds
              <input
                type="number"
                min={0}
                value={newBeds}
                onChange={(e) => setNewBeds(Math.max(0, Number(e.target.value) || 0))}
                className="w-20 rounded-lg border border-slate-300 px-2 py-1"
              />
            </label>
            <p className="text-xs text-slate-500">
              {newLoc ? `Location: ${newLoc.lat}, ${newLoc.lng}` : "Tap the map to set location."}
            </p>
            <button className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm">
              Create shelter
            </button>
          </form>
        )}

        {shelter && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            {myShelters.length > 1 && (
              <select
                value={shelter.id}
                onChange={(e) => setPickedShelterId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
              >
                {myShelters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            <div>
              <h2 className="font-semibold">🏠 {shelter.name}</h2>
              {shelter.address && <p className="text-xs text-slate-500">{shelter.address}</p>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Beds free tonight</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    saveShelter({ beds_available: Math.max(0, shelter.beds_available - 1) })
                  }
                  className="w-8 h-8 rounded-lg border border-slate-300"
                >
                  −
                </button>
                <span className="text-2xl font-bold w-10 text-center">
                  {shelter.beds_available}
                </span>
                <button
                  onClick={() =>
                    saveShelter({
                      beds_available: Math.min(shelter.beds_total, shelter.beds_available + 1),
                    })
                  }
                  className="w-8 h-8 rounded-lg border border-slate-300"
                >
                  +
                </button>
                <span className="text-xs text-slate-500">/ {shelter.beds_total}</span>
              </div>
            </div>
            <label className="flex items-center justify-between text-sm">
              Open tonight
              <input
                type="checkbox"
                checked={shelter.open_tonight}
                onChange={(e) => saveShelter({ open_tonight: e.target.checked })}
              />
            </label>
          </div>
        )}

        {shelter && (
          <div className="space-y-2">
            <h2 className="font-semibold">Waiting for a bed ({waiting.length})</h2>
            {waiting.length === 0 && (
              <p className="text-sm text-slate-500">Nobody is waiting right now.</p>
            )}
            {waiting.map(({ r, d }) => (
              <div key={r.id} className="space-y-1">
                <ReportCard
                  report={r}
                  selected={r.id === selectedId}
                  onClick={() => setSelectedId(r.id)}
                  extra={` · ${d.toFixed(1)} mi away`}
                />
                {r.id === selectedId && (
                  <div className="pl-2 space-y-2">
                    {r.outcome && (
                      <p className="text-xs text-slate-600">Helper note: {r.outcome}</p>
                    )}
                    <button
                      disabled={busy}
                      onClick={() => accept(r.id)}
                      className="w-full rounded-lg bg-green-600 text-white py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      Accept: we have a bed
                    </button>
                    {selected && <Timeline reportId={selected.id} version={selected.updated_at} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {shelter && placedHere.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold">Placed here ({placedHere.length})</h2>
            {placedHere.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
