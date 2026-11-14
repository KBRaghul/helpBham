export type Weather = {
  tempF: number;
  isCold: boolean;
  source: "live" | "fallback";
};

export const COLD_THRESHOLD_F = 40;
const FALLBACK_TEMP_F = 28;

const URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=33.5186&longitude=-86.8104" +
  "&current=temperature_2m&temperature_unit=fahrenheit";

export async function getBirminghamWeather(): Promise<Weather> {
  try {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`Weather request failed: ${res.status}`);
    const data = await res.json();
    const t = data?.current?.temperature_2m;
    if (typeof t !== "number") throw new Error("No temperature in response");
    return {
      tempF: Math.round(t),
      isCold: t <= COLD_THRESHOLD_F,
      source: "live",
    };
  } catch {
    return {
      tempF: FALLBACK_TEMP_F,
      isCold: FALLBACK_TEMP_F <= COLD_THRESHOLD_F,
      source: "fallback",
    };
  }
}
