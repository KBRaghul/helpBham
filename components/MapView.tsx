"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default MapView;
