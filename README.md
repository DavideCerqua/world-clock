# World Clock Dashboard

A customizable world clock dashboard built with Next.js, React, TypeScript, and Leaflet. It is designed for desktop dashboards, wall displays, and presentation mode.

## Preview

<img width="1577" height="840" alt="image" src="https://github.com/user-attachments/assets/bd091bd0-da41-43ae-9d0c-f966dd188cea" />


## Features

- Search for cities and countries worldwide.
- Request browser location on load to add or update a current-location clock and
  map default, including reverse-geocoded city naming and a user-icon map pin.
- Reorder clock cards with drag and drop.
- Customize card colors, corner shapes, typography, theme, UI style, background,
  map colors, and grid layout.
- Save clocks and preferences locally between browser sessions.
- Optionally sign in with Google or GitHub to synchronize the dashboard through
  a user-isolated Supabase database record.
- Use an interactive map to inspect the local time at any location.
- Select city pins to locate and highlight their matching clock cards.
- Configure the map's default city and zoom level.
- Run a distraction-free fullscreen presentation mode.
- Update clocks locally every second without polling a time service.

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Cloud accounts are optional. Follow
[Authentication and cloud synchronization](docs/authentication-and-sync.md) to
configure a free Supabase project and OAuth providers.

For a production build:

```bash
npm run check
npm start
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 3000 |
| `npm run typecheck` | Validate TypeScript without emitting files |
| `npm run build` | Create an optimized production build |
| `npm run check` | Run the typecheck and production build |
| `npm start` | Serve the production build on port 3000 |

## Project structure

```text
app/
├── hooks/                 Reusable React hooks
├── lib/                   Domain types, constants, formatting, and services
├── LeafletWorldMap.tsx    Client-side interactive map
├── page.tsx               Dashboard UI and state orchestration
├── layout.tsx             Application shell and metadata
└── globals.css            Theme and component styles
```

## Documentation

Extended documentation is available in [`docs/`](docs/README.md):

- [User guide](docs/user-guide.md)
- [Architecture](docs/architecture.md)
- [Development and deployment](docs/development.md)
- [Authentication and synchronization](docs/authentication-and-sync.md)
- [GDPR and geolocation](docs/gdpr-and-geolocation.md)
- [Functional Design Document](docs/functional-design-document.md)
- [Training materials](docs/training-materials.md)

## Data and privacy

Anonymous dashboard preferences are stored only in the browser's `localStorage`.
Signed-in users also store their dashboard in a private Supabase row protected by
Row Level Security. City search uses Open-Meteo's geocoding service. Map tiles come
from OpenStreetMap, and coordinate timezone resolution uses TimeAPI with an
Open-Meteo fallback. See [GDPR and geolocation](docs/gdpr-and-geolocation.md) for
the location-data flow and deployment responsibilities.

Map data is © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) and displayed with [Leaflet](https://leafletjs.com/). Keep the on-map OpenStreetMap attribution visible when redistributing the application.

## Deployment

The application can run on any platform that supports Next.js and Node.js. Both development and production servers bind to `0.0.0.0:3000`, which also makes the project suitable for a Raspberry Pi or local-network display. Internet deployments must use HTTPS; browser geolocation is restricted to secure contexts. Production responses include CSP, framing, MIME-sniffing, referrer, and browser-permission security headers.

## Contributing

Bug reports and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes. Please report security issues using the private process in [SECURITY.md](SECURITY.md).

## License

Released under the [MIT License](LICENSE).
