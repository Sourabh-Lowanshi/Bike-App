"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Play, Square, Loader2, Route as RouteIcon, Sun, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useBikes } from "@/hooks/use-bikes";

interface TripDoc {
  _id: string;
  status: "active" | "completed";
  date: string;
  distance?: number;
  duration?: number;
  averageSpeed?: number;
  startLocation: { lat: number; lng: number; name?: string };
  endLocation?: { lat: number; lng: number; name?: string };
}

function haversineKm(a: GeolocationCoordinates, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.latitude) * Math.PI) / 180;
  const dLng = ((b.lng - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

async function fetchTrips(bikeId: string | null): Promise<{ trips: TripDoc[] }> {
  const res = await fetch(bikeId ? `/api/trips?bikeId=${bikeId}` : "/api/trips");
  if (!res.ok) throw new Error("Failed to load trips");
  return res.json();
}

export function TripTracker() {
  const queryClient = useQueryClient();
  const { activeBikeId } = useBikes();
  const { data } = useQuery({
    queryKey: ["trips", activeBikeId],
    queryFn: () => fetchTrips(activeBikeId),
    enabled: !!activeBikeId,
  });

  const [tracking, setTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const watchId = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const lastPos = useRef<GeolocationCoordinates | null>(null);
  const startCoords = useRef<{ lat: number; lng: number } | null>(null);
  const path = useRef<{ lat: number; lng: number }[]>([]);
  const activeTripId = useRef<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);

  const activeTrip = data?.trips.find((t) => t.status === "active");
  const recentTrips = data?.trips.filter((t) => t.status === "completed").slice(0, 10) ?? [];

  useEffect(() => {
    if (activeTrip) activeTripId.current = activeTrip._id;
  }, [activeTrip]);

  useEffect(() => {
    if (!tracking) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [tracking]);

  // The Wake Lock API keeps the screen ON (preventing the auto-sleep timeout
  // that suspends GPS callbacks) — but it does NOT stop someone manually
  // pressing the power button, and browsers always release the lock when the
  // tab/app is backgrounded. We re-acquire it whenever the page becomes
  // visible again mid-ride, since that's the one case we *can* recover from
  // automatically.
  const requestWakeLock = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (!nav.wakeLock) {
      setWakeLockActive(false);
      return;
    }
    try {
      wakeLockRef.current = await nav.wakeLock.request("screen");
      setWakeLockActive(true);
      wakeLockRef.current.addEventListener("release", () => setWakeLockActive(false));
    } catch {
      setWakeLockActive(false);
    }
  };

  useEffect(() => {
    if (!tracking) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking]);

  const startMutation = useMutation({
    mutationFn: async (loc: { lat: number; lng: number }) => {
      if (!activeBikeId) throw new Error("Select a bike in the Garage first");
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...loc, bikeId: activeBikeId }),
      });
      if (!res.ok) throw new Error("Failed to start trip");
      return res.json();
    },
    onSuccess: ({ trip }) => {
      activeTripId.current = trip._id;
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const endMutation = useMutation({
    mutationFn: async (payload: {
      lat: number;
      lng: number;
      distance: number;
      duration: number;
      routePolyline: string;
    }) => {
      const res = await fetch(`/api/trips/${activeTripId.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to end trip");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Ride saved");
    },
  });

  const startRide = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        path.current = [{ lat: pos.coords.latitude, lng: pos.coords.longitude }];
        lastPos.current = pos.coords;
        startCoords.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        startTime.current = Date.now();
        setDistance(0);
        setElapsed(0);
        setTracking(true);
        startMutation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        requestWakeLock();
        if (!("wakeLock" in navigator)) {
          toast.info("Your browser can't keep the screen on — leave BlackPearl open and unlocked for accurate tracking.");
        }

        watchId.current = navigator.geolocation.watchPosition(
          (p) => {
            if (lastPos.current) {
              const d = haversineKm(lastPos.current, {
                lat: p.coords.latitude,
                lng: p.coords.longitude,
              });
              // Ignore GPS noise below ~5m.
              if (d > 0.005) {
                setDistance((prev) => prev + d);
                path.current.push({ lat: p.coords.latitude, lng: p.coords.longitude });
              }
            }
            lastPos.current = p.coords;
          },
          () => toast.error("Location tracking interrupted"),
          { enableHighAccuracy: true }
        );
      },
      () => toast.error("Couldn't get your location — check permissions")
    );
  };

  const endRide = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    setWakeLockActive(false);
    setTracking(false);

    let last: { lat: number; lng: number };
    if (path.current.length > 0) {
      last = path.current[path.current.length - 1];
    } else if (lastPos.current) {
      last = { lat: lastPos.current.latitude, lng: lastPos.current.longitude };
    } else {
      last = startCoords.current ?? { lat: 0, lng: 0 };
    }

    // Safety net: if the screen got locked/backgrounded and watchPosition
    // barely fired, `distance` will be ~0 even though real ground was
    // covered. Fall back to a straight-line estimate between the actual
    // start and end GPS fixes so a ride never reports 0.0 km outright.
    let finalDistance = distance;
    let usedFallback = false;
    if (distance < 0.05 && startCoords.current && elapsed > 30) {
      const straightLine = haversineKm(
        { latitude: startCoords.current.lat, longitude: startCoords.current.lng } as GeolocationCoordinates,
        last
      );
      if (straightLine > distance) {
        finalDistance = straightLine;
        usedFallback = true;
      }
    }

    if (usedFallback) {
      toast.warning(
        "GPS tracking paused while your screen was locked — distance is a straight-line estimate between start and end, not your actual route."
      );
    }

    endMutation.mutate({
      lat: last.lat,
      lng: last.lng,
      distance: Number(finalDistance.toFixed(2)),
      duration: elapsed,
      routePolyline: JSON.stringify(path.current),
    });
  };

  return (
    <div className="space-y-6">
      <Card className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
          <RouteIcon size={22} className="text-pearl-2" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <CardTitle>Distance</CardTitle>
            <CardValue>{distance.toFixed(2)} km</CardValue>
          </div>
          <div>
            <CardTitle>Time</CardTitle>
            <CardValue>
              {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
            </CardValue>
          </div>
        </div>
        {tracking && (
          <p className="mb-3 flex items-center justify-center gap-1.5 text-xs text-text-muted">
            {wakeLockActive ? (
              <>
                <Sun size={12} className="text-success" /> Screen will stay awake for this ride
              </>
            ) : (
              <>
                <SunMedium size={12} className="text-amber-400" /> Keep BlackPearl open and your screen
                unlocked — GPS pauses in the background on most phones
              </>
            )}
          </p>
        )}
        {!tracking ? (
          <Button variant="pearl" size="lg" onClick={startRide} disabled={startMutation.isPending}>
            {startMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            Start Ride
          </Button>
        ) : (
          <Button variant="danger" size="lg" onClick={endRide} disabled={endMutation.isPending}>
            {endMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Square size={16} />}
            End Ride
          </Button>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <div className="divide-y divide-white/5">
          {recentTrips.length === 0 && <p className="py-4 text-sm text-text-muted">No completed trips yet.</p>}
          {recentTrips.map((t) => (
            <div key={t._id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="text-text-primary">{formatDate(t.date)}</p>
                <p className="text-xs text-text-muted">{t.averageSpeed ?? 0} km/h avg</p>
              </div>
              <p className="font-medium text-text-primary">{(t.distance ?? 0).toFixed(1)} km</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
