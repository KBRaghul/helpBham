import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";
import WeatherBadge from "@/components/WeatherBadge";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} · ${SITE.tagline}` },
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    role: "Reporter",
    text: "Anyone who sees someone sleeping rough drops a pin and notes what they need.",
  },
  {
    role: "Helper",
    text: "A volunteer claims the report, checks on the person and brings supplies.",
  },
  {
    role: "Missionary",
    text: "A shelter with a free bed accepts them and updates its capacity live.",
  },
  {
    role: "Admin",
    text: "Coordinators watch the whole city and switch on cold-night mode.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <span className="text-sm text-zinc-500">
          <WeatherBadge />
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-12 px-6 py-10 lg:grid-cols-[1fr_400px] lg:py-16">
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Birmingham, Alabama
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            {SITE.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-base text-zinc-600">{SITE.description}</p>

          <h2 className="mt-12 text-xs font-medium uppercase tracking-wider text-zinc-500">
            How It Works
          </h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.role} className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="text-xs tabular-nums text-zinc-500">0{i + 1}</div>
                <h3 className="mt-1 text-base font-semibold text-zinc-900">{s.role}</h3>
                <p className="mt-1 text-sm text-zinc-600">{s.text}</p>
              </li>
            ))}
          </ol>

          <p className="mt-8 text-sm text-zinc-500">
            If someone is unresponsive or in danger, call <strong className="text-zinc-900">911</strong>.
            helpBham is not an emergency service.
          </p>
        </section>

        <LoginForm />
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-zinc-500">
        © 2026 helpBham · Hackathon demo
      </footer>
    </div>
  );
}
