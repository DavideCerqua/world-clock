# Functional Design Document

## Document control

| Item | Value |
| --- | --- |
| Product | World Clock Dashboard |
| Document type | Functional Design Document (FDD) |
| Audience | Product owners, designers, developers, testers, operators, and trainers |
| Status | Living document |
| Source of truth | Application behavior and requirements in this repository |

Update this document whenever a change adds, removes, or materially alters user
behavior. Implementation details belong in [Architecture](architecture.md).

## 1. Purpose

World Clock Dashboard provides a configurable, browser-based display of live times
for multiple cities. It supports personal dashboards, shared office displays,
employee presentations, and wall-mounted screens without requiring an account or
application backend.

## 2. Scope

### In scope

- display live clocks for supported IANA timezones;
- find cities and countries through location search;
- add, remove, reorder, resize, and recolor city cards;
- identify a local-timezone card;
- inspect location time through an interactive world map;
- associate map pins with city cards;
- customize layout, typography, language, background, UI style, theme, and card
  shape;
- provide Terminal, Classic, and Coke UI styles in light and dark modes;
- persist clocks and settings in the current browser;
- support fullscreen presentation mode.

### Out of scope

- user accounts, authentication, or authorization;
- server-side databases or cross-device synchronization;
- calendar events, alarms, weather, or meeting scheduling;
- guaranteed offline map/search support;
- authoritative legal or operational timekeeping;
- centralized administration of employee preferences.

## 3. Users and roles

| Role | Primary goal |
| --- | --- |
| Dashboard user | Track relevant city times and personalize the display |
| Presenter | Run a clean fullscreen dashboard on a shared screen |
| Coca-Cola employee | Use the rounded Coke UI style in light or dark mode |
| Operator | Deploy and maintain a reliable local or hosted instance |
| Contributor | Change features while preserving expected behavior |

All application users have the same capabilities. Roles describe usage patterns,
not access-control levels.

## 4. Functional requirements

### FR-1: Clock display

- The system shall render one card for each configured clock.
- Each card shall display city, optional country, local date, local time, timezone,
  and UTC offset.
- Displayed time shall update once per second.
- Time formatting shall use the browser's IANA timezone implementation.

### FR-2: Clock management

- Users shall be able to search for cities, countries, regions, and timezone names.
- Users shall be able to add and remove clock cards.
- Duplicate city/timezone combinations shall be rejected.
- Users shall be able to reorder cards with drag and drop.
- Users shall be able to resize a card between 70% and 150%.
- Users shall be able to designate or remove a local-timezone card.

### FR-3: Card appearance

- Users shall be able to configure background, primary text, and metadata colors
  for individual cards.
- Users shall be able to reset individual card colors.
- Users shall be able to configure card corner radius from 0 to 48 pixels.
- Users shall be able to return card corners to the active UI style's default.

Style defaults are 2 pixels for Terminal, 12 pixels for Classic, and 28 pixels for
Coke.

### FR-4: Dashboard appearance

- The system shall provide Terminal, Classic, and Coke UI styles.
- Every UI style shall support light and dark modes.
- The Coke style shall use rounded cards, presentation typography, red gradients,
  glass-like panels, and pill or circular controls.
- Users shall be able to select a Google Font family.
- Users shall be able to configure between 1 and 12 cards per row.
- Users shall be able to place the add-card control inline or on a new row.
- Users shall be able to hide the add-card control.

### FR-5: Dashboard background

- Users shall be able to use the active theme's default background.
- Users shall be able to select a solid background color.
- Users shall be able to configure a two-color linear gradient and its angle.
- Users shall be able to use an externally hosted image URL.
- Users shall be able to upload PNG, JPG/JPEG, or SVG images smaller than 1.5 MB.
- Users shall be able to reset all background settings to the active theme default.

### FR-6: Map

- The system shall display an interactive Leaflet map with OpenStreetMap tiles.
- The map shall show an approximate day/night terminator.
- Selecting an arbitrary map point shall resolve its timezone and show local time.
- Each clock with known coordinates shall have a city pin.
- The selected arbitrary location and city pins shall use distinct configurable
  colors.
- Selecting a city pin shall scroll to and highlight its corresponding card.
- The highlight shall remain until another city pin or arbitrary map point is
  selected.
- Users shall be able to configure the default map city and zoom.
- Users shall be able to hide or show the map.

### FR-7: Presentation mode

- Users shall be able to request browser fullscreen mode.
- Presentation mode shall hide editing distractions where appropriate.
- Users shall be able to exit using the on-screen action or browser controls.
- Failure to enter or exit fullscreen shall produce user feedback.

