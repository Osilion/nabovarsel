// ============================================================
// Kartverket / Matrikkel API wrapper
// Fetches property data and neighboring units
// ============================================================

import type { MatrikkelUnit } from '../types';

const MATRIKKEL_BASE = 'https://ws.geonorge.no/adresser/v1';

export async function searchAddress(query: string): Promise<MatrikkelUnit[]> {
  try {
    const res = await fetch(
      `${MATRIKKEL_BASE}/sok?sok=${encodeURIComponent(query)}&treffPerSide=10`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.adresser ?? []).map((a: Record<string, unknown>) => ({
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
    }));
  } catch {
    return [];
  }
}

export async function getNeighboringUnits(
  kommuneNr: string,
  gnr: number,
  bnr: number
): Promise<MatrikkelUnit[]> {
  // TODO: Replace with real Matrikkel neighbor lookup API when available
  // For now, searches nearby addresses in the same municipality
  try {
    const res = await fetch(
      `${MATRIKKEL_BASE}/sok?kommunenummer=${kommuneNr}&gardsnummer=${gnr}&treffPerSide=20`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.adresser ?? [])
      .filter((a: Record<string, unknown>) => Number(a.bruksnummer) !== bnr)
      .map((a: Record<string, unknown>) => ({
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
      }));
  } catch {
    return [];
  }
}

export async function lookupProperty(
  kommuneNr: string,
  gnr: number,
  bnr: number
): Promise<MatrikkelUnit | null> {
  try {
    const res = await fetch(
      `${MATRIKKEL_BASE}/sok?kommunenummer=${kommuneNr}&gardsnummer=${gnr}&bruksnummer=${bnr}&treffPerSide=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.adresser?.[0];
    if (!a) return null;
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
  } catch {
    return null;
  }
}
