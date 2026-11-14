"use client";

import { useState } from "react";
import MapView from "@/components/MapView";

export default function Home() {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  return (
    <main style={{ height: "100vh", position: "relative" }}>
      <MapView onPick={(lat, lng) => setPicked({ lat, lng })} picked={picked} />
      {picked && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 1000,
            background: "white",
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
