"use client";

import { useEffect, useRef } from "react";
import { translate } from "../lib/i18n";
import { resolveCurrentLocationName, resolveLocationTime } from "../lib/services";
import type { Language } from "../lib/types";

export type LiveLocationResult = {
  city: string;
  country?: string;
  coordinateLabel: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type Options = {
  enabled: boolean;
  isReady: boolean;
  language: Language;
  onResolved: (location: LiveLocationResult) => void;
  onStatus: (message: string) => void;
};

export function useLiveGeolocation({
  enabled,
  isReady,
  language,
  onResolved,
  onStatus,
}: Options) {
  const hasRequestedRef = useRef(false);
  const onResolvedRef = useRef(onResolved);
  const onStatusRef = useRef(onStatus);
  onResolvedRef.current = onResolved;
  onStatusRef.current = onStatus;

  useEffect(() => {
    if (!enabled) {
      hasRequestedRef.current = false;
      return;
    }
    if (!isReady || hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    if (!navigator.geolocation) {
      onStatusRef.current(translate(language, "geolocationUnavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const coordinateLabel = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;

        void Promise.all([
          resolveLocationTime(latitude, longitude),
          resolveCurrentLocationName(latitude, longitude, language).catch(() => null),
        ])
          .then(([time, place]) => {
            onResolvedRef.current({
              city: place?.city ?? translate(language, "currentLocation"),
              country: place?.country,
              coordinateLabel,
              latitude,
              longitude,
              timezone: time.timezone,
            });
            onStatusRef.current(translate(language, "currentLocationAdded"));
          })
          .catch(() => {
            onStatusRef.current(translate(language, "currentLocationResolveError"));
          });
      },
      (error) => {
        onStatusRef.current(translate(
          language,
          error.code === error.PERMISSION_DENIED ? "geolocationDenied" : "geolocationUnavailable",
        ));
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 0,
      },
    );
  }, [enabled, isReady, language]);
}
