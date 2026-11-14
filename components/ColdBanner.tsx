"use client";

import { useEffect, useState } from "react";
import { getBirminghamWeather, type Weather } from "@/lib/weather";
import { useColdMode } from "@/lib/data";

/** Cold-night alert. Admin can force it on/off; "auto" follows the weather. */
export function useIsColdNight() {
  const { mode } = useColdMode();
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => {
    getBirminghamWeather().then(setW);
  }, []);
  // "Auto" only trusts live weather: if the weather service is down we don't
  // raise a false alarm from the demo fallback temperature.
  const active = mode === "on" || (mode === "auto" && w?.source === "live" && w.isCold);
  return { active, mode, weather: w };
}

export default function ColdBanner() {
  const { active, weather } = useIsColdNight();
  if (!active) return null;
  return (
    <div role="status" className="border-b border-sky-100 bg-sky-50">
      <p className="mx-auto max-w-7xl px-4 py-2 text-sm text-sky-900 sm:px-6">
        <span className="font-medium">Cold-Night Alert</span>
        {weather?.source === "live" ? ` · ${weather.tempF}°F in Birmingham` : ""}. Reports are prioritized. If
        someone is unresponsive, call 911.
      </p>
    </div>
  );
}
