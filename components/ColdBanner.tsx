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
  const active = mode === "on" || (mode === "auto" && !!w?.isCold);
  return { active, mode, weather: w };
}

export default function ColdBanner() {
  const { active, weather } = useIsColdNight();
  if (!active) return null;
  return (
    <div className="bg-sky-700 text-white text-sm px-4 py-2 text-center">
      ❄️ Cold-night alert{weather ? `: ${weather.tempF}°F in Birmingham` : ""}. Reports
      are prioritised. If someone is unresponsive or in danger, call 911.
    </div>
  );
}
