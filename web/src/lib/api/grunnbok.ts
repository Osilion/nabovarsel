// ============================================================
// Grunnbok API wrapper (placeholder)
// Will fetch owner data from the Norwegian land registry
// ============================================================

import type { GrunnbokEntry, MatrikkelUnit } from '../types';
import { MOCK_GRUNNBOK_ENTRIES } from '../mock-data';

/**
 * Fetch owner information for a matrikkel unit from Grunnboken.
 *
 * TODO: Replace with real API when access is granted.
 * The real API will be at something like:
 *   https://api.kartverket.no/grunnbok/v1/eiendommer/{kommuneNr}/{gnr}/{bnr}
 *
 * Authentication will likely be via Maskinporten (OAuth2 machine-to-machine).
 */
export async function getOwners(unit: MatrikkelUnit): Promise<GrunnbokEntry | null> {
  // Mock implementation
  const entry = MOCK_GRUNNBOK_ENTRIES.find(
    (e) =>
      e.matrikkel_unit.kommune_nr === unit.kommune_nr &&
      e.matrikkel_unit.gnr === unit.gnr &&
      e.matrikkel_unit.bnr === unit.bnr
  );

  if (entry) return entry;

  // Generate a plausible mock for unknown units
  return {
    matrikkel_unit: unit,
    owners: [
      {
        name: `Eier av ${unit.gnr}/${unit.bnr}`,
        type: 'person',
        share: '1/1',
        address: unit.address ?? 'Ukjent adresse',
      },
    ],
  };
}

/**
 * Fetch owners for multiple matrikkel units (batch).
 */
export async function getOwnersForUnits(units: MatrikkelUnit[]): Promise<GrunnbokEntry[]> {
  const results = await Promise.all(units.map(getOwners));
  return results.filter((r): r is GrunnbokEntry => r !== null);
}

/**
 * Look up servitutter (easements) for a property.
 * 
 * TODO: Implement when Grunnbok API is available.
 */
export async function getEasements(
  kommuneNr: string,
  gnr: number,
  bnr: number
): Promise<string[]> {
  // Mock: no easements
  return [];
}
