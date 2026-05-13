"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapJobPin } from "./today-jobs-map";

type Geocoded = MapJobPin & { lat: number; lng: number };

function FitBounds({ markers }: { markers: Geocoded[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.2));
  }, [map, markers]);
  return null;
}

async function geocodeAddress(addressLine: string): Promise<{ lat: number; lng: number } | null> {
  const q = addressLine.trim();
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=au`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-AU",
      "User-Agent": "ServloDashboard/1.0 (+https://servlo.app)"
    }
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  const hit = data[0];
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export default function TodayJobsMapInner({ jobs }: { jobs: MapJobPin[] }) {
  const [markers, setMarkers] = useState<Geocoded[]>([]);
  const [busy, setBusy] = useState(false);

  const uniqueJobs = useMemo(() => {
    const seen = new Set<string>();
    const out: MapJobPin[] = [];
    for (const j of jobs) {
      if (!j.addressLine || seen.has(j.id)) continue;
      seen.add(j.id);
      out.push(j);
    }
    return out;
  }, [jobs]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      const next: Geocoded[] = [];
      for (const job of uniqueJobs) {
        if (cancelled) break;
        const coords = await geocodeAddress(job.addressLine);
        if (coords) next.push({ ...job, ...coords });
        await new Promise((r) => setTimeout(r, 320));
      }
      if (!cancelled) setMarkers(next);
      if (!cancelled) setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [uniqueJobs]);

  const centre = markers[0] ?? { lat: -33.8688, lng: 151.2093 };

  if (uniqueJobs.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">
        No addresses on today&apos;s jobs to map yet.
      </div>
    );
  }

  return (
    <div className="relative isolate overflow-hidden rounded-lg border border-[var(--border)]">
      {busy && markers.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-xs text-[var(--text-muted)] md:h-[360px]">
          Looking up addresses (OpenStreetMap)…
        </div>
      ) : null}
      <MapContainer center={[centre.lat, centre.lng]} zoom={11} className="h-[280px] w-full md:h-[360px]" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <CircleMarker key={m.id} center={[m.lat, m.lng]} radius={9} pathOptions={{ color: "#0ea5e9", fillColor: "#38bdf8", fillOpacity: 0.85 }}>
            <Tooltip direction="top" opacity={0.95}>
              {m.title ?? "Job"}
            </Tooltip>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{m.title ?? "Job"}</p>
                <p className="text-xs text-slate-600">{m.addressLine}</p>
                <a
                  href={`/dashboard/owner/jobs?openJob=${encodeURIComponent(m.id)}`}
                  className="mt-2 inline-block text-xs font-semibold text-sky-700 underline"
                >
                  Open job
                </a>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        <FitBounds markers={markers} />
      </MapContainer>
      <p className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-[10px] text-[var(--text-muted)]">
        Map data © OpenStreetMap contributors · Address lookup via Nominatim (please use respectfully).
      </p>
    </div>
  );
}
