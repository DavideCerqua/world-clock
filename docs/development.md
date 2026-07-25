# Development and deployment

## Prerequisites

- Node.js 20.9 or newer
- npm 10 or newer
- A modern browser

The application currently requires no environment variables. Keep `.env.example`
up to date if that changes.

## Local development

Install the exact dependency versions recorded in the lockfile:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The development server binds to `0.0.0.0`, so it can
also be reached from another device on the local network when the host firewall
allows port 3000.

## Validation

Run the complete project check before submitting or deploying a change:

```bash
npm run check
```

This runs the TypeScript compiler without emitting files and then creates an
optimized Next.js production build. The project does not currently define an
automated test or lint script, so exercise affected UI behavior manually as well.

Useful manual checks include:

- adding, reordering, resizing, recoloring, and removing a clock;
- reloading and confirming clocks and settings are restored;
- searching in each supported language;
- selecting a map point and checking primary/fallback error handling;
- changing the map default and zoom;
- switching themes and UI styles; and
- entering and leaving presentation mode.

## Production

Build and start the production server:

```bash
npm run build
npm start
```

The production server listens on `0.0.0.0:3000`. Put it behind a TLS-terminating
reverse proxy for an internet-facing deployment. The Fullscreen API and browser
storage work best in a secure context.

Do not cache the HTML indefinitely when deploying new releases. Next.js-generated
immutable assets can use long-lived caching because their names are content hashed.

## Network requirements

The browser, rather than the Next.js server, contacts map, geocoding, timezone,
and font providers. Content Security Policy or network
allowlists must permit the hosts identified in
[Architecture](architecture.md#external-services).

If the deployment must work without internet access, existing clocks can still be
formatted locally, but location search, map tiles, coordinate lookup, synchronized
map time, and remote font loading will be unavailable.

## Troubleshooting

### Saved settings do not appear

Confirm that browser storage is enabled for the site and that the application is
being opened from the same origin. Storage is scoped by scheme, host, and port.

### Search or map selection fails

Check the browser network panel for blocked or failed requests to the external
services. Ad blockers, DNS filters, CSP headers, firewalls, or provider outages can
cause these failures.

### The map is blank or incorrectly sized

Confirm OpenStreetMap tiles are reachable, Leaflet CSS is loaded, and the map
container has a non-zero rendered size. Browser console errors usually distinguish
a tile-network problem from an initialization problem.

### A timezone is missing

Supported timezone names come from `Intl.supportedValuesOf("timeZone")` when the
runtime provides it. Upgrade the browser or runtime if its timezone database is
outdated.
