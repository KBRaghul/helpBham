"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import ReportCard from "@/components/ReportCard";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  MapFrame,
  Notice,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { useSession } from "@/lib/auth";
import { logEvent, useLock, useReports, useShelters } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { NEEDS } from "@/lib/types";

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
  const { busy, run } = useLock();
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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) {
      setMsg({ ok: false, text: "Tap the map to mark where the person is." });
      return;
    }
    return run(() => send(picked));
  }

  async function send(picked: { lat: number; lng: number }) {
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
    if (error || !data) {
      setMsg({ ok: false, text: `Couldn't send report: ${error?.message ?? "unknown error"}` });
      return;
    }
    await logEvent(data.id, session ?? null, "reported", urgent ? "marked urgent" : undefined);
    setMsg({ ok: true, text: `Report sent. Your reference code is ${data.code}.` });
    setPicked(null);
    setPeople(1);
    setNeeds([]);
    setUrgent(false);
    setNote("");
    setContact("");
  }

  return (
    <>
      <PageHeader
        title="Reporter"
        description="Tap the map where you saw someone who needs help. Locations are rounded to about 100 m."
        actions={
          <Button variant="secondary" onClick={useMyLocation}>
            Use My Location
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <MapFrame>
          <MapView
            onPick={(lat, lng) => setPicked({ lat, lng })}
            picked={picked}
            pins={mine.map((r) => ({
              id: r.id,
              lat: r.lat,
              lng: r.lng,
              status: r.status,
              label: `#${r.code}`,
            }))}
            shelters={shelters}
          />
        </MapFrame>

        <div className="space-y-6">
          <Card title="New Report">
            <form onSubmit={submit} className="space-y-5">
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                <span className="text-zinc-500">Location</span>
                {picked ? (
                  <span className="font-mono text-zinc-900">
                    {picked.lat}, {picked.lng}
                  </span>
                ) : (
                  <span className="text-zinc-500">Tap the map</span>
                )}
              </div>

              <Field label="Number of People">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={people}
                  onChange={(e) => setPeople(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-24"
                />
              </Field>

              <fieldset>
                <legend className="text-sm font-medium text-zinc-900">Needs</legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {NEEDS.map((n) => {
                    const on = needs.includes(n);
                    return (
                      <Chip
                        key={n}
                        active={on}
                        onClick={() => setNeeds(on ? needs.filter((x) => x !== n) : [...needs, n])}
                        className="capitalize"
                      >
                        {n}
                      </Chip>
                    );
                  })}
                </div>
              </fieldset>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-zinc-900"
                />
                <span>
                  <span className="font-medium text-zinc-900">Urgent</span>
                  <span className="block text-zinc-500">Seems unwell, injured or unresponsive.</span>
                </span>
              </label>
              {urgent && (
                <Notice tone="danger">
                  <strong>If someone is in danger, call 911 now.</strong> helpBham is not an
                  emergency service.
                </Notice>
              )}

              <Field label="Notes" hint="Optional">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Landmarks, what they're wearing…"
                />
              </Field>

              <Field label="Your Contact" hint="Optional">
                <Input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Phone or email"
                />
              </Field>

              {msg && <Notice tone={msg.ok ? "success" : "danger"}>{msg.text}</Notice>}

              <Button type="submit" block disabled={busy}>
                {busy ? "Sending…" : "Send Report"}
              </Button>
            </form>
          </Card>

          <Card title="My Reports">
            {loadError && <Notice tone="danger">{loadError}</Notice>}
            {mine.length === 0 ? (
              <EmptyState>You haven&apos;t sent any reports yet.</EmptyState>
            ) : (
              <div className="space-y-3">
                {mine.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
