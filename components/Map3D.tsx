"use client";

import { useState } from "react";
import MapGL, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Pin } from "./Map";
import { setWorkerUrl } from "maplibre-gl";

setWorkerUrl("/maplibre-gl-csp-worker.js");

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

const BHAM_BOUNDS: [number, number, number, number] = [
  -87.0, 33.38, -86.6, 33.65,
];

function roundCoord(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function Dot({ color, size }: { color: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        opacity: 0.8,
        border: "2px solid white",
        cursor: "pointer",
      }}
    />
  );
}

export default function Map3D({
  pins = SAMPLE,
  onPick,
  picked,
}: {
  pins?: Pin[];
  onPick?: (lat: number, lng: number) => void;
  picked?: { lat: number; lng: number } | null;
}) {
  const [selected, setSelected] = useState<Pin | null>(null);

  function handleClick(e: MapLayerMouseEvent) {
    if (onPick) onPick(roundCoord(e.lngLat.lat), roundCoord(e.lngLat.lng));
  }

  return (
    <MapGL
      initialViewState={{
        longitude: -86.8104,
        latitude: 33.5186,
        zoom: 15,
        pitch: 60,
        bearing: -20,
      }}
      minZoom={11}
      maxBounds={BHAM_BOUNDS}
      mapStyle="https://tiles.openfreemap.org/styles/bright"
      onClick={handleClick}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl visualizePitch position="top-right" />

      {pins.map((p) => (
        <Marker
          key={p.id}
          longitude={p.lng}
          latitude={p.lat}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelected(p);
          }}
        >
          <Dot color={COLORS[p.status]} size={20} />
        </Marker>
      ))}

      {picked && (
        <Marker longitude={picked.lng} latitude={picked.lat}>
          <Dot color="#2563eb" size={24} />
        </Marker>
      )}

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="bottom"
          offset={14}
          closeOnClick={false}
          onClose={() => setSelected(null)}
        >
          <div style={{ color: "#111" }}>
            {selected.status}
            {selected.note ? `: ${selected.note}` : ""}
            <br />
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Open street view
            </a>
          </div>
        </Popup>
      )}
    </MapGL>
  );
}
