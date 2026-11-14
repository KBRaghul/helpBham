"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression } from "leaflet";

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

const BHAM_BOUNDS: LatLngBoundsExpression = [
  [33.38, -87.0],
  [33.65, -86.6],
];

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

export default function Map({ pins = SAMPLE }: { pins?: Pin[] }) {
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
    </MapContainer>
  );
}
