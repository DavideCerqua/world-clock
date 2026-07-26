# User guide

World Clock Dashboard displays several live clocks in a configurable grid. The
dashboard starts with Rome, Cairo, Sofia, and Dublin, and remembers changes in the
current browser. City cards use a consistent height by default; the tallest card's
content determines the shared grid height.

## Share the live location

By default, the application asks the browser for location access on each load. Use
**Global Settings → Map → Ask for my location on startup** to disable or re-enable
this behavior. Enabling it during a session requests the location immediately. If
permission is granted, the application:

- obtains the coordinates reported by the device;
- resolves their IANA timezone and current city name;
- adds or updates one **Live location** card;
- marks that card as local; and
- uses the coordinates as the map's default location.

The Live location card shows the resolved city and country in its heading and
moves latitude/longitude into its metadata. The card is inserted first when it is
created. If the user later drags it elsewhere, subsequent location updates preserve
that chosen order.

The browser may remember a previous permission decision and therefore may not show
a new dialog every time. Geolocation normally requires HTTPS, although browsers
allow it on `localhost`. Device, browser, network, and operating-system conditions
determine accuracy; the application cannot guarantee an exact physical position.
If access is denied, times out, or is unavailable, the existing dashboard remains
unchanged.

## Add and arrange clocks

1. Select the **+** card.
2. Search for a city or country.
3. Select a result to add its clock.
4. Drag a clock card to change its position.

Location search requires an internet connection. The clock itself is formatted in
the browser from the selected IANA timezone and updates once per second.

Right-click a clock card to open its menu. From there you can change its colors,
reset its colors, resize it, pin or unpin it, or remove it. Manually marked cards
show a **Pinned location** badge. **Live location** is reserved for the card created
from browser geolocation and cannot be assigned manually. Card scale is limited to
70–150%. Border badges keep a consistent width, height, and text size across all
cards, regardless of card scaling.

## Sign in and synchronize

Open global settings and find **Account**. When cloud synchronization has been
configured by the deployment owner, select Google or GitHub and complete the
provider's consent flow.

Select **Continue as guest** to use the application without an account. Guest
cards and settings remain only in that browser and are not synchronized.

On the first login for a new account, the current browser dashboard is copied to
the account. A returning account restores its existing cloud dashboard.
Subsequent changes are saved locally first and synchronized automatically. If
synchronization fails, the local copy remains available.

Signing out does not delete local or cloud data. Account-data deletion must be
requested from the deployment owner.

## Customize the dashboard

Open global settings with the settings button. Categories start collapsed; select
a category heading to reveal its options. Available preferences include:

- language (English, Italian, or Spanish);
- font family;
- dashboard background using the theme default, a solid color, a configurable
  gradient, an image URL, or a local image upload;
- number of cards per row;
- placement or visibility of the add-clock card;
- terminal, classic, or Coke interface style;
- light or dark mode for every interface style;
- adjustable city-card corner roundness, from sharp to fully rounded;
- and map visibility.

The theme can also be switched directly from the toolbar. Preferences and clock
cards are saved automatically in browser storage.

The Coke style uses a rounded presentation layout with red gradients, glass-like
panels, white display typography, and pill controls. It remains available in both
light and dark modes.

Local PNG, JPG/JPEG, and SVG background images are stored in the current browser
and must be smaller than 1.5 MB. Image URLs remain external and require network
access. Use **Reset background** to return to the background supplied by the
active UI style and light/dark theme.

The **Support** group in global settings links to GitHub Issues for bug reports
and feature requests. The PayPal button opens the maintainer's donation page.
Both destinations open in a new browser tab.

## Use the daylight map

Select a point on the map to resolve its timezone and show the synchronized local
time. The orange line represents the approximate day/night terminator.

Blue pins represent cities in the clock grid. The Live location uses a
person-shaped pin, while a small location marker represents a free point selected
directly on the map. Select any city or user pin to scroll to and highlight its
matching clock card. The highlight remains active until another pin or a free point
on the map is selected.

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

Clocks, coordinates, and settings remain in the browser's `localStorage`; the
application has no account system or backend database. After permission is granted,
the current coordinates are sent to the timezone resolver. Searches and map actions
send the necessary query or coordinates to the external services described in
[Architecture](architecture.md#external-services).
