"use client";

import { useEffect, useState } from "react";
import { getBirminghamWeather, type Weather } from "@/lib/weather";

export default function WeatherBadge() {
  const [w, setW] = useState<Weather | null>(null);

  useEffect(() => {
    getBirminghamWeather().then(setW);
  }, []);

  if (!w) return <span>Loading weather...</span>;

  return (
    <span>
      Birmingham: {w.tempF}°F
      {w.isCold ? " (cold night)" : ""}
      {w.source === "fallback" ? " (demo data)" : ""}
    </span>
  );
}
