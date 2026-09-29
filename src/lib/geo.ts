/**
 * Small, dependency-free helpers for the venue map pin.
 *
 * Owners don't know their latitude/longitude, so the Settings screen accepts
 * whatever they can actually get: coordinates copied from Google Maps
 * ("26.4780, 80.3319"), a full Google Maps link, or the browser's location.
 * No Google API key is needed for any of this.
 */

export type LatLng = { lat: number; lng: number };

export type PinParseResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: "empty" | "short_link" | "unrecognised" | "out_of_range" };

/** Kanpur city centre — only used for a "is this pin plausible?" warning. */
export const KANPUR_CENTER: LatLng = { lat: 26.4499, lng: 80.3319 };

const NUM = String.raw`-?\d{1,3}(?:\.\d+)?`;

function inRange(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/** Round to the 6 decimals the database column stores (~0.1 m). */
export function round6(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Accepts:
 *   - "26.4780, 80.3319"  /  "26.4780 80.3319"  /  "(26.4780, 80.3319)"
 *   - https://www.google.com/maps/place/Turf/@26.4780,80.3319,17z/data=!3d26.4781!4d80.3320
 *   - https://www.google.com/maps?q=26.4780,80.3319   (also ?ll= / ?query= / ?destination=)
 * When a link has both a place pin (!3d..!4d..) and a map-view centre (@..),
 * the place pin wins — the "@" part is just where the map happened to be
 * scrolled to, which can be a street away from the venue.
 *
 * Short share links (maps.app.goo.gl, goo.gl/maps) hide the coordinates
 * behind a redirect the browser can't follow, so they get their own reason
 * and the UI can tell the owner exactly what to do instead.
 */
export function parsePinInput(raw: string): PinParseResult {
  const text = raw.trim();
  if (!text) return { ok: false, reason: "empty" };

  if (/(?:maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(text)) return { ok: false, reason: "short_link" };

  const candidates: RegExp[] = [
    new RegExp(String.raw`!3d(${NUM})!4d(${NUM})`), // exact place pin
    new RegExp(String.raw`@(${NUM}),(${NUM})`), // map-view centre
    new RegExp(String.raw`[?&](?:q|ll|query|destination|center)=(${NUM})(?:,|%2C)\s*(${NUM})`, "i"),
    new RegExp(String.raw`^\(?\s*(${NUM})\s*[,;\s]\s*(${NUM})\s*\)?$`), // bare "lat, lng"
  ];

  for (const re of candidates) {
    const m = re.exec(text);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (!inRange(lat, lng)) return { ok: false, reason: "out_of_range" };
    return { ok: true, lat: round6(lat), lng: round6(lng) };
  }
  return { ok: false, reason: "unrecognised" };
}

export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function mapsLink({ lat, lng }: LatLng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function formatPin({ lat, lng }: LatLng) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}