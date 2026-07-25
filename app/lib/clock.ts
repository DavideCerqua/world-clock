import { DEFAULT_LOCATIONS } from "./constants";
import type { ClockEntry, ClockParts } from "./types";

const formatterCache = new Map<string, {
  time: Intl.DateTimeFormat;
  date: Intl.DateTimeFormat;
  offset: Intl.DateTimeFormat;
}>();

export function timezoneLabel(timezone: string) {
  return timezone.split("/").at(-1)?.replaceAll("_", " ") ?? timezone;
}

export function makeClock(timezone: string, id?: string, city?: string, country?: string): ClockEntry {
  return {
    id: id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    city: city ?? timezoneLabel(timezone),
    country,
    timezone,
  };
}

export function getSupportedTimezones() {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
  return intl.supportedValuesOf?.("timeZone") ?? DEFAULT_LOCATIONS.map(({ timezone }) => timezone);
}

export function formatClock(date: Date, timezone: string, locale = "en"): ClockParts {
  const cacheKey = `${locale}:${timezone}`;
  let formatters = formatterCache.get(cacheKey);
  if (!formatters) {
    formatters = {
      time: new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      date: new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      offset: new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        timeZoneName: "longOffset",
      }),
    };
    formatterCache.set(cacheKey, formatters);
  }

  const offset = formatters.offset
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  return {
    time: formatters.time.format(date),
    date: formatters.date.format(date),
    offset: offset ?? timezone,
  };
}

export const defaultClocks = DEFAULT_LOCATIONS.map(({ timezone, city, country }) =>
  makeClock(timezone, `default-${timezone}`, city, country),
);
