# Training materials

This guide supports instructor-led sessions and self-paced onboarding for World
Clock Dashboard. It complements the [User guide](user-guide.md) and
[Functional Design Document](functional-design-document.md).

## Training outcomes

After completing the material, learners should be able to:

- build and save a multi-city dashboard;
- customize cards, layouts, backgrounds, and UI styles;
- use city pins and arbitrary map locations correctly;
- operate presentation mode;
- explain local persistence and external-service boundaries;
- run, validate, and safely modify the project as a contributor.

## Suggested audiences and duration

| Track | Audience | Duration |
| --- | --- | --- |
| User essentials | Dashboard users and presenters | 30 minutes |
| Advanced customization | Power users and display owners | 30 minutes |
| Operations | Local-display and deployment operators | 30 minutes |
| Contributor onboarding | Developers and testers | 60–90 minutes |

## Module 1: User essentials

### Demonstration

1. Open the dashboard.
2. Add New York and Tokyo.
3. Reorder the cards.
4. Right-click a card and resize it.
5. Reload and verify persistence.

### Learner exercise

Create a dashboard for a team based in Rome that works with colleagues in Dublin,
New York, and Tokyo. Arrange the cards west-to-east and mark the learner's timezone
as local.

### Success criteria

- Four intended cities are visible.
- Card order matches the requested sequence.
- One card carries the local-timezone badge.
- Reloading retains the setup.

## Module 2: Map and pin interaction

### Demonstration

1. Show the distinction between city pins and the selected-location pin.
2. Select a city pin and observe the matching card highlight.
3. Select a free map point and observe the city highlight clear.
4. Change map-pin and card-highlight colors.
5. Reset map colors.

### Learner exercise

Select the Tokyo pin, confirm its card remains highlighted, then select a point in
the Pacific Ocean and identify the resulting timezone or error state.

### Knowledge check

1. When does a city-card highlight end?
2. Why might a timezone-only clock initially have no pin?
3. Which service provides map tiles?

Answers: (1) when another city pin or arbitrary map point is selected; (2) it may
need a background coordinate lookup; (3) OpenStreetMap.

## Module 3: Appearance and employee presentation

### Demonstration

1. Compare Terminal, Classic, and Coke UI styles.
2. Switch each style between light and dark.
3. Set city-card corners to 0, 18, and 48 pixels.
4. Return corners to the style default.
5. Enter fullscreen presentation mode.

### Learner exercise

Prepare a Coke Dark employee dashboard with four cards per row, 28-pixel corners,
and a distraction-free fullscreen layout. Then create a Coke Light variant.

### Discussion

- UI style controls component shape and visual language.
- Light/dark mode controls brightness independently.
- Explicit corner settings override the UI style default.
- Coke defaults to a rounded, red presentation design.

## Module 4: Background customization

### Demonstration

1. Select a solid background.
2. Create a two-color gradient and change its angle.
3. Apply an image URL.
4. Upload one PNG, JPG/JPEG, or SVG image smaller than 1.5 MB.
5. Reset to the theme background.

### Learner exercise

Create a 135-degree gradient, then replace it with a local image and verify the
background survives a reload.

### Safety and privacy notes

- Local files are encoded and saved in the browser's site storage.
- Image URLs are requested from the remote host and can reveal the viewer's IP
  address to that host.
- Do not upload confidential or personal imagery to shared browser profiles.
- Clearing `wc-settings` removes the saved local background reference.

## Module 5: Operations

### Local display checklist

1. Install the lockfile versions with `npm ci`.
2. Run `npm run check`.
3. Start with `npm start` after a production build.
4. Confirm port 3000 is reachable from the intended display.
5. Confirm outbound access to the services listed in
   [Architecture](architecture.md#external-services).
6. Verify browser storage, fullscreen, and map attribution.

### Failure drills

- Block the network and confirm existing clocks keep ticking.
- Block TimeAPI and verify fallback/error behavior.
- Disable site storage and observe save feedback.
- Attempt an oversized background upload and confirm rejection.

## Module 6: Contributor onboarding

### Repository tour

| Area | Training focus |
| --- | --- |
| `app/page.tsx` | State, workflows, persistence, dialogs, and cards |
| `app/LeafletWorldMap.tsx` | Leaflet lifecycle, markers, and callbacks |
| `app/lib/clock.ts` | Timezone formatting and formatter caching |
| `app/lib/services.ts` | External requests and validation |
| `app/lib/i18n.ts` | Translation-key completeness |
| `app/globals.css` | UI styles, themes, responsive layout, and motion |

### Guided change

Add one non-destructive dashboard preference:

1. Define a constrained state value and safe default.
2. Validate it during restoration.
3. Persist it only after restoration completes.
4. Add controls and translations for all languages.
5. Implement styles without breaking Terminal, Classic, or Coke.
6. Update the FDD and user guide.
7. Run `npm run check`.

### Review questions

1. Why does saving wait for `isRestored`?
2. Why is Leaflet imported dynamically?
3. Which data remains functional without network access?
4. What must happen when a persisted setting is invalid?
5. Which documents need updates for a user-facing feature?

Expected answers:

1. To avoid overwriting saved preferences with initial defaults.
2. Leaflet requires browser APIs and should not initialize during server rendering.
3. Existing clocks can format time locally with `Intl`.
4. The value must be ignored, constrained, or replaced with a safe default.
5. At minimum the user guide and FDD; architecture and training when relevant.

## Facilitator checklist

Before training:

- use a clean browser profile or clear `wc-clocks` and `wc-settings`;
- verify the development or production server is available;
- verify external providers are reachable;
- prepare supported and oversized sample images;
- confirm fullscreen is permitted by the browser;
- choose examples relevant to the learners' locations.

After training:

- collect unresolved questions;
- record confusing workflows as documentation or UX issues;
- update exercises when functional requirements change;
- avoid collecting browser-storage contents from learners.

## Completion assessment

A learner passes the practical assessment when they can independently:

1. create and persist a four-city dashboard;
2. select a city pin and explain the persistent card highlight;
3. apply Coke Light or Coke Dark and adjust card corners;
4. apply and reset a supported background;
5. enter and exit presentation mode;
6. explain what is stored locally and which functions require the network.

