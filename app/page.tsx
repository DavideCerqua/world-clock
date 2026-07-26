"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import LeafletWorldMap from "./LeafletWorldMap";
import { useNow } from "./hooks/useNow";
import { defaultClocks, formatClock, getSupportedTimezones, makeClock, timezoneLabel } from "./lib/clock";
import {
  CLOCKS_STORAGE_KEY,
  DEFAULT_COLUMNS,
  DEFAULT_FONT,
  DEFAULT_LANGUAGE,
  DEFAULT_LOCATIONS,
  DEFAULT_MAP_COLORS,
  DEFAULT_MAP_LOCATION,
  DEFAULT_MAP_ZOOM,
  LOCAL_COLORS,
  LANGUAGES,
  POPULAR_FONTS,
  SETTINGS_STORAGE_KEY,
} from "./lib/constants";
import type {
  AddCardPlacement,
  ClockEntry,
  ClockParts,
  DefaultMapLocation,
  LocationResult,
  Language,
  MapLocationResult,
  SelectedMapLocation,
  Theme,
  UiStyle,
} from "./lib/types";
import { translate } from "./lib/i18n";
import { resolveLocationTime, searchPlaces } from "./lib/services";

export default function HomePage() {
  const [clocks, setClocks] = useState<ClockEntry[]>(defaultClocks);
  const now = useNow();
  const [isRestored, setIsRestored] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [isLocationSearchLoading, setIsLocationSearchLoading] = useState(false);
  const [locationSearchFailed, setLocationSearchFailed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userTimeZone, setUserTimeZone] = useState<string | null>(null);
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dashboardContextMenu, setDashboardContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMapSettingsOpen, setIsMapSettingsOpen] = useState(false);
  const [mapLocationQuery, setMapLocationQuery] = useState("");
  const [mapLocationResults, setMapLocationResults] = useState<MapLocationResult[]>([]);
  const [isMapLocationLoading, setIsMapLocationLoading] = useState(false);
  const [fontFamily, setFontFamily] = useState(DEFAULT_FONT);
  const [fontInput, setFontInput] = useState(DEFAULT_FONT);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(DEFAULT_COLUMNS);
  const [addCardPlacement, setAddCardPlacement] = useState<AddCardPlacement>("inline");
  const [isAddCardHidden, setIsAddCardHidden] = useState(false);
  const [uiStyle, setUiStyle] = useState<UiStyle>("terminal");
  const [theme, setTheme] = useState<Theme>("dark");
  const [selectedMapLocation, setSelectedMapLocation] = useState<SelectedMapLocation | null>(null);
  const [defaultMapLocation, setDefaultMapLocation] = useState<DefaultMapLocation>(DEFAULT_MAP_LOCATION);
  const [defaultMapZoom, setDefaultMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [cityPinColor, setCityPinColor] = useState<string>(DEFAULT_MAP_COLORS.cityPin);
  const [cardHighlightColor, setCardHighlightColor] = useState<string>(DEFAULT_MAP_COLORS.cardHighlight);
  const [locationPinColor, setLocationPinColor] = useState<string>(DEFAULT_MAP_COLORS.locationPin);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [draggedClockId, setDraggedClockId] = useState<string | null>(null);
  const [highlightedClockId, setHighlightedClockId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; after: boolean } | null>(null);
  const [bootProgress, setBootProgress] = useState(6);
  const [isBootVisible, setIsBootVisible] = useState(true);
  const [hasMinimumBootTimeElapsed, setHasMinimumBootTimeElapsed] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const lastSavedRef = useRef<string | null>(null);
  const mapRequestRef = useRef(0);
  const hasInitializedMapRef = useRef(false);
  const toolbarTimeoutRef = useRef<number | null>(null);
  const t = (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) =>
    translate(language, key, values);

  const timezoneOptions = useMemo(
    () => getSupportedTimezones().map((timezone) => ({ timezone, label: timezoneLabel(timezone) })),
    [],
  );
  const timezoneLabels = useMemo(
    () => new Map(timezoneOptions.map(({ timezone, label }) => [timezone, label])),
    [timezoneOptions],
  );

  useEffect(() => {
    setUserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || null);
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (typeof settings.fontFamily === "string" && settings.fontFamily.trim()) {
          setFontFamily(settings.fontFamily.trim());
          setFontInput(settings.fontFamily.trim());
        }
        if (Number.isInteger(settings.cardsPerRow)) {
          setCardsPerRow(Math.min(12, Math.max(1, settings.cardsPerRow)));
        }
        if (settings.addCardPlacement === "inline" || settings.addCardPlacement === "next-row") {
          setAddCardPlacement(settings.addCardPlacement);
        }
        if (typeof settings.isAddCardHidden === "boolean") {
          setIsAddCardHidden(settings.isAddCardHidden);
        }
        if (settings.uiStyle === "terminal" || settings.uiStyle === "classic" || settings.uiStyle === "coke") {
          setUiStyle(settings.uiStyle);
        } else if (settings.visualTheme === "coke") {
          setUiStyle("coke");
        }
        if (settings.theme === "dark" || settings.theme === "light") {
          setTheme(settings.theme);
        }
        if (settings.language === "en" || settings.language === "it" || settings.language === "es") {
          setLanguage(settings.language);
        }
        if (typeof settings.isMapVisible === "boolean") {
          setIsMapVisible(settings.isMapVisible);
        }
        const savedMapLocation = settings.defaultMapLocation;
        if (
          savedMapLocation &&
          typeof savedMapLocation.city === "string" &&
          typeof savedMapLocation.country === "string" &&
          Number.isFinite(savedMapLocation.latitude) &&
          Number.isFinite(savedMapLocation.longitude)
        ) {
          setDefaultMapLocation(savedMapLocation);
        }
        if (Number.isInteger(settings.defaultMapZoom)) {
          setDefaultMapZoom(Math.min(19, Math.max(2, settings.defaultMapZoom)));
        }
        if (/^#[\da-f]{6}$/i.test(settings.cityPinColor)) {
          setCityPinColor(settings.cityPinColor);
        }
        if (/^#[\da-f]{6}$/i.test(settings.cardHighlightColor)) {
          setCardHighlightColor(settings.cardHighlightColor);
        }
        if (/^#[\da-f]{6}$/i.test(settings.locationPinColor)) {
          setLocationPinColor(settings.locationPinColor);
        }
      }
      const stored = localStorage.getItem(CLOCKS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          const restored = parsed
            .filter((clock: Partial<ClockEntry>) =>
              timezoneOptions.some(({ timezone }) => timezone === clock.timezone),
            )
            .map((clock: Partial<ClockEntry>) => {
              const timezone = String(clock.timezone);
              const defaultLocation = DEFAULT_LOCATIONS.find((location) => location.timezone === timezone);
              const savedCity = clock.city || timezoneLabel(timezone);
              const savedParts = savedCity.split(", ");
              const possibleCountry = savedParts.at(-1) ?? "";
              const legacyParts = !clock.country &&
                savedParts.length > 1 &&
                possibleCountry.length > 2 &&
                !possibleCountry.includes(".")
                  ? savedParts
                  : null;
              const migratedCountry = legacyParts?.pop();
              const defaultCountry = defaultLocation?.country;
              return {
                ...makeClock(timezone, String(clock.id ?? `restored-${timezone}`)),
                ...clock,
                id: String(clock.id ?? `restored-${timezone}`),
                city: legacyParts?.join(", ") || savedCity,
                country: clock.country || migratedCountry || defaultCountry,
                timezone,
                latitude: typeof clock.latitude === "number" && Number.isFinite(clock.latitude)
                  ? clock.latitude
                  : defaultLocation?.latitude,
                longitude: typeof clock.longitude === "number" && Number.isFinite(clock.longitude)
                  ? clock.longitude
                  : defaultLocation?.longitude,
                scale: typeof clock.scale === "number" && Number.isFinite(clock.scale)
                  ? Math.min(1.5, Math.max(.7, clock.scale))
                  : undefined,
              };
            });
          if (restored.length) setClocks(restored);
        }
      }
    } catch {
      setStatus(translate(language, "savedRestoreError"));
    } finally {
      setIsRestored(true);
    }
  }, [timezoneOptions]);

  useEffect(() => {
    const family = fontFamily.trim() || DEFAULT_FONT;
    const linkId = "world-clock-google-font";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    document.documentElement.style.setProperty("--app-font", `"${family}", system-ui, sans-serif`);
    if (!isRestored) return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        fontFamily: family,
        cardsPerRow,
        addCardPlacement,
        isAddCardHidden,
        uiStyle,
        theme,
        defaultMapLocation,
        defaultMapZoom,
        cityPinColor,
        cardHighlightColor,
        locationPinColor,
        language,
        isMapVisible,
      }));
    } catch {
      setStatus(t("savePreferenceError"));
    }
  }, [
    fontFamily,
    cardsPerRow,
    addCardPlacement,
    isAddCardHidden,
    uiStyle,
    theme,
    defaultMapLocation,
    defaultMapZoom,
    cityPinColor,
    cardHighlightColor,
    locationPinColor,
    language,
    isMapVisible,
    isRestored,
  ]);

  useEffect(() => {
    document.documentElement.dataset.uiStyle = uiStyle;
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
  }, [uiStyle, theme, language]);

  useEffect(() => {
    const link = document.createElement("link");
    link.id = "world-clock-font-previews";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${POPULAR_FONTS
      .map((font) => `family=${encodeURIComponent(font)}`)
      .join("&")}&display=swap`;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    const serialized = JSON.stringify(clocks);
    if (serialized !== lastSavedRef.current) {
      localStorage.setItem(CLOCKS_STORAGE_KEY, serialized);
      lastSavedRef.current = serialized;
    }
  }, [clocks, isRestored]);

  useEffect(() => {
    if (!status) return;
    const timeout = window.setTimeout(() => setStatus(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    const minimumDisplay = window.setTimeout(() => setHasMinimumBootTimeElapsed(true), 700);
    return () => window.clearTimeout(minimumDisplay);
  }, []);

  useEffect(() => {
    if (!isBootVisible) return;
    if (isRestored && now && hasMinimumBootTimeElapsed) {
      setBootProgress(100);
      const finish = window.setTimeout(() => setIsBootVisible(false), 320);
      return () => window.clearTimeout(finish);
    }

    const progress = window.setInterval(() => {
      setBootProgress((current) => Math.min(current + (current < 55 ? 9 : 3), 88));
    }, 140);
    return () => window.clearInterval(progress);
  }, [isBootVisible, isRestored, now, hasMinimumBootTimeElapsed]);

  useEffect(() => {
    const closeMenus = () => {
      setContextMenu(null);
      setDashboardContextMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsMapSettingsOpen(false);
        setColorPickerFor(null);
      }
    };
    window.addEventListener("click", closeMenus);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("click", closeMenus);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => setIsPresentationMode(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    const showToolbar = () => {
      setIsToolbarVisible(true);
      if (toolbarTimeoutRef.current !== null) window.clearTimeout(toolbarTimeoutRef.current);
      toolbarTimeoutRef.current = window.setTimeout(() => setIsToolbarVisible(false), 2400);
    };

    showToolbar();
    window.addEventListener("pointermove", showToolbar, { passive: true });
    window.addEventListener("keydown", showToolbar);
    window.addEventListener("focusin", showToolbar);
    return () => {
      window.removeEventListener("pointermove", showToolbar);
      window.removeEventListener("keydown", showToolbar);
      window.removeEventListener("focusin", showToolbar);
      if (toolbarTimeoutRef.current !== null) window.clearTimeout(toolbarTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isAddCardHidden && isMapVisible) return;
    const openDashboardMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".clock-card, .modal-backdrop, .context-menu")) return;
      if (isMapVisible && target.closest(".world-map-section")) return;
      event.preventDefault();
      setContextMenu(null);
      setDashboardContextMenu({ x: event.clientX, y: event.clientY });
    };
    document.addEventListener("contextmenu", openDashboardMenu);
    return () => document.removeEventListener("contextmenu", openDashboardMenu);
  }, [isAddCardHidden, isMapVisible]);

  const hasMultipleClockRows = Math.ceil(clocks.length / cardsPerRow) >= 2;
  const cityPins = useMemo(
    () => clocks.flatMap((clock) =>
      typeof clock.latitude === "number" &&
      Number.isFinite(clock.latitude) &&
      typeof clock.longitude === "number" &&
      Number.isFinite(clock.longitude)
        ? [{
            id: clock.id,
            label: `${clock.city}${clock.country ? ` (${clock.country})` : ""}`,
            latitude: clock.latitude,
            longitude: clock.longitude,
          }]
        : [],
    ),
    [clocks],
  );

  const formattedClocks = useMemo(() => {
    if (!now) return new Map<string, ClockParts>();
    return new Map(clocks.map((clock) => [clock.id, formatClock(now, clock.timezone, language)]));
  }, [clocks, now, language]);
  const localClockTextColor = useMemo(
    () =>
      clocks.find((clock) =>
        (clock.isLocal ?? clock.timezone === userTimeZone) && clock.textColor,
      )?.textColor ?? (
        uiStyle === "coke"
          ? (theme === "light" ? "#9b0000" : "#ffffff")
          : (theme === "light" ? "#ffffff" : LOCAL_COLORS.text)
      ),
    [clocks, theme, uiStyle, userTimeZone],
  );
  const selectedMapTime = useMemo(
    () => {
      if (!now || !selectedMapLocation?.timezone || !selectedMapLocation.serverUnixTime || !selectedMapLocation.resolvedAt) {
        return null;
      }
      const authoritativeNow = new Date(
        selectedMapLocation.serverUnixTime * 1000 + now.getTime() - selectedMapLocation.resolvedAt,
      );
      return formatClock(authoritativeNow, selectedMapLocation.timezone, language);
    },
    [now, selectedMapLocation, language],
  );

  const timezoneSearchResults = useMemo<LocationResult[]>(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return timezoneOptions
      .filter(({ timezone, label }) =>
        !query || `${label} ${timezone}`.toLocaleLowerCase().includes(query),
      )
      .slice(0, query ? 15 : 50)
      .map(({ timezone, label }) => ({
        id: `timezone-${timezone}`,
        label,
        cardLabel: label,
        country: undefined,
        detail: timezone,
        timezone,
      }));
  }, [searchQuery, timezoneOptions]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setLocationResults([]);
      setIsLocationSearchLoading(false);
      setLocationSearchFailed(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLocationSearchLoading(true);
      setLocationSearchFailed(false);
      try {
        const places = await searchPlaces(query, 30, controller.signal, language);
        const results: LocationResult[] = places
          .filter((place) => place.timezone)
          .map((place) => {
            const location = [place.admin1, place.country].filter(Boolean).join(", ");
            return {
              id: `place-${place.id}`,
              label: place.name,
              cardLabel: place.name,
              country: place.country || undefined,
              detail: `${location}${location ? " · " : ""}${place.timezone}`,
              timezone: place.timezone as string,
              latitude: place.latitude,
              longitude: place.longitude,
            };
          });
        setLocationResults(results);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setLocationResults([]);
          setLocationSearchFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLocationSearchLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery, language]);

  useEffect(() => {
    const query = mapLocationQuery.trim();
    if (!isMapSettingsOpen || query.length < 2) {
      setMapLocationResults([]);
      setIsMapLocationLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsMapLocationLoading(true);
      try {
        const places = await searchPlaces(query, 20, controller.signal, language);
        setMapLocationResults(places.map((place) => ({
          id: place.id,
          city: place.name,
          country: place.country,
          latitude: place.latitude,
          longitude: place.longitude,
        })));
      } catch (error) {
        if ((error as Error).name !== "AbortError") setMapLocationResults([]);
      } finally {
        if (!controller.signal.aborted) setIsMapLocationLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isMapSettingsOpen, mapLocationQuery, language]);

  const searchResults = useMemo(() => {
    const seen = new Set<string>();
    return [...locationResults, ...timezoneSearchResults].filter((result) => {
      const key = `${result.label.toLocaleLowerCase()}|${result.timezone}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [locationResults, timezoneSearchResults]);

  function addClock(
    timezone: string,
    city = timezoneLabels.get(timezone) ?? timezoneLabel(timezone),
    country?: string,
    latitude?: number,
    longitude?: number,
  ) {
    if (clocks.some((clock) =>
      clock.timezone === timezone &&
      clock.city === city &&
      (!country || !clock.country || clock.country === country),
    )) {
      setStatus(t("duplicateCity"));
      return;
    }
    const coordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude: latitude as number, longitude: longitude as number }
      : undefined;
    const newClock = makeClock(timezone, undefined, city, country, coordinates);
    setClocks((current) => [...current, newClock]);
    if (!coordinates) {
      const controller = new AbortController();
      void searchPlaces(city, 10, controller.signal, language)
        .then((places) => {
          const place = places.find((candidate) => candidate.timezone === timezone) ?? places[0];
          if (!place) return;
          setClocks((current) => current.map((clock) =>
            clock.id === newClock.id
              ? { ...clock, latitude: place.latitude, longitude: place.longitude }
              : clock,
          ));
        })
        .catch(() => {
          // The clock remains usable when coordinates cannot be resolved.
        });
    }
    setStatus(t("cityAdded", { city }));
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  function resetColors(clock: ClockEntry) {
    const resetsLocalText = clock.isLocal ?? clock.timezone === userTimeZone;
    setClocks((current) =>
      current.map((item) => {
        const isTarget = item.id === clock.id;
        const isLocal = item.isLocal ?? item.timezone === userTimeZone;
        if (isTarget) {
          return { ...item, bgColor: undefined, textColor: undefined, metaColor: undefined };
        }
        return resetsLocalText && isLocal ? { ...item, textColor: undefined } : item;
      }),
    );
  }

  function resizeClock(clockId: string, delta: number) {
    setClocks((current) =>
      current.map((clock) => {
        if (clock.id !== clockId) return clock;
        const scale = Math.round(Math.min(1.5, Math.max(.7, (clock.scale ?? 1) + delta)) * 10) / 10;
        return { ...clock, scale };
      }),
    );
  }

  function removeClock(timezone: string, city: string, country?: string) {
    setClocks((current) =>
      current.filter((clock) =>
        !(
          clock.timezone === timezone &&
          clock.city === city &&
          (!country || !clock.country || clock.country === country)
        ),
      ),
    );
    setStatus(t("clockRemoved"));
  }

  function moveClock(sourceId: string, targetId: string, after: boolean) {
    if (sourceId === targetId) return;
    setClocks((current) => {
      const source = current.find((clock) => clock.id === sourceId);
      if (!source) return current;
      const withoutSource = current.filter((clock) => clock.id !== sourceId);
      const targetIndex = withoutSource.findIndex((clock) => clock.id === targetId);
      if (targetIndex < 0) return current;
      withoutSource.splice(targetIndex + (after ? 1 : 0), 0, source);
      return withoutSource;
    });
  }

  function applyFont() {
    const family = fontInput.trim();
    if (!family) {
      setStatus(t("enterFont"));
      return;
    }
    setFontFamily(family);
    setFontInput(family);
    setStatus(t("fontApplied", { font: family }));
  }

  async function enterPresentationMode() {
    try {
      setIsSettingsOpen(false);
      await document.documentElement.requestFullscreen();
    } catch {
      setStatus(t("fullscreenUnavailable"));
    }
  }

  async function exitPresentationMode() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      setStatus(t("fullscreenCloseError"));
    }
  }

  async function selectMapLocation(latitude: number, longitude: number) {
    const requestId = ++mapRequestRef.current;
    setSelectedMapLocation({ latitude, longitude, isLoading: true });
    try {
      const resolved = await resolveLocationTime(latitude, longitude);

      if (requestId === mapRequestRef.current) {
        setSelectedMapLocation({
          latitude,
          longitude,
          ...resolved,
          isLoading: false,
        });
      }
    } catch {
      if (requestId === mapRequestRef.current) {
        setSelectedMapLocation({
          latitude,
          longitude,
          isLoading: false,
          error: t("timeResolveError"),
        });
      }
    }
  }

  return (
    <main className={[
      isPresentationMode ? "presentation-mode" : "",
      isBootVisible ? "is-booting" : "",
      isMapVisible && hasMultipleClockRows ? "has-multiple-clock-rows" : "",
      !isMapVisible ? "map-hidden" : "",
      !isToolbarVisible ? "toolbar-hidden" : "",
    ].filter(Boolean).join(" ") || undefined}>
      {isBootVisible && (
        <div className="boot-screen" role="status" aria-live="polite">
          <div className="boot-panel">
            <strong>{t("booting")}</strong>
            <span>{t("rendering")}...</span>
            <div
              className="boot-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={bootProgress}
            >
              <span style={{ width: `${bootProgress}%` }} />
            </div>
            <output>{String(bootProgress).padStart(3, "0")}%</output>
          </div>
        </div>
      )}
      <header
        className="page-toolbar"
        onPointerEnter={() => {
          if (toolbarTimeoutRef.current !== null) window.clearTimeout(toolbarTimeoutRef.current);
          setIsToolbarVisible(true);
        }}
        onPointerLeave={() => {
          toolbarTimeoutRef.current = window.setTimeout(() => setIsToolbarVisible(false), 1200);
        }}
      >
        <h1>{t("worldClocks")}</h1>
        <div className="toolbar-actions">
          <button
            className="theme-button"
            type="button"
            aria-label={t("switchTheme", { theme: t(theme === "dark" ? "light" : "dark") })}
            title={t("switchTheme", { theme: t(theme === "dark" ? "light" : "dark") })}
            onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
          >
            <span aria-hidden="true">{theme === "dark" ? "[L]" : "[D]"}</span>
          </button>
          <button
            className="fullscreen-button"
            type="button"
            aria-label={t(isPresentationMode ? "exitPresentation" : "enterPresentation")}
            title={t(isPresentationMode ? "exitPresentation" : "enterPresentation")}
            onClick={isPresentationMode ? exitPresentationMode : enterPresentationMode}
          >
            <span aria-hidden="true">⛶</span>
          </button>
          <button
            className="menu-button"
            type="button"
            aria-label={t("openGlobalSettings")}
            aria-expanded={isSettingsOpen}
            aria-controls="global-settings"
            onClick={() => setIsSettingsOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </header>

      {isSettingsOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-settings-title"
          onClick={() => setIsSettingsOpen(false)}
        >
          <aside
            id="global-settings"
            className="settings-panel"
            aria-label={t("globalSettings")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-heading">
              <div>
                <strong id="global-settings-title">{t("globalSettings")}</strong>
                <small>{t("globalSettingsHelp")}</small>
              </div>
              <button type="button" aria-label={t("closeGlobalSettings")} onClick={() => setIsSettingsOpen(false)}>×</button>
            </div>
            <fieldset className="settings-group">
              <legend>{t("language")}</legend>
              <label htmlFor="dashboard-language">{t("dashboardLanguage")}</label>
              <select
                id="dashboard-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                {LANGUAGES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </fieldset>
            <fieldset className="settings-group">
              <legend>{t("typography")}</legend>
              <label htmlFor="font-family">{t("googleFont")}</label>
              <div className="font-controls">
                <input
                  id="font-family"
                  list="popular-google-fonts"
                  value={fontInput}
                  onChange={(event) => setFontInput(event.target.value)}
                  onBlur={applyFont}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyFont();
                    }
                  }}
                  placeholder={t("fontExample")}
                />
              </div>
              <datalist id="popular-google-fonts">
                {POPULAR_FONTS.map((font) => <option key={font} value={font} />)}
              </datalist>
              <div className="font-previews" aria-label={t("suggestedFonts")}>
                {POPULAR_FONTS.map((font) => (
                  <button
                    key={font}
                    type="button"
                    className={fontFamily === font ? "selected" : ""}
                    style={{ fontFamily: `"${font}", sans-serif` }}
                    onClick={() => {
                      setFontInput(font);
                      setFontFamily(font);
                      setStatus(t("fontApplied", { font }));
                    }}
                  >
                    {font}
                  </button>
                ))}
              </div>
              <p className="setting-help">
                {t("fontHelp")} <strong>{fontFamily}</strong>
              </p>
            </fieldset>

            <fieldset className="settings-group">
              <legend>{t("layout")}</legend>
              <div className="layout-settings">
                <label htmlFor="cards-per-row">{t("cardsPerRow")}</label>
                <input
                  id="cards-per-row"
                  type="number"
                  min="1"
                  max="12"
                  value={cardsPerRow}
                  onChange={(event) => {
                    const value = event.currentTarget.valueAsNumber;
                    if (Number.isFinite(value)) setCardsPerRow(Math.min(12, Math.max(1, value)));
                  }}
                />
                <fieldset>
                  <legend>{t("addPlacement")}</legend>
                  <label>
                    <input
                      type="radio"
                      name="add-card-placement"
                      checked={addCardPlacement === "inline"}
                      onChange={() => setAddCardPlacement("inline")}
                    />
                    {t("inlineCards")}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="add-card-placement"
                      checked={addCardPlacement === "next-row"}
                      onChange={() => setAddCardPlacement("next-row")}
                    />
                    {t("newRow")}
                  </label>
                </fieldset>
                <label className="hide-add-card">
                  <input
                    type="checkbox"
                    checked={isAddCardHidden}
                    onChange={(event) => setIsAddCardHidden(event.target.checked)}
                  />
                  {t("hideAddCard")}
                </label>
                {isAddCardHidden && (
                  <small className="layout-help">
                    {t("hiddenAddHelp")}
                  </small>
                )}
              </div>
            </fieldset>

            <fieldset className="settings-group">
              <legend>{t("map")}</legend>
              <label className="visibility-toggle" htmlFor="default-map-visibility">
                <span>{t("mapVisibleByDefault")}</span>
                <span className="toggle-control">
                  <input
                    id="default-map-visibility"
                    type="checkbox"
                    checked={isMapVisible}
                    onChange={(event) => setIsMapVisible(event.target.checked)}
                  />
                  <strong aria-hidden="true">{isMapVisible ? "ON" : "OFF"}</strong>
                </span>
              </label>
            </fieldset>

            <fieldset className="settings-group appearance-settings">
              <legend>{t("appearance")}</legend>
              <span>{t("uiStyle")}</span>
              <div className="segmented-control">
                <label>
                  <input
                    type="radio"
                    name="ui-style"
                    checked={uiStyle === "terminal"}
                    onChange={() => setUiStyle("terminal")}
                  />
                  {t("terminal")}
                </label>
                <label>
                  <input
                    type="radio"
                    name="ui-style"
                    checked={uiStyle === "classic"}
                    onChange={() => setUiStyle("classic")}
                  />
                  {t("classic")}
                </label>
                <label>
                  <input
                    type="radio"
                    name="ui-style"
                    checked={uiStyle === "coke"}
                    onChange={() => setUiStyle("coke")}
                  />
                  {t("coke")}
                </label>
              </div>
              <span>{t("theme")}</span>
              <div className="segmented-control">
                <label>
                  <input type="radio" name="theme" checked={theme === "dark"} onChange={() => setTheme("dark")} />
                  {t("dark")}
                </label>
                <label>
                  <input type="radio" name="theme" checked={theme === "light"} onChange={() => setTheme("light")} />
                  {t("light")}
                </label>
              </div>
            </fieldset>
            {isPresentationMode && (
              <button className="exit-presentation" type="button" onClick={exitPresentationMode}>
                {t("exitPresentation")}
              </button>
            )}
          </aside>
        </div>
      )}

      <section
        className={`clock-layout ${addCardPlacement === "next-row" ? "next-row" : "inline"}`}
        aria-busy={!now || !isRestored}
      >
        <div className="clock-grid" style={{ "--grid-columns": cardsPerRow } as CSSProperties}>
          {clocks.map((clock) => {
            const formatted = formattedClocks.get(clock.id);
            const isLocal = clock.isLocal ?? clock.timezone === userTimeZone;
            const effectiveTextColor = isLocal
              ? localClockTextColor
              : clock.textColor ?? (theme === "light" ? "#17251d" : "#e6f0ff");
            const effectiveMetaColor = clock.metaColor ??
              (isLocal
                ? (uiStyle === "coke" ? (theme === "light" ? "#a33a3a" : "#ffd0d0") : LOCAL_COLORS.meta)
                : (theme === "light" ? "#51685a" : "#9fb2d1"));
            const cardStyle = {
              ...(isLocal
                ? {
                    background: uiStyle === "coke"
                      ? (theme === "light" ? "#ffe2e2" : "#7a0000")
                      : LOCAL_COLORS.background,
                  }
                : {}),
              ...(clock.bgColor ? { background: clock.bgColor } : {}),
              "--clock-text": effectiveTextColor,
              "--clock-meta": effectiveMetaColor,
              "--card-scale": clock.scale ?? 1,
            } as CSSProperties;

            return (
              <article
              key={clock.id}
              className={[
                "clock-card",
                isLocal ? "is-local" : "",
                highlightedClockId === clock.id ? "is-map-highlighted" : "",
                draggedClockId === clock.id ? "is-dragging" : "",
                dropTarget?.id === clock.id ? (dropTarget.after ? "drop-after" : "drop-before") : "",
              ].filter(Boolean).join(" ")}
              id={`clock-${clock.id}`}
              style={{
                ...cardStyle,
                ...(highlightedClockId === clock.id
                  ? { "--map-highlight-color": cardHighlightColor }
                  : {}),
              } as CSSProperties}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", clock.id);
                setDraggedClockId(clock.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                const rect = event.currentTarget.getBoundingClientRect();
                const horizontalDistance = Math.abs(event.clientX - (rect.left + rect.width / 2)) / rect.width;
                const verticalDistance = Math.abs(event.clientY - (rect.top + rect.height / 2)) / rect.height;
                const after = horizontalDistance > verticalDistance
                  ? event.clientX > rect.left + rect.width / 2
                  : event.clientY > rect.top + rect.height / 2;
                setDropTarget({ id: clock.id, after });
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData("text/plain") || draggedClockId;
                if (sourceId) moveClock(sourceId, clock.id, dropTarget?.after ?? false);
                setDraggedClockId(null);
                setDropTarget(null);
              }}
              onDragEnd={() => {
                setDraggedClockId(null);
                setDropTarget(null);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setContextMenu({ id: clock.id, x: event.clientX, y: event.clientY });
              }}
            >
              <div className="card-heading">
                <h2>{clock.city}{clock.country ? ` (${clock.country})` : ""}</h2>
                {isLocal && <span className="local-badge">{t("yourTimezone")}</span>}
              </div>
              <div className={`time-value${formatted ? "" : " loading"}`}>
                {formatted?.time ?? t("loading")}
              </div>
              <div className="meta">{formatted?.date ?? t("loading")}</div>
              <div className="meta">{clock.timezone}</div>
              <div className="meta">{formatted?.offset ?? t("loading")}</div>

              {colorPickerFor === clock.id && (
                <div className="color-picker" onClick={(event) => event.stopPropagation()}>
                  <span className="color-picker-title">LIVE_PREVIEW</span>
                  <button
                    className="color-picker-close"
                    type="button"
                    aria-label={t("closeColorPreview")}
                    onClick={() => setColorPickerFor(null)}
                  >
                    ×
                  </button>
                  {(["bgColor", "textColor", "metaColor"] as const).map((field) => (
                    <label key={field}>
                      {field === "bgColor" ? t("background") : field === "textColor" ? t("text") : t("meta")}
                      <input
                        aria-label={`${field} color`}
                        type="color"
                        value={
                          clock[field] ??
                          (field === "bgColor"
                            ? (isLocal ? LOCAL_COLORS.background : (theme === "light" ? "#f8fcf8" : "#06122b"))
                            : field === "textColor"
                              ? effectiveTextColor
                              : effectiveMetaColor)
                        }
                        onChange={(event) => {
                          const value = event.target.value;
                          setClocks((current) =>
                            current.map((item) => {
                              const itemIsLocal = item.isLocal ?? item.timezone === userTimeZone;
                              if (field === "textColor" && isLocal && itemIsLocal) {
                                return { ...item, textColor: value };
                              }
                              return item.id === clock.id ? { ...item, [field]: value } : item;
                            }),
                          );
                        }}
                      />
                    </label>
                  ))}
                  <div className="color-picker-actions">
                    <button className="terminal-button reset" onClick={() => resetColors(clock)}>
                      {t("reset")}
                    </button>
                    <button className="terminal-button done" onClick={() => setColorPickerFor(null)}>
                      {t("done")}
                    </button>
                  </div>
                </div>
              )}

              {contextMenu?.id === clock.id && (
                <div
                  className="context-menu"
                  role="menu"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setClocks((current) =>
                        current.map((item) =>
                          item.id === clock.id ? { ...item, isLocal: !isLocal } : item,
                        ),
                      );
                      setContextMenu(null);
                    }}
                  >
                    {t(isLocal ? "removeLocal" : "setLocal")}
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setColorPickerFor(clock.id);
                      setContextMenu(null);
                    }}
                  >
                    {t("pickColors")}
                  </button>
                  <button role="menuitem" onClick={() => { resetColors(clock); setContextMenu(null); }}>
                    {t("resetColors")}
                  </button>
                  <button
                    role="menuitem"
                    disabled={(clock.scale ?? 1) <= .7}
                    onClick={() => {
                      resizeClock(clock.id, -.1);
                      setContextMenu(null);
                    }}
                  >
                    {t("decreaseCardSize")}
                  </button>
                  <button
                    role="menuitem"
                    disabled={(clock.scale ?? 1) >= 1.5}
                    onClick={() => {
                      resizeClock(clock.id, .1);
                      setContextMenu(null);
                    }}
                  >
                    {t("increaseCardSize")}
                  </button>
                  <button
                    className="danger"
                    role="menuitem"
                    onClick={() => {
                      setClocks((current) => current.filter((item) => item.id !== clock.id));
                      setContextMenu(null);
                      setStatus(t("clockRemoved"));
                    }}
                  >
                    {t("remove")}
                  </button>
                </div>
              )}
              </article>
            );
          })}
          {!isAddCardHidden && addCardPlacement === "inline" && hasMultipleClockRows && (
            <div className="add-card inline in-grid">
              <button type="button" onClick={() => setIsSearchOpen(true)} aria-label={t("addClock")}>+</button>
            </div>
          )}
        </div>

        {!isAddCardHidden && !(addCardPlacement === "inline" && hasMultipleClockRows) && (
          <div className={`add-card ${addCardPlacement === "next-row" ? "next-row" : "inline"}`}>
            <button type="button" onClick={() => setIsSearchOpen(true)} aria-label={t("addClock")}>+</button>
          </div>
        )}
      </section>

      {isMapVisible && (
      <figure
        className="world-map-section"
        aria-label={t("daylightMap")}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setContextMenu(null);
          setDashboardContextMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <div className="leaflet-map-shell">
          <button
            className="map-settings-trigger"
            type="button"
            aria-label={t("openMapSettings")}
            title={t("mapSettings")}
            onClick={() => {
              setMapLocationQuery("");
              setIsMapSettingsOpen(true);
            }}
          >
            <span aria-hidden="true">⚙</span>
          </button>
          <LeafletWorldMap
            now={now}
            selectedLocation={selectedMapLocation}
            cityPins={cityPins}
            selectedCityPinId={highlightedClockId}
            cityPinColor={cityPinColor}
            locationPinColor={locationPinColor}
            defaultLocation={defaultMapLocation}
            defaultZoom={defaultMapZoom}
            language={language}
            onSelect={({ latitude, longitude }) => {
              setHighlightedClockId(null);
              void selectMapLocation(latitude, longitude);
            }}
            onCityPinSelect={(clockId) => {
              setHighlightedClockId(clockId);
              setSelectedMapLocation(null);
              window.requestAnimationFrame(() => {
                document.getElementById(`clock-${clockId}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              });
            }}
            onReady={() => {
              if (hasInitializedMapRef.current) return;
              hasInitializedMapRef.current = true;
              void selectMapLocation(defaultMapLocation.latitude, defaultMapLocation.longitude);
            }}
          />
          {selectedMapLocation && (
            <aside className="map-time-popup" onPointerDown={(event) => event.stopPropagation()}>
              <button
                type="button"
                aria-label={t("closeSelectedTime")}
                onClick={() => setSelectedMapLocation(null)}
              >
                ×
              </button>
              {selectedMapLocation.isLoading ? (
                <span className="inline-loading">
                  <i className="loading-indicator" aria-hidden="true" />
                  {t("resolvingTime")}
                </span>
              ) : selectedMapLocation.error ? (
                <span>{selectedMapLocation.error}</span>
              ) : (
                <>
                  <span className="map-time-label">{t("localTime")}</span>
                  <strong>{selectedMapTime?.time ?? t("loading")}</strong>
                  <span>{selectedMapTime?.date}</span>
                  <small>{selectedMapLocation.timezone} · {selectedMapTime?.offset}</small>
                  <small>
                    {Math.abs(selectedMapLocation.latitude).toFixed(2)}°{selectedMapLocation.latitude >= 0 ? "N" : "S"}{" "}
                    {Math.abs(selectedMapLocation.longitude).toFixed(2)}°{selectedMapLocation.longitude >= 0 ? "E" : "W"}
                  </small>
                </>
              )}
            </aside>
          )}
        </div>
      </figure>
      )}

      {dashboardContextMenu && (
        <div
          className="context-menu dashboard-context-menu"
          role="menu"
          style={{ left: dashboardContextMenu.x, top: dashboardContextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            role="menuitem"
            onClick={() => {
              setIsMapVisible((visible) => !visible);
              setDashboardContextMenu(null);
            }}
          >
            {t(isMapVisible ? "hideMap" : "showMap")}
          </button>
          {isAddCardHidden && (
            <button
              role="menuitem"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(true);
                setDashboardContextMenu(null);
              }}
            >
              {t("addClock")}
            </button>
          )}
        </div>
      )}

      {isMapSettingsOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-settings-title"
          onClick={() => setIsMapSettingsOpen(false)}
        >
          <div className="search-dialog map-settings-dialog" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <strong id="map-settings-title">{t("mapSettings")}</strong>
                <small>{t("defaultPin")}: {defaultMapLocation.city} ({defaultMapLocation.country})</small>
              </div>
              <button type="button" onClick={() => setIsMapSettingsOpen(false)} aria-label={t("closeMapSettings")}>×</button>
            </header>
            <label htmlFor="default-map-location">{t("defaultPinLocation")}</label>
            <input
              id="default-map-location"
              autoFocus
              value={mapLocationQuery}
              onChange={(event) => setMapLocationQuery(event.target.value)}
              placeholder={t("searchCityCountry")}
            />
            <div className="map-zoom-setting">
              <label htmlFor="default-map-zoom">{t("defaultZoom")}</label>
              <input
                id="default-map-zoom"
                type="range"
                min="2"
                max="19"
                step="1"
                value={defaultMapZoom}
                onChange={(event) => setDefaultMapZoom(event.currentTarget.valueAsNumber)}
              />
              <output htmlFor="default-map-zoom">{defaultMapZoom}×</output>
            </div>
            <fieldset className="map-color-settings">
              <legend>{t("mapPinColors")}</legend>
              <label>
                <span>{t("cityPinColor")}</span>
                <input
                  type="color"
                  value={cityPinColor}
                  onChange={(event) => setCityPinColor(event.currentTarget.value)}
                />
              </label>
              <label>
                <span>{t("cardHighlightColor")}</span>
                <input
                  type="color"
                  value={cardHighlightColor}
                  onChange={(event) => setCardHighlightColor(event.currentTarget.value)}
                />
              </label>
              <label>
                <span>{t("locationPinColor")}</span>
                <input
                  type="color"
                  value={locationPinColor}
                  onChange={(event) => setLocationPinColor(event.currentTarget.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setCityPinColor(DEFAULT_MAP_COLORS.cityPin);
                  setCardHighlightColor(DEFAULT_MAP_COLORS.cardHighlight);
                  setLocationPinColor(DEFAULT_MAP_COLORS.locationPin);
                }}
              >
                {t("resetMapColors")}
              </button>
            </fieldset>
            <div className="search-results">
              {isMapLocationLoading && <p className="search-loading">{t("searchingLocations")}</p>}
              {!isMapLocationLoading && mapLocationQuery.trim().length >= 2 && !mapLocationResults.length && (
                <p>{t("noLocations")}</p>
              )}
              {mapLocationResults.map((location) => (
                <div className="search-result" key={location.id}>
                  <div>
                    <strong>{location.city}</strong>
                    <small>{location.country} · {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}</small>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextLocation: DefaultMapLocation = {
                        city: location.city,
                        country: location.country,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      };
                      setDefaultMapLocation(nextLocation);
                      setSelectedMapLocation(null);
                      void selectMapLocation(location.latitude, location.longitude);
                      setIsMapSettingsOpen(false);
                      setStatus(t("defaultPinChanged", { city: location.city }));
                    }}
                  >
                    {t("setDefault")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {status && <p key={status} className="status" role="status">{status}</p>}

      <footer className="page-footer">
        <a href="https://time.now/" target="_blank" rel="noopener noreferrer">
          Time.Now
        </a>
        <span aria-hidden="true"> · </span>
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Location search by Open-Meteo
        </a>
        <span aria-hidden="true"> · </span>
        <a href="https://leafletjs.com/" target="_blank" rel="noopener noreferrer">
          Interactive map by Leaflet
        </a>
        <span aria-hidden="true"> · </span>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap contributors
        </a>
        <span aria-hidden="true"> · </span>
        <a href="https://timeapi.io/" target="_blank" rel="noopener noreferrer">
          Coordinate timezone resolution by TimeAPI
        </a>
      </footer>

      {isSearchOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t("addClockDialog")} onClick={() => setIsSearchOpen(false)}>
          <div className="search-dialog" onClick={(event) => event.stopPropagation()}>
            <header>
              <label htmlFor="timezone-search">{t("searchCities")}</label>
              <button type="button" onClick={() => setIsSearchOpen(false)} aria-label={t("closeSearch")}>×</button>
            </header>
            <input
              id="timezone-search"
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
            />
            <div className="search-results">
              {isLocationSearchLoading && (
                <p className="search-loading" role="status">{t("searchingLocations")}</p>
              )}
              {searchResults.length ? searchResults.map(({
                id,
                timezone,
                label,
                cardLabel,
                country,
                detail,
                latitude,
                longitude,
              }) => {
                const isAlreadyAdded = clocks.some((clock) =>
                  clock.timezone === timezone &&
                  clock.city === cardLabel &&
                  (!country || !clock.country || clock.country === country),
                );
                return (
                  <div className="search-result" key={id}>
                    <div><strong>{label}</strong><small>{detail}</small></div>
                    <button
                      type="button"
                      className={isAlreadyAdded ? "danger" : undefined}
                      onClick={() => {
                        if (isAlreadyAdded) removeClock(timezone, cardLabel, country);
                        else addClock(timezone, cardLabel, country, latitude, longitude);
                      }}
                    >
                      {t(isAlreadyAdded ? "remove" : "add")}
                    </button>
                  </div>
                );
              }) : !isLocationSearchLoading && (
                <p>{locationSearchFailed ? t("searchUnavailable") : t("noLocations")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
