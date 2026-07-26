import type { DefaultMapLocation, Language } from "./types";

export const CLOCKS_STORAGE_KEY = "wc-clocks";
export const SETTINGS_STORAGE_KEY = "wc-settings";
export const DEFAULT_FONT = "Inter";
export const DEFAULT_COLUMNS = 4;
export const DEFAULT_MAP_ZOOM = 3;
export const DEFAULT_LANGUAGE: Language = "en";
export const DEFAULT_MAP_COLORS = {
  cityPin: "#39a9ff",
  cardHighlight: "#39a9ff",
  locationPin: "#58ff9f",
} as const;

export const LANGUAGES: ReadonlyArray<{ value: Language; label: string }> = [
  { value: "en", label: "English" },
  { value: "it", label: "Italiano" },
  { value: "es", label: "Español" },
];

export const DEFAULT_MAP_LOCATION: DefaultMapLocation = {
  city: "Rome",
  country: "Italy",
  latitude: 41.9028,
  longitude: 12.4964,
};

export const POPULAR_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans 3",
  "Nunito",
  "Playfair Display",
  "Roboto Mono",
] as const;

export const LOCAL_COLORS = {
  background: "#042b15",
  text: "#bfffd6",
  meta: "#9ee0a7",
} as const;

export const DEFAULT_LOCATIONS = [
  { city: "Rome", country: "Italy", timezone: "Europe/Rome", latitude: 41.9028, longitude: 12.4964 },
  { city: "Cairo", country: "Egypt", timezone: "Africa/Cairo", latitude: 30.0444, longitude: 31.2357 },
  { city: "Sofia", country: "Bulgaria", timezone: "Europe/Sofia", latitude: 42.6977, longitude: 23.3219 },
  { city: "Dublin", country: "Ireland", timezone: "Europe/Dublin", latitude: 53.3498, longitude: -6.2603 },
] as const;
