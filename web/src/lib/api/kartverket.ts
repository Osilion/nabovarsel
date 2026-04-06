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

// ---------- Polygon-based types ----------

type Coord = [number, number]; // [lng, lat]
type Ring = Coord[];
type Polygon = Ring[]; // outer ring + optional holes

interface PropertyFeature {
  kommune_nr: string;
  gnr: number;
  bnr: number;
  fnr?: number;
  snr?: number;
  polygon: Polygon;
  representasjonspunkt?: { lat: number; lng: number };
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

    // GeoJSON FeatureCollection response
    const feature = data?.features?.[0];
    const repPunkt = feature?.properties?.representasjonspunkt;
    if (!repPunkt) return null;

    return {
      lat: repPunkt.nord,
      lng: repPunkt.øst,
      area_m2: feature?.properties?.areal,
    };
  } catch {
    return null;
  }
}

/**
 * Get the polygon boundary for a property.
 */
async function getPropertyPolygon(
  kommuneNr: string,
  gnr: number,
  bnr: number,
  fnr?: number,
): Promise<PropertyFeature | null> {
  try {
    let url = `${EIENDOM_API}/geokoding?omrade=true&kommunenummer=${kommuneNr}&gardsnummer=${gnr}&bruksnummer=${bnr}`;
    if (fnr) url += `&festenummer=${fnr}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const feature = data?.features?.[0];
    if (!feature?.geometry?.coordinates) return null;

    const props = feature.properties ?? {};
    return {
      kommune_nr: String(props.kommunenummer ?? kommuneNr),
      gnr: Number(props.gardsnummer ?? gnr),
      bnr: Number(props.bruksnummer ?? bnr),
      fnr: props.festenummer ? Number(props.festenummer) : undefined,
      polygon: feature.geometry.coordinates as Polygon,
      representasjonspunkt: props.representasjonspunkt
        ? { lat: props.representasjonspunkt.nord, lng: props.representasjonspunkt.øst }
        : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Get nearby property polygons using the /punkt/omrader endpoint.
 */
async function getNearbyPropertyPolygons(
  lat: number,
  lng: number,
  radius: number = 200,
): Promise<PropertyFeature[]> {
  try {
    const res = await fetch(
      `${EIENDOM_API}/punkt/omrader?nord=${lat}&ost=${lng}&koordsys=4258&radius=${radius}&maksTreff=100`
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data?.features ?? [])
      .filter((f: Record<string, unknown>) => {
        const geom = f.geometry as Record<string, unknown> | undefined;
        return geom?.coordinates;
      })
      .map((f: Record<string, unknown>) => {
        const props = (f.properties ?? {}) as Record<string, unknown>;
        const geom = f.geometry as Record<string, unknown>;
        const repPunkt = props.representasjonspunkt as Record<string, number> | undefined;
        return {
          kommune_nr: String(props.kommunenummer ?? ''),
          gnr: Number(props.gardsnummer ?? 0),
          bnr: Number(props.bruksnummer ?? 0),
          fnr: props.festenummer ? Number(props.festenummer) : undefined,
          snr: props.seksjonsnummer ? Number(props.seksjonsnummer) : undefined,
          polygon: geom.coordinates as Polygon,
          representasjonspunkt: repPunkt
            ? { lat: repPunkt.nord, lng: repPunkt.øst }
            : undefined,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Find all properties near a geographic point (simple list, no polygons).
 */
export async function getPropertiesNearPoint(
  lat: number,
  lng: number,
  radius: number = 100
): Promise<MatrikkelUnit[]> {
  try {
    const res = await fetch(
      `${EIENDOM_API}/punkt?nord=${lat}&ost=${lng}&koordsys=4258&radius=${radius}&treffPerSide=50`
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data?.eiendom ?? []).map((e: Record<string, unknown>) => {
      const repPunkt = e.representasjonspunkt as Record<string, number> | undefined;
      return {
        kommune_nr: String(e.kommunenummer ?? ''),
        gnr: Number(e.gardsnummer ?? 0),
        bnr: Number(e.bruksnummer ?? 0),
        fnr: e.festenummer ? Number(e.festenummer) : undefined,
        snr: e.seksjonsnummer ? Number(e.seksjonsnummer) : undefined,
        address: undefined,
        coordinates: repPunkt
          ? { lat: repPunkt.nord, lng: repPunkt.øst }
          : undefined,
      };
    });
  } catch {
    return [];
  }
}

// ---------- Neighbor Discovery (polygon adjacency) ----------

/**
 * Find actual adjacent/bordering properties for a matrikkel unit.
 *
 * Strategy:
 * 1. Get source property polygon via /geokoding?omrade=true
 * 2. Get all nearby property polygons via /punkt/omrader
 * 3. Check polygon adjacency – only properties whose boundary
 *    is within ~5m of the source boundary are true neighbors
 * 4. Enrich with addresses and distance
 */
export async function getNeighboringUnits(
  kommuneNr: string,
  gnr: number,
  bnr: number,
  fnr?: number,
): Promise<MatrikkelUnit[]> {
  // Step 1: Get source property polygon
  const sourcePoly = await getPropertyPolygon(kommuneNr, gnr, bnr, fnr);

  if (!sourcePoly?.polygon || !sourcePoly.representasjonspunkt) {
    // Fallback if polygon unavailable
    return getNeighborsByAddress(kommuneNr, gnr, bnr);
  }

  const sourceCenter = sourcePoly.representasjonspunkt;

  // Step 2: Get nearby property polygons (200m radius to catch all adjacent)
  const nearbyPolygons = await getNearbyPropertyPolygons(
    sourceCenter.lat,
    sourceCenter.lng,
    200
  );

  // Step 3: Filter – exclude source property, deduplicate by gnr/bnr
  const seen = new Set<string>();
  const sourceKey = `${kommuneNr}-${gnr}-${bnr}`;
  seen.add(sourceKey);

  const candidates = nearbyPolygons.filter((p) => {
    const key = `${p.kommune_nr}-${p.gnr}-${p.bnr}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Step 4: Check adjacency – polygon boundaries within 5m of each other
  const ADJACENCY_THRESHOLD_M = 5;
  const sourceRing = sourcePoly.polygon[0]; // outer ring

  const adjacent = candidates.filter((candidate) => {
    const candidateRing = candidate.polygon[0];
    if (!candidateRing || !sourceRing) return false;
    return polygonsAreAdjacent(sourceRing, candidateRing, ADJACENCY_THRESHOLD_M);
  });

  // Step 5: Enrich with addresses and distance from center
  const enriched = await Promise.all(
    adjacent.map(async (unit) => {
      const address = await getAddressForProperty(unit.kommune_nr, unit.gnr, unit.bnr);
      const distance = unit.representasjonspunkt
        ? haversineDistance(
            sourceCenter.lat, sourceCenter.lng,
            unit.representasjonspunkt.lat, unit.representasjonspunkt.lng
          )
        : undefined;

      return {
        kommune_nr: unit.kommune_nr,
        gnr: unit.gnr,
        bnr: unit.bnr,
        fnr: unit.fnr,
        snr: unit.snr,
        address: address ?? undefined,
        coordinates: unit.representasjonspunkt,
        distance_meters: distance ? Math.round(distance) : undefined,
      } as MatrikkelUnit;
    })
  );

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

// ---------- Polygon Adjacency ----------

/**
 * Check if two polygon rings are adjacent (share a boundary within threshold).
 * Samples points along each ring and checks minimum distance.
 */
function polygonsAreAdjacent(
  ringA: Ring,
  ringB: Ring,
  thresholdMeters: number
): boolean {
  // Sample points along ring A's edges
  const pointsA = sampleRingPoints(ringA, 5); // sample every ~5m along edges

  // For each sampled point on A, check distance to closest edge on B
  for (const pt of pointsA) {
    if (pointToRingDistance(pt, ringB) < thresholdMeters) {
      return true;
    }
  }
  return false;
}

/**
 * Sample points along a polygon ring at approximately the given interval in meters.
 */
function sampleRingPoints(ring: Ring, intervalMeters: number): Coord[] {
  const points: Coord[] = [];

  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    const edgeLen = haversineDistance(a[1], a[0], b[1], b[0]);
    const samples = Math.max(1, Math.ceil(edgeLen / intervalMeters));

    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      points.push([
        a[0] + t * (b[0] - a[0]),
        a[1] + t * (b[1] - a[1]),
      ]);
    }
  }

  return points;
}

