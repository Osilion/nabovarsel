// ============================================================
// Kartverket / Geonorge API wrappers
// Real API integrations for address search, property lookup,
// and neighbor discovery
// ============================================================

import type { MatrikkelUnit } from '../types';

const ADRESSE_API = 'https://ws.geonorge.no/adresser/v1';
const EIENDOM_API = 'https://api.kartverket.no/eiendom/v1';
const KOMMUNEINFO_API = 'https://ws.geonorge.no/kommuneinfo/v1';

// ---------- Address Search ----------

export async function searchAddress(query: string): Promise<MatrikkelUnit[]> {
  try {
    const res = await fetch(
      `${ADRESSE_API}/sok?sok=${encodeURIComponent(query)}&treffPerSide=10`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.adresser ?? []).map(mapAddressToUnit);
  } catch {
    return [];
  }
}

// ---------- Property Lookup via Eiendom API ----------

/**
 * Get coordinates and area for a specific matrikkel unit.
 * Uses Kartverket's geokoding endpoint.
 */
export async function getPropertyGeometry(
  kommuneNr: string,
  gnr: number,
  bnr: number,
  fnr?: number,
  snr?: number
): Promise<{ lat: number; lng: number; area_m2?: number } | null> {
  try {
    let url = `${EIENDOM_API}/geokoding?kommunenummer=${kommuneNr}&gardsnummer=${gnr}&bruksnummer=${bnr}`;
    if (fnr) url += `&festenummer=${fnr}`;
    if (snr) url += `&seksjonsnummer=${snr}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const coords = data?.representasjonspunkt;
    if (!coords) return null;

    return {
      lat: coords.lat,
      lng: coords.lon,
      area_m2: data?.bruksareal ?? data?.areal,
    };
  } catch {
    return null;
  }
}

/**
 * Find all properties near a geographic point.
 * Returns matrikkel units within a given radius.
 * This is the key API for neighbor discovery.
 */
export async function getPropertiesNearPoint(
  lat: number,
  lng: number,
  radius: number = 100
): Promise<MatrikkelUnit[]> {
  try {
    const res = await fetch(
      `${EIENDOM_API}/punkt?lat=${lat}&lon=${lng}&radius=${radius}&crs=4326`
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data?.eiendommer ?? []).map((e: Record<string, unknown>) => ({
      kommune_nr: String(e.kommunenummer ?? ''),
      gnr: Number(e.gardsnummer ?? 0),
      bnr: Number(e.bruksnummer ?? 0),
      fnr: e.festenummer ? Number(e.festenummer) : undefined,
      snr: e.seksjonsnummer ? Number(e.seksjonsnummer) : undefined,
      address: undefined, // Eiendom API doesn't return addresses
      coordinates: e.representasjonspunkt
        ? {
            lat: (e.representasjonspunkt as Record<string, number>).lat,
            lng: (e.representasjonspunkt as Record<string, number>).lon,
          }
        : undefined,
    }));
  } catch {
    return [];
  }
}

// ---------- Neighbor Discovery (full pipeline) ----------

/**
 * Find actual neighboring properties for a matrikkel unit.
 *
 * Pipeline:
 * 1. Look up source property coordinates via geokoding
 * 2. Search for properties near that point (radius search)
 * 3. Filter out the source property itself
 * 4. Enrich each neighbor with address data
 * 5. Calculate distance from source property
 */
export async function getNeighboringUnits(
  kommuneNr: string,
  gnr: number,
  bnr: number,
  fnr?: number,
  radiusMeters: number = 100
): Promise<MatrikkelUnit[]> {
  // Step 1: Get source property coordinates
  const source = await getPropertyGeometry(kommuneNr, gnr, bnr, fnr);
  if (!source) {
    // Fallback: try address-based lookup
    return getNeighborsByAddress(kommuneNr, gnr, bnr);
  }

  // Step 2: Find properties near the source
  const nearby = await getPropertiesNearPoint(source.lat, source.lng, radiusMeters);

  // Step 3: Filter out the source property
  const neighbors = nearby.filter(
    (u) =>
      !(u.kommune_nr === kommuneNr && u.gnr === gnr && u.bnr === bnr && u.fnr === fnr)
  );

  // Step 4: Deduplicate by gnr/bnr (ignore seksjoner of same eiendom)
  const seen = new Set<string>();
  const unique = neighbors.filter((u) => {
    const key = `${u.kommune_nr}-${u.gnr}-${u.bnr}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Step 5: Enrich with addresses and distances
  const enriched = await Promise.all(
    unique.map(async (unit) => {
      const address = await getAddressForProperty(unit.kommune_nr, unit.gnr, unit.bnr);
      const distance = unit.coordinates
        ? haversineDistance(source.lat, source.lng, unit.coordinates.lat, unit.coordinates.lng)
        : undefined;

      return {
        ...unit,
        address: address ?? unit.address,
        distance_meters: distance ? Math.round(distance) : undefined,
      };
    })
  );

  // Sort by distance
  return enriched.sort((a, b) => (a.distance_meters ?? 999) - (b.distance_meters ?? 999));
}

// ---------- Address Enrichment ----------

/**
 * Find address for a matrikkel unit via the address API.
 */
async function getAddressForProperty(
  kommuneNr: string,
  gnr: number,
  bnr: number
): Promise<string | null> {
  try {
    const res = await fetch(
      `${ADRESSE_API}/sok?kommunenummer=${kommuneNr}&gardsnummer=${gnr}&bruksnummer=${bnr}&treffPerSide=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.adresser?.[0]?.adressetekst ?? null;
  } catch {
    return null;
  }
}

/**
 * Fallback neighbor search using address API when eiendom API fails.
 */
async function getNeighborsByAddress(
  kommuneNr: string,
  gnr: number,
  bnr: number
): Promise<MatrikkelUnit[]> {
  try {
    const res = await fetch(
      `${ADRESSE_API}/sok?kommunenummer=${kommuneNr}&gardsnummer=${gnr}&treffPerSide=30`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.adresser ?? [])
      .filter((a: Record<string, unknown>) => Number(a.bruksnummer) !== bnr)
      .map(mapAddressToUnit);
  } catch {
    return [];
  }
}

// ---------- Kommune Lookup ----------

export async function getKommuneNavn(kommuneNr: string): Promise<string | null> {
  try {
    const res = await fetch(`${KOMMUNEINFO_API}/kommuner/${kommuneNr}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.kommunenavnNorsk ?? data.kommunenavn ?? null;
  } catch {
    return null;
  }
}

// ---------- Single Property Lookup ----------

export async function lookupProperty(
  kommuneNr: string,
  gnr: number,
  bnr: number
): Promise<MatrikkelUnit | null> {
  try {
    // Try eiendom API first for coordinates
    const geo = await getPropertyGeometry(kommuneNr, gnr, bnr);

    // Get address from address API
    const res = await fetch(
      `${ADRESSE_API}/sok?kommunenummer=${kommuneNr}&gardsnummer=${gnr}&bruksnummer=${bnr}&treffPerSide=1`
    );
    const data = res.ok ? await res.json() : null;
    const addr = data?.adresser?.[0];

    return {
      kommune_nr: kommuneNr,
      gnr,
      bnr,
      address: addr?.adressetekst ?? undefined,
      coordinates: geo ? { lat: geo.lat, lng: geo.lng } : undefined,
    };
  } catch {
    return null;
  }
}

// ---------- Helpers ----------

function mapAddressToUnit(a: Record<string, unknown>): MatrikkelUnit {
  return {
    kommune_nr: String(a.kommunenummer ?? ''),
    gnr: Number(a.gardsnummer ?? 0),
    bnr: Number(a.bruksnummer ?? 0),
    fnr: a.festenummer ? Number(a.festenummer) : undefined,
    address: String(a.adressetekst ?? ''),
    coordinates: a.representasjonspunkt
      ? {
          lat: (a.representasjonspunkt as Record<string, number>).lat,
          lng: (a.representasjonspunkt as Record<string, number>).lon,
        }
      : undefined,
  };
}

/**
 * Calculate distance between two lat/lng points in meters (Haversine formula).
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
