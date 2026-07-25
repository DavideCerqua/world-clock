type GeocodingPlace = {
  id: number;
  name: string;
  country: string;
  admin1: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function searchPlaces(
  query: string,
  count: number,
  signal: AbortSignal,
  language = "en",
): Promise<GeocodingPlace[]> {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=${encodeURIComponent(language)}&format=json`,
    { signal },
  );
  if (!response.ok) throw new Error("Location search failed");

  const payload: unknown = await response.json();
  const results = isRecord(payload) && Array.isArray(payload.results) ? payload.results : [];
  return results.flatMap((value): GeocodingPlace[] => {
    if (
      !isRecord(value) ||
      typeof value.id !== "number" ||
      typeof value.name !== "string" ||
      typeof value.latitude !== "number" ||
      typeof value.longitude !== "number"
    ) {
      return [];
    }
    return [{
      id: value.id,
      name: value.name,
      country: typeof value.country === "string" ? value.country : "",
      admin1: typeof value.admin1 === "string" ? value.admin1 : "",
      latitude: value.latitude,
      longitude: value.longitude,
      timezone: typeof value.timezone === "string" ? value.timezone : undefined,
    }];
  });
}

export async function resolveLocationTime(latitude: number, longitude: number) {
  let timezone: string | undefined;
  let serverUnixTime: number | undefined;

  try {
    const response = await fetch(
      `https://timeapi.io/api/timezone/coordinate?latitude=${latitude.toFixed(5)}&longitude=${longitude.toFixed(5)}`,
    );
    if (response.ok) {
      const payload: unknown = await response.json();
      if (isRecord(payload)) {
        timezone = typeof payload.timeZone === "string"
          ? payload.timeZone
          : typeof payload.timezone === "string"
            ? payload.timezone
            : undefined;
        const currentUtcTime = typeof payload.currentUtcTime === "string"
          ? Date.parse(payload.currentUtcTime)
          : Number.NaN;
        if (Number.isFinite(currentUtcTime)) serverUnixTime = currentUtcTime / 1000;
      }
    }
  } catch {
    // The fallback below handles primary resolver outages.
  }

  if (!timezone) {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(5)}&longitude=${longitude.toFixed(5)}&timezone=auto&current=temperature_2m&forecast_days=1`,
    );
    if (!response.ok) throw new Error("Timezone lookup failed");
    const payload: unknown = await response.json();
    if (isRecord(payload) && typeof payload.timezone === "string") timezone = payload.timezone;
  }

  if (!timezone) throw new Error("No timezone returned");
  new Intl.DateTimeFormat("en-GB", { timeZone: timezone }).format(new Date());

  const resolvedAt = Date.now();
  return {
    timezone,
    serverUnixTime: serverUnixTime ?? resolvedAt / 1000,
    resolvedAt,
  };
}
