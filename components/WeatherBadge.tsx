"use client";

import { useEffect, useState } from "react";
import { getBirminghamWeather, type Weather } from "@/lib/weather";

export default function WeatherBadge() {
  const [w, setW] = useState<Weather | null>(null);

  useEffect(() => {
    getBirminghamWeather().then(setW);
  }, []);

  if (!w) return <span className="text-zinc-500">Birmingham · –°F</span>;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${w.isCold ? "bg-sky-500" : "bg-zinc-300"}`}
        aria-hidden="true"
      />
      Birmingham · <span className="tabular-nums">{w.tempF}°F</span>
      {w.isCold && <span className="text-sky-700">· Cold Night</span>}
      {w.source === "fallback" && <span className="text-zinc-500">(Demo)</span>}
    </span>
  );
}
