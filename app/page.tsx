"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import WeatherBadge from "@/components/WeatherBadge";

export default function Home() {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  return (
    <main style={{ height: "calc(100vh - 56px)", position: "relative" }}>
      <MapView onPick={(lat, lng) => setPicked({ lat, lng })} picked={picked} />
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          background: "white",
          color: "#111",
          padding: "6px 10px",
          borderRadius: 8,
        }}
      >
        <WeatherBadge />
      </div>
      {picked && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 1000,
            background: "white",
            color: "#111",
            padding: "8px 12px",
            borderRadius: 8,
          }}
        >
          Picked: {picked.lat}, {picked.lng}
        </div>
      )}
    </main>
  );
}