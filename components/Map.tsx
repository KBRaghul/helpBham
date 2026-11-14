"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  status: "reported" | "claimed" | "placed";
  note?: string;
};

const COLORS: Record<Pin["status"], string> = {
  reported: "#dc2626",
  claimed: "#f59e0b",
  placed: "#16a34a",
};

const SAMPLE: Pin[] = [
  {
    id: "1",
    lat: 33.5207,
    lng: -86.8025,
    status: "reported",
    note: "Sample case",
  },
  {
    id: "2",
    lat: 33.5145,
    lng: -86.811,
    status: "claimed",
    note: "Sample case",
  },
];

const BHAM_BOUNDS: LatLngBoundsExpression = [
  [33.38, -87.0],
  [33.65, -86.6],
];

function roundCoord(n: number) {
  return Math.round(n * 1000) / 1000;
}

function ClickToDrop({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(roundCoord(e.latlng.lat), roundCoord(e.latlng.lng));
    },
  });
  return null;
}

export default function Map({
  pins = SAMPLE,
  onPick,
  picked,
}: {
  pins?: Pin[];
  onPick?: (lat: number, lng: number) => void;
  picked?: { lat: number; lng: number } | null;
}) {
  return (
    <MapContainer
      center={[33.5186, -86.8104]}
      zoom={13}
      minZoom={12}
      maxBounds={BHAM_BOUNDS}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {onPick && <ClickToDrop onPick={onPick} />}
      {pins.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={10}
          pathOptions={{
            color: COLORS[p.status],
            fillColor: COLORS[p.status],
            fillOpacity: 0.7,
          }}
        >
          <Popup>
            {p.status}
            {p.note ? `: ${p.note}` : ""}
          </Popup>
        </CircleMarker>
      ))}
      {picked && (
        <CircleMarker
          center={[picked.lat, picked.lng]}
          radius={12}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.5,
          }}
        />
      )}
    </MapContainer>
  );
}
