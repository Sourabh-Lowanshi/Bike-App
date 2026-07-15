"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Fuel, Route, Wrench, LogOut, Bike as BikeIcon, ShieldCheck, LayoutGrid, Wallet } from "lucide-react";
import { useBikes } from "@/hooks/use-bikes";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fuel/new", label: "Add Fuel", icon: Fuel },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/garage", label: "Garage", icon: BikeIcon },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { bikes, activeBikeId, setActiveBikeId } = useBikes();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border-glass bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="pearl-text font-display text-lg font-semibold">BlackPearl</span>
        </Link>

        {bikes.length > 0 && (
          <select
            value={activeBikeId ?? ""}
            onChange={(e) => setActiveBikeId(e.target.value)}
            className="glass hidden max-w-[160px] shrink-0 truncate rounded-full px-3 py-1.5 text-xs text-text-secondary outline-none md:block"
          >
            {bikes.map((b) => (
              <option key={b._id} value={b._id} className="bg-bg">
                {b.bikeName}
              </option>
            ))}
          </select>
        )}

        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary",
                pathname?.startsWith(href) && "glass text-text-primary"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary",
                pathname?.startsWith("/admin") && "glass text-text-primary"
              )}
            >
              <LayoutGrid size={15} />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt={session.user.name ?? "User"} className="h-8 w-8 rounded-full" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/10" />
          )}
          <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign out">
            <LogOut size={16} />
          </Button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border-glass px-4 py-2 lg:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-text-secondary",
              pathname?.startsWith(href) && "glass text-text-primary"
            )}
          >
            <Icon size={13} />
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-text-secondary",
              pathname?.startsWith("/admin") && "glass text-text-primary"
            )}
          >
            <LayoutGrid size={13} />
            Admin
          </Link>
        )}
      </nav>
    </header>
  );
}
