import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fuel, Gauge, Route, Wrench, MapPin, BarChart3 } from "lucide-react";
import { InstallAppButton } from "@/components/pwa/install-app-button";

const FEATURES = [
  { icon: Fuel, title: "Automatic Mileage", desc: "Every fill-up calculates km/l instantly from your odometer readings." },
  { icon: Route, title: "Live Trip Tracking", desc: "Start a ride and BlackPearl tracks distance, time, and average speed via GPS." },
  { icon: Wrench, title: "Maintenance Log", desc: "Services, tyres, insurance, fines — every expense in one ledger." },
  { icon: BarChart3, title: "Rich Analytics", desc: "Cost per km, monthly trends, and fuel-efficiency scoring at a glance." },
  { icon: MapPin, title: "Location Aware", desc: "Fuel stations and routes are geo-tagged automatically as you ride." },
  { icon: Gauge, title: "Fuel Remaining", desc: "A running estimate of what's left in the tank, based on your habits." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="pearl-text font-display text-lg font-semibold">BlackPearl</span>
        <div className="flex items-center gap-2">
          <InstallAppButton variant="glass" />
          <Link href="/login">
            <Button variant="glass" size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <span className="glass mb-6 rounded-full px-4 py-1.5 text-xs text-text-secondary">
            TVS Apache RTR 160 4V · Black
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-6xl">
            Every kilometer of <span className="pearl-text">BlackPearl</span>, accounted for.
          </h1>
          <p className="mt-6 max-w-xl text-balance text-text-muted">
            Fuel economy, expenses, trips, and maintenance — tracked automatically,
            visualized beautifully.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/login">
              <Button variant="pearl" size="lg">Get Started</Button>
            </Link>
          </div>

          <div className="mt-16 grid w-full grid-cols-3 gap-4">
            {[
              { label: "Avg. Mileage", value: "40 km/l" },
              { label: "Tank Capacity", value: "12 L" },
              { label: "Tracked Since", value: "Day One" },
            ].map((s) => (
              <Card key={s.label} className="text-center">
                <p className="font-display text-2xl font-semibold text-text-primary">{s.value}</p>
                <p className="mt-1 text-xs text-text-muted">{s.label}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center font-display text-2xl font-semibold text-text-primary">
            Built for riders who track everything
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <Card key={title}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-pearl-2">
                  <Icon size={18} />
                </div>
                <h3 className="mb-1 font-medium text-text-primary">{title}</h3>
                <p className="text-sm text-text-muted">{desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <Card className="gradient-border">
            <p className="text-text-secondary italic">
              &ldquo;Built by one rider, for one bike — with room to grow.&rdquo;
            </p>
            <p className="mt-3 text-sm text-text-muted">— BlackPearl, v1.0</p>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border-glass px-4 py-8 text-center text-xs text-text-muted sm:px-6">
        BlackPearl · Fuel &amp; Maintenance Tracker · Built with Next.js
      </footer>
    </div>
  );
}
