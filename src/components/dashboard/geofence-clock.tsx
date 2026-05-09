"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface GeofenceClockProps {
  jobId?: string;
  jobAddress?: string;
  jobLat?: number;
  jobLng?: number;
}

type ClockState =
  | "checking_location"
  | "at_site"
  | "away"
  | "clocked_in"
  | "clocked_out"
  | "error";

/** Haversine distance in metres between two lat/lng points. */
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Toast({ message, ok }: { message: string; ok: boolean }) {
  return (
    <div
      role="status"
      className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-medium ${
        ok
          ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
          : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
      }`}
    >
      {message}
    </div>
  );
}

export function GeofenceClock({ jobId, jobAddress, jobLat, jobLng }: GeofenceClockProps) {
  const [clockState, setClockState] = useState<ClockState>("checking_location");
  const [distanceMetres, setDistanceMetres] = useState<number | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const [hoursWorked, setHoursWorked] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const clockedInRef = useRef(false);

  const hasJobCoords = typeof jobLat === "number" && typeof jobLng === "number";
  const GEOFENCE_RADIUS = 200;
  const SHOW_DISTANCE_WITHIN = 500;

  const showToast = useCallback((message: string, ok: boolean) => {
    setToast({ message, ok });
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, []);

  const handleClockAction = useCallback(
    async (action: "clock_in" | "clock_out", lat: number, lng: number) => {
      setLoading(true);
      try {
        const res = await fetch("/api/timesheets/geofence-clock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, job_id: jobId, lat, lng }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          total_hours?: number;
        };

        if (!res.ok || !data.success) {
          showToast(data.error ?? "Clock action failed", false);
          return;
        }

        if (action === "clock_in") {
          clockedInRef.current = true;
          setClockState("clocked_in");
          showToast("Clocked in successfully", true);
        } else {
          clockedInRef.current = false;
          setClockState("clocked_out");
          const hrs = data.total_hours ?? null;
          setHoursWorked(hrs);
          showToast(
            hrs !== null ? `Clocked out — ${hrs.toFixed(2)} hrs worked` : "Clocked out successfully",
            true
          );
        }
      } catch {
        showToast("Network error — please try again", false);
      } finally {
        setLoading(false);
      }
    },
    [jobId, showToast]
  );

  // Last known position for manual clock actions
  const lastPosRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  const onManualAction = useCallback(() => {
    const isClockedIn = clockedInRef.current || clockState === "clocked_in";
    void handleClockAction(
      isClockedIn ? "clock_out" : "clock_in",
      lastPosRef.current.lat,
      lastPosRef.current.lng
    );
  }, [clockState, handleClockAction]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setClockState("away");
      return;
    }

    const onPosition = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      lastPosRef.current = { lat: latitude, lng: longitude };

      if (!hasJobCoords) {
        setClockState("away");
        return;
      }

      const dist = haversineMetres(latitude, longitude, jobLat!, jobLng!);
      setDistanceMetres(Math.round(dist));

      if (clockedInRef.current || clockState === "clocked_in" || clockState === "clocked_out") {
        return; // Don't override a clocked-in/out state
      }

      setClockState(dist <= GEOFENCE_RADIUS ? "at_site" : "away");
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setLocationDenied(true);
      }
      setClockState("away");
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 10_000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasJobCoords, jobLat, jobLng]);

  const isClockedIn = clockState === "clocked_in";
  const isClockedOut = clockState === "clocked_out";
  const isAtSite = clockState === "at_site";

  let statusDot: string;
  let statusText: string;

  if (locationDenied) {
    statusDot = "bg-gray-400";
    statusText = "Location access denied";
  } else if (clockState === "checking_location") {
    statusDot = "bg-yellow-400 animate-pulse";
    statusText = "Checking location…";
  } else if (isClockedIn) {
    statusDot = "bg-green-500";
    statusText = "Clocked in";
  } else if (isClockedOut) {
    statusDot = "bg-gray-400";
    statusText = hoursWorked !== null ? `Clocked out — ${hoursWorked.toFixed(2)} hrs` : "Clocked out";
  } else if (isAtSite) {
    statusDot = "bg-green-400 animate-pulse";
    statusText = "You're at the job site";
  } else {
    statusDot = "bg-gray-400";
    statusText = "Away from site";
  }

  let distanceLabel: string | null = null;
  if (!locationDenied && hasJobCoords && distanceMetres !== null && !isClockedIn && !isClockedOut) {
    if (distanceMetres <= SHOW_DISTANCE_WITHIN) {
      distanceLabel = `${distanceMetres} m from job site`;
    } else {
      distanceLabel = "Away from site";
    }
  }

  const buttonLabel = isClockedIn ? "Clock Out" : "Clock In";

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <span aria-hidden>📍</span> Geofenced Clock-In
          </h2>
          {jobAddress && (
            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{jobAddress}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${statusDot}`}
            aria-hidden
          />
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{statusText}</span>
        </div>
      </div>

      {distanceLabel && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">{distanceLabel}</p>
      )}

      {locationDenied && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Location access denied — manual clock-in
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onManualAction}
          disabled={loading || isClockedOut}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50 ${
            isClockedIn
              ? "bg-red-500 hover:bg-red-600 active:bg-red-700"
              : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
          }`}
        >
          {loading ? "…" : buttonLabel}
        </button>
      </div>

      {isAtSite && !isClockedIn && !isClockedOut && (
        <p className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
          You're within {GEOFENCE_RADIUS} m of the job site.
        </p>
      )}

      {toast && <Toast message={toast.message} ok={toast.ok} />}
    </article>
  );
}
