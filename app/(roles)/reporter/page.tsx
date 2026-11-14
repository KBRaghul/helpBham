"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import StatusBadge from "@/components/StatusBadge";
import { useSession } from "@/lib/auth";
import { logEvent, timeAgo, useReports, useShelters } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { NEEDS, type Report } from "@/lib/types";

const IN_BHAM = (lat: number, lng: number) =>
  lat >= 33.38 && lat <= 33.65 && lng >= -87.0 && lng <= -86.6;

export default function ReporterPage() {
  const session = useSession();
  const { rows: reports, error: loadError } = useReports();
  const { rows: shelters } = useShelters();

  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [people, setPeople] = useState(1);
  const [needs, setNeeds] = useState<string[]>([]);
  const [urgent, setUrgent] = useState(false);
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const mine = reports.filter((r) => r.reporter === session?.username);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMsg({ ok: false, text: "Location is not available in this browser." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000) / 1000;
        const lng = Math.round(pos.coords.longitude * 1000) / 1000;
        if (!IN_BHAM(lat, lng)) {
          setMsg({ ok: false, text: "You appear to be outside Birmingham. Tap the map instead." });
          return;
        }
        setPicked({ lat, lng });
      },
      () => setMsg({ ok: false, text: "Couldn't get your location. Tap the map instead." }),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) {
      setMsg({ ok: false, text: "Tap the map to mark where the person is." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase
      .from("reports")
      .insert({
        lat: picked.lat,
        lng: picked.lng,
        people_count: people,
        needs,
        urgent,
        note: note.trim() || null,
        contact: contact.trim() || null,
        reporter: session?.username ?? null,
      })
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      setMsg({ ok: false, text: `Couldn't send report: ${error?.message ?? "unknown error"}` });
      return;
    }
    await logEvent(data.id, session ?? null, "reported", urgent ? "marked urgent" : undefined);
    setMsg({ ok: true, text: `Thank you. Report sent. Your reference code is ${data.code}.` });
    setPicked(null);
    setPeople(1);
    setNeeds([]);
    setUrgent(false);
    setNote("");
    setContact("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Report someone who needs help</h1>
          <button
            type="button"
            onClick={useMyLocation}
            className="text-sm rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-white"
          >
            📍 Use my location
          </button>
        </div>
        <p className="text-sm text-slate-600">
          Tap the map where you saw them. The location is rounded to about 100m.
        </p>
        <div className="h-[60vh] rounded-xl overflow-hidden border border-slate-200">
          <MapView
            onPick={(lat, lng) => setPicked({ lat, lng })}
            picked={picked}
            pins={mine.map((r) => ({
              id: r.id,
              lat: r.lat,
              lng: r.lng,
              status: r.status,
              label: `#${r.code}: ${r.status}`,
            }))}
            shelters={shelters}
          />
        </div>
      </section>

      <aside className="space-y-4">
        <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="text-sm">
            Location:{" "}
            {picked ? (
              <span className="font-mono">
                {picked.lat}, {picked.lng}
              </span>
            ) : (
              <span className="text-slate-500">not set, tap the map</span>
            )}
          </div>

          <label className="block text-sm">
            <span className="font-medium">How many people?</span>
            <input
              type="number"
              min={1}
              max={20}
              value={people}
              onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>

          <fieldset className="text-sm">
            <legend className="font-medium mb-1">What do they seem to need?</legend>
            <div className="flex flex-wrap gap-2">
              {NEEDS.map((n) => {
                const on = needs.includes(n);
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setNeeds(on ? needs.filter((x) => x !== n) : [...needs, n])}
                    className={`rounded-full px-3 py-1 border ${
                      on ? "bg-slate-900 text-white border-slate-900" : "border-slate-300"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            <span className="font-medium">Seems unwell, injured or unresponsive</span>
          </label>
          {urgent && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              <strong>If someone is in danger, call 911 now.</strong> helpBham is not an
              emergency service.
            </div>
          )}

          <label className="block text-sm">
            <span className="font-medium">Notes</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Landmarks, what they're wearing…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium">Your phone or email (optional)</span>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Only if you're happy to be contacted"
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>

          {msg && (
            <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>
          )}

          <button
            disabled={busy}
            className="w-full rounded-lg bg-red-600 text-white py-2 font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send report"}
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold mb-2">My reports</h2>
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}
          {mine.length === 0 && <p className="text-sm text-slate-500">None yet.</p>}
          <ul className="space-y-2">
            {mine.map((r: Report) => (
              <li key={r.id} className="text-sm flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-slate-500">#{r.code}</div>
                  <div>
                    {r.people_count} {r.people_count === 1 ? "person" : "people"}
                    {r.note ? `: ${r.note}` : ""}
                  </div>
                  <div className="text-xs text-slate-500">{timeAgo(r.created_at)}</div>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