/**
 * Minimum distance from a point to any edge of a polygon ring, in meters.
 */
function pointToRingDistance(pt: Coord, ring: Ring): number {
  let minDist = Infinity;

  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    const dist = pointToSegmentDistance(pt, a, b);
    if (dist < minDist) minDist = dist;
  }

  return minDist;
}

/**
 * Approximate distance from point P to line segment AB, in meters.
 * Works in lat/lng by projecting to a local flat coordinate system.
 */
function pointToSegmentDistance(p: Coord, a: Coord, b: Coord): number {
  // Convert to flat meters (approximate, good enough for small distances)
  const cosLat = Math.cos(toRad(p[1]));
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * cosLat;

  const px = (p[0] - a[0]) * mPerDegLng;
  const py = (p[1] - a[1]) * mPerDegLat;
  const bx = (b[0] - a[0]) * mPerDegLng;
  const by = (b[1] - a[1]) * mPerDegLat;

  const lenSq = bx * bx + by * by;
  if (lenSq === 0) {
    // A and B are the same point
    return Math.sqrt(px * px + py * py);
  }

  // Project P onto AB, clamped to [0,1]
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / lenSq));
  const projX = t * bx;
  const projY = t * by;

  const dx = px - projX;
  const dy = py - projY;
  return Math.sqrt(dx * dx + dy * dy);
}
