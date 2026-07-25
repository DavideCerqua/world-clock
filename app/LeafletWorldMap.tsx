"use client";

import { useEffect, useRef } from "react";
import type { CircleMarker, Map as LeafletMap, Polyline } from "leaflet";
import { translate } from "./lib/i18n";
import type { Language } from "./lib/types";

type Coordinates = { latitude: number; longitude: number };

type Props = {
  now: Date | null;
  selectedLocation: Coordinates | null;
  defaultLocation: Coordinates;
  defaultZoom: number;
  language: Language;
  onSelect: (coordinates: Coordinates) => void;
  onReady?: () => void;
};

function getTerminatorPoints(date: Date): [number, number][] {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86_400_000);
  const declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const subsolarLongitude = ((180 - utcHours * 15 + 540) % 360) - 180;
  const declinationRadians = declination * Math.PI / 180;

  return Array.from({ length: 361 }, (_, index) => {
    const longitude = index - 180;
    const hourAngle = (longitude - subsolarLongitude) * Math.PI / 180;
    const latitude = Math.atan(-Math.cos(hourAngle) / Math.tan(declinationRadians || 0.000001)) * 180 / Math.PI;
    return [latitude, longitude];
  });
}

export default function LeafletWorldMap({
  now,
  selectedLocation,
  defaultLocation,
  defaultZoom,
  language,
  onSelect,
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const terminatorRef = useRef<Polyline | null>(null);
  const onSelectRef = useRef(onSelect);
  const onReadyRef = useRef(onReady);
  const defaultLocationRef = useRef(defaultLocation);
  const defaultZoomRef = useRef(defaultZoom);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    defaultLocationRef.current = defaultLocation;
    defaultZoomRef.current = defaultZoom;
    mapRef.current?.setView([defaultLocation.latitude, defaultLocation.longitude], defaultZoom);
  }, [defaultLocation, defaultZoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.lang = language;
    container.setAttribute("aria-label", translate(language, "interactiveMap"));
    const zoomIn = container.querySelector<HTMLAnchorElement>(".leaflet-control-zoom-in");
    const zoomOut = container.querySelector<HTMLAnchorElement>(".leaflet-control-zoom-out");
    if (zoomIn) zoomIn.title = language === "it" ? "Ingrandisci" : language === "es" ? "Acercar" : "Zoom in";
    if (zoomOut) zoomOut.title = language === "it" ? "Riduci" : language === "es" ? "Alejar" : "Zoom out";
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      const initialLocation = defaultLocationRef.current;
      const map = L.map(containerRef.current, {
        center: [initialLocation.latitude, initialLocation.longitude],
        zoom: defaultZoomRef.current,
        minZoom: 2,
        maxZoom: 19,
        worldCopyJump: true,
        zoomControl: true,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on("click", (event) => {
        onSelectRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng });
      });
      mapRef.current = map;
      onReadyRef.current?.();
    }

    void initialize();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function updateMarker() {
      const map = mapRef.current;
      if (!map) return;
      const L = await import("leaflet");
      if (cancelled) return;
      markerRef.current?.remove();
      markerRef.current = selectedLocation
        ? L.circleMarker([selectedLocation.latitude, selectedLocation.longitude], {
            radius: 5,
            color: "#050807",
            weight: 2,
            fillColor: "#58ff9f",
            fillOpacity: 1,
          }).addTo(map)
        : null;
    }
    void updateMarker();
    return () => { cancelled = true; };
  }, [selectedLocation]);

  useEffect(() => {
    let cancelled = false;
    async function updateTerminator() {
      const map = mapRef.current;
      if (!map || !now) return;
      const L = await import("leaflet");
      if (cancelled) return;
      terminatorRef.current?.remove();
      terminatorRef.current = L.polyline(getTerminatorPoints(now), {
        color: "#ff9f43",
        weight: 2,
        opacity: .9,
        interactive: false,
      }).addTo(map);
    }
    void updateTerminator();
    return () => { cancelled = true; };
  }, [now]);

  return (
    <div
      ref={containerRef}
      className="leaflet-map"
      lang={language}
      aria-label={translate(language, "interactiveMap")}
    />
  );
}