### FR-8: Language

- The system shall support English, Italian, and Spanish interfaces.
- Changing language shall update document language metadata and visible labels.
- Location search shall use the selected language where supported by the provider.

### FR-9: Persistence

- The system shall store clocks under `wc-clocks`.
- The system shall store preferences under `wc-settings`.
- Persistence shall not begin until restoration has been attempted.
- Stored values shall be validated and constrained before use.
- Invalid stored values shall fall back to safe defaults.
- Local image backgrounds shall be stored only in the current browser.

## 5. Primary workflows

### Add a city and use its map pin

1. The user opens Add Clock.
2. The user enters at least two search characters.
3. The system returns geocoded and timezone-based matches.
4. The user adds a result.
5. The system creates and persists the clock.
6. If coordinates are known, the system creates its city pin.
7. If coordinates are missing, the system attempts a background geocoding lookup.
8. The user selects the city pin.
9. The map marks the pin as selected and the system scrolls to and highlights the
   matching card.

### Customize and restore a dashboard

1. The user opens Global Settings.
2. The user changes one or more preferences.
3. Changes preview immediately.
4. The system writes validated settings to `localStorage`.
5. On the next visit, the system restores preferences before normal saving begins.

### Upload a background

1. The user selects Image as the background type.
2. The user chooses a PNG, JPG/JPEG, or SVG file.
3. The system rejects unsupported files and files larger than 1.5 MB.
4. The browser reads the accepted file as a data URL.
5. The system previews and persists the image locally.
6. The user can reset to the current style/theme background.

## 6. Data model

### Clock entry

| Field | Purpose |
| --- | --- |
| `id` | Stable card and map-pin identity |
| `city`, `country` | User-facing location label |
| `timezone` | IANA timezone used for formatting |
| `latitude`, `longitude` | Optional map-pin coordinates |
| `bgColor`, `textColor`, `metaColor` | Optional card overrides |
| `isLocal` | Optional explicit local-card designation |
| `scale` | Optional card size multiplier |

### Settings

Settings include typography, layout, add-card behavior, UI style, light/dark mode,
card corner radius, dashboard background, map visibility/defaults/colors, and
language. See [Architecture](architecture.md#persistence) for storage boundaries.

## 7. Error behavior

| Condition | Expected result |
| --- | --- |
| Location search fails | Show search-unavailable feedback and retain timezone search |
| Primary timezone resolver fails | Try the Open-Meteo fallback |
| All map resolvers fail | Show a localized map-time error |
| Fullscreen request fails | Show localized fullscreen feedback |
| Invalid saved data | Ignore or constrain the invalid value |
| Unsupported background image | Reject it and list supported formats |
| Background image exceeds 1.5 MB | Reject it and show the size limit |
| Browser storage write fails | Keep the current in-memory state and show save feedback |

## 8. Non-functional requirements

- The application shall run on Node.js 20.9 or newer.
- TypeScript strict mode and the production build shall pass before release.
- Existing clocks shall continue locally when network services are unavailable.
- Map attribution shall remain visible.
- Interactive controls shall retain labels suitable for assistive technology.
- Motion-sensitive users shall receive reduced animation where supported.
- No API credential shall be required for the current provider configuration.

## 9. Acceptance test matrix

| ID | Scenario | Expected result |
| --- | --- | --- |
| AT-1 | Add Rome from search | Rome card appears and persists after reload |
| AT-2 | Drag Rome after Dublin | Order changes and remains after reload |
| AT-3 | Select Rome city pin | Rome card scrolls into view and remains highlighted |
| AT-4 | Select an arbitrary map point | City highlight clears and location time appears |
| AT-5 | Change city-pin color | All city pins update and setting persists |
| AT-6 | Select Coke + Dark | Rounded red presentation UI appears |
| AT-7 | Select Coke + Light | White/red rounded presentation UI appears |
| AT-8 | Set card corners to 0 | All city cards have sharp corners |
| AT-9 | Upload supported image under limit | Background previews and survives reload |
| AT-10 | Upload unsupported or oversized image | File is rejected with localized feedback |
| AT-11 | Reset background | Active style/theme background returns |
| AT-12 | Disable network after clocks load | Existing clocks continue ticking locally |

## 10. Change-control checklist

Before approving a feature change:

1. Identify affected functional requirements and workflows.
2. Update acceptance tests and training exercises.
3. Confirm migration behavior for existing `localStorage` data.
4. Review all three languages.
5. Run `npm run check`.
6. Manually exercise affected browser APIs and external-service failures.
7. Update the user guide, architecture notes, and this FDD.

