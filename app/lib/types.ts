export type ClockEntry = {
  id: string;
  city: string;
  country?: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  bgColor?: string;
  textColor?: string;
  metaColor?: string;
  isLocal?: boolean;
  scale?: number;
};

export type ClockParts = {
  time: string;
  date: string;
  offset: string;
};

export type LocationResult = {
  id: string;
  label: string;
  cardLabel: string;
  country?: string;
  detail: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
};

export type SelectedMapLocation = {
  latitude: number;
  longitude: number;
  timezone?: string;
  serverUnixTime?: number;
  resolvedAt?: number;
  isLoading: boolean;
  error?: string;
};

export type DefaultMapLocation = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type MapLocationResult = DefaultMapLocation & { id: number };

export type Theme = "dark" | "light";
export type UiStyle = "terminal" | "classic" | "coke";
export type DashboardBackgroundMode = "theme" | "color" | "gradient" | "image";
export type AddCardPlacement = "inline" | "next-row";
export type Language = "en" | "it" | "es";
