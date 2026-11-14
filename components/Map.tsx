"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_COLORS, type ReportStatus } from "@/lib/types";

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  label?: string;
};

export type ShelterPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  beds_available: number;
  open_tonight: boolean;
};

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
  pins = [],
  shelters = [],
  onPick,
  picked,
  onSelect,
  selectedId,
}: {
  pins?: Pin[];
  shelters?: ShelterPin[];
  onPick?: (lat: number, lng: number) => void;
  picked?: { lat: number; lng: number } | null;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

      />
      {onPick && <ClickToDrop onPick={onPick} />}

      {shelters.filter((s) => s.lat != null && s.lng != null).map((s) => {
        const color = !s.open_tonight
          ? "#6b7280"
          : s.beds_available > 0
            ? "#2563eb"
            : "#1e3a8a";
        return (
          <CircleMarker
            key={`s-${s.id}`}
            center={[s.lat, s.lng]}
            radius={8}
            pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 }}
          >
            <Tooltip>
              <strong>{s.name}</strong>
              <br />
              {s.open_tonight ? `${s.beds_available} Beds Free` : "Closed Tonight"}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {pins.map((p) => {
        const selected = p.id === selectedId;
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={selected ? 14 : 10}
            pathOptions={{
              color: selected ? "#111" : STATUS_COLORS[p.status],
              weight: selected ? 3 : 2,
              fillColor: STATUS_COLORS[p.status],
              fillOpacity: 0.75,
            }}
            eventHandlers={
              onSelect
                ? {
                    click: (e) => {
                      e.originalEvent.stopPropagation();
                      onSelect(p.id);
                    },
                  }
                : undefined
            }
          >
            {p.label && !onSelect && <Popup>{p.label}</Popup>}
            {p.label && onSelect && <Tooltip>{p.label}</Tooltip>}
          </CircleMarker>
        );
      })}

      {picked && (
        <CircleMarker
          center={[picked.lat, picked.lng]}
          radius={12}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.5,
            dashArray: "4",
          }}
        />
      )}
    </MapContainer>
  );
}
