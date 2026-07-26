# GDPR and geolocation

This document describes the current data flow and gives deployment owners a
practical GDPR checklist. It is technical guidance, not legal advice. The
organization publishing the dashboard remains responsible for its lawful basis
and privacy notice.

## Data collected

When **Ask for my location on startup** is enabled, the browser asks the visitor
for permission. If granted, the application reads latitude and longitude, derives
a city/country label, and resolves the IANA timezone and local time.

The application requests one position during startup. It does not continuously
track the device, build a location history, use a device identifier, or collect
location while the page is closed. A denial leaves the dashboard unchanged.
Location information should be treated as personal data.

## Data flow and recipients

1. The browser supplies coordinates after its native permission prompt.
2. TimeAPI receives them to resolve timezone and local time.
3. BigDataCloud receives them to resolve locality and country.
4. Open-Meteo receives them only if the primary timezone lookup fails.
5. The resulting card and map default are saved in browser `localStorage`.

This repository has no application backend, accounts, database, analytics, or
server-side location log. The deployment host still receives normal HTTP metadata
such as IP address. External providers receive request metadata and coordinates;
operators must review their privacy terms, retention, processor status, and
international-transfer arrangements.

## Purpose, minimisation, and retention

Coordinates are used only to place the live marker, name the locality, and show
its time. Repeated position samples are not retained. The live card is stored
under `wc-clocks`; its preference and default map coordinates are stored under
`wc-settings`.

`localStorage` has no automatic expiry. Data remains until the visitor removes
the relevant data, clears site storage, or the browser removes it. Turning off
startup geolocation prevents future prompts but does not erase saved data.
Visitors can revoke location permission in browser settings.

## Publication responsibilities

Before launch, the operator should:

- publish an accessible notice identifying the controller, contacts, purpose,
  lawful basis, recipients, retention, transfers, rights, and complaint route;
- verify that the toggle and permission flow meet the chosen lawful basis;
  browser permission alone is not a complete GDPR privacy notice;
- offer clear instructions for deleting site data and withdrawing permission;
- deploy through HTTPS, restrict third-party connections, and patch dependencies;
- review TimeAPI, BigDataCloud, Open-Meteo, OpenStreetMap, Google Fonts, and host
  privacy documentation and contracts; and
- assess whether the real use case needs a DPIA, especially when combined with
  employee monitoring or systematic tracking.

Depending on the circumstances, rights can include access, rectification,
erasure, restriction, portability, objection, and regulatory complaint. Clearing
the origin's site data removes the application's local copies. Provider-log
requests must follow the operator's agreements and provider policies.

## Suggested notice text

> If you enable live location, your browser asks for permission and sends your
> coordinates directly to our timezone and reverse-geocoding providers so the
> dashboard can show your city and local time. The resulting card and preference
> are stored in this browser. We do not keep an application database or location
> history. You can disable future requests, revoke browser permission, and clear
> this site's stored data at any time.

Adapt this text to identify the actual controller, providers, lawful basis,
retention, transfers, and contact channels of the deployed service.
