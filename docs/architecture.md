# Architecture

World Clock Dashboard is a client-side Next.js application. The App Router supplies
the document shell, while the dashboard, clocks, settings, search, and map
interactions run in the browser.

## Source layout

| Path | Responsibility |
| --- | --- |
| `app/layout.tsx` | Root HTML shell, metadata, and global styles |
| `app/page.tsx` | Dashboard rendering, UI state, persistence, drag and drop, and dialogs |
| `app/LeafletWorldMap.tsx` | Dynamically loaded Leaflet map, user/city markers, and daylight terminator |
| `app/hooks/useNow.ts` | Shared current-time updates |
| `app/hooks/useLiveGeolocation.ts` | One-shot browser geolocation and locality/timezone resolution |
| `app/lib/clock.ts` | Clock creation, timezone discovery, and cached date/time formatting |
| `app/lib/services.ts` | Geocoding, coordinate-to-timezone lookup, and time synchronization |
| `app/lib/constants.ts` | Defaults, storage keys, languages, fonts, and colors |
| `app/lib/i18n.ts` | UI translations |
| `app/lib/types.ts` | Shared domain and settings types |
| `app/globals.css` | Layout, themes, responsive behavior, and component styling |

`page.tsx` is a client component because it depends on browser features including
`localStorage`, geolocation, drag and drop, fullscreen, and timezone detection. Leaflet is
dynamically imported in an effect so that it is initialized only in the browser.

## Time and location data flow

Clock cards store an IANA timezone such as `Europe/Rome`. Every clock tick uses
`Intl.DateTimeFormat` to derive its time, date, and UTC offset locally. Formatter
instances are cached by locale and timezone.

City search follows this flow:

1. The browser queries Open-Meteo geocoding.
2. Valid results are converted to dashboard location results.
3. Selecting a result adds a clock with its returned timezone.

Map selection follows a separate flow:

1. Leaflet reports the selected latitude and longitude.
2. TimeAPI resolves the coordinates to an IANA timezone.
3. If that request fails or has no timezone, Open-Meteo forecast data is used as a
   fallback resolver.
4. When available, the UTC time returned by TimeAPI provides the initial timestamp;
   otherwise the application uses the browser clock.
5. The browser advances the timestamp locally from the recorded resolution time.

On initial load, the browser Geolocation API is requested once when the persisted
geolocation preference is enabled. Granted coordinates follow the same
timezone-resolution path. BigDataCloud reverse geocoding provides the current city
and country label. The flow updates the stable `user-location` clock and default map
location. A denial, disabled preference, or error does not alter the dashboard.
For naming, the application prefers the more precise locality fields before the
broader city field so nearby municipalities are not replaced by a metropolitan
administrative city.

No API credentials are used.

## External services

| Service | Purpose |
| --- | --- |
| Open-Meteo Geocoding API | City and country search |
| TimeAPI | Primary coordinate-to-timezone resolution |
| Open-Meteo Forecast API | Fallback coordinate-to-timezone resolution |
| BigDataCloud Free Reverse Geocoding | Current city and country for consented live coordinates |
| OpenStreetMap | Leaflet map tiles |
| Google Fonts | Selected dashboard font and font previews |

Deployments need outbound HTTPS access to these services. Their availability,
rate limits, privacy policies, and acceptable-use requirements are outside this
repository's control.

## Persistence

The application writes two JSON values to `localStorage`:

| Key | Data |
| --- | --- |
| `wc-clocks` | Ordered clock cards, labels, timezone, coordinates, colors, local marker, and scale |
| `wc-settings` | Font, dashboard background, layout, add-card behavior, UI style and light/dark theme, map defaults and colors, language, and map visibility |

Stored data is validated and constrained during restoration. Invalid or unsupported
timezones are omitted. There is no server-side persistence or synchronization
between browsers. See [GDPR and geolocation](gdpr-and-geolocation.md) for the
complete privacy analysis and publication checklist.

## Design constraints

- Timezone support comes from the runtime's `Intl` implementation.
- The application requires JavaScript and modern browser APIs.
- The daylight terminator is an approximation calculated in the browser.
- Network failures affect search, map tiles, map timezone resolution, synchronized
  map time, and remote fonts, but existing clock cards continue to use local time.
