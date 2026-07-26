# User guide

World Clock Dashboard displays several live clocks in a configurable grid. The
dashboard starts with Rome, Cairo, Sofia, and Dublin, and remembers changes in the
current browser.

## Add and arrange clocks

1. Select the **+** card.
2. Search for a city or country.
3. Select a result to add its clock.
4. Drag a clock card to change its position.

Location search requires an internet connection. The clock itself is formatted in
the browser from the selected IANA timezone and updates once per second.

Right-click a clock card to open its menu. From there you can change its colors,
reset its colors, resize it, mark the local timezone, or remove it. Card scale is
limited to 70–150%.

## Customize the dashboard

Open global settings with the settings button. Available preferences include:

- language (English, Italian, or Spanish);
- font family;
- number of cards per row;
- placement or visibility of the add-clock card;
- terminal or classic interface style;
- light or dark theme; and
- map visibility.

The theme can also be switched directly from the toolbar. Preferences and clock
cards are saved automatically in browser storage.

## Use the daylight map

Select a point on the map to resolve its timezone and show the synchronized local
time. The orange line represents the approximate day/night terminator.

Blue pins represent cities in the clock grid, while the green pin represents the
location selected directly by the user. Select a city pin to scroll to and highlight
its matching clock card. The highlight remains active until another city pin or a
free point on the map is selected.

Use the map settings button to choose the default map location and zoom. Right-click
the map area for a shortcut to hide or show it and to open its settings. Map
settings also let you customize the city-pin, selected-location-pin, and card
highlight colors or reset all three to their defaults.

The base map and timezone lookup require network access. If the primary timezone
resolver is unavailable, the application attempts a fallback service.

## Presentation mode

Use the fullscreen button to enter presentation mode. This uses the browser
Fullscreen API, so the browser may request permission or decline the request.
Exit with the on-screen control or the browser's usual fullscreen shortcut,
typically `Esc`.

## Reset local data

The application does not currently provide a reset-all button. To restore defaults,
remove these keys using the browser's developer tools under Application or Storage:

- `wc-clocks`
- `wc-settings`

Reload the page after removing them. This affects only the current browser profile
and site origin.

## Privacy

Clocks and settings remain in the browser's `localStorage`; the application has no
account system or backend database. Searches and map actions send the necessary
query or coordinates to the external services described in
[Architecture](architecture.md#external-services).
