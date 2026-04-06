'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, MapPin, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { SectionCard } from '@/components/ui';
import { searchAddress, getKommuneNavn } from '@/lib/api/kartverket';
import type { MatrikkelUnit, Project } from '@/lib/types';

export default function NyttProsjektPage() {
  const router = useRouter();
  const { addProject } = useStore();

  const [step, setStep] = useState<'search' | 'details'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MatrikkelUnit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<MatrikkelUnit | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [kommuneNavn, setKommuneNavn] = useState('');

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await searchAddress(query);
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSelect(unit: MatrikkelUnit) {
    setSelected(unit);
    setName(`Nabovarsel – ${unit.address || `${unit.gnr}/${unit.bnr}`}`);
    setStep('details');
    // Fetch kommune name in background
    if (unit.kommune_nr) {
      const kn = await getKommuneNavn(unit.kommune_nr);
      if (kn) setKommuneNavn(kn);
    }
  }

  function handleCreate() {
    if (!selected) return;
    const project: Project = {
      id: crypto.randomUUID(),
      user_id: 'mock-user',
      name: name || `Nabovarsel ${selected.gnr}/${selected.bnr}`,
      description,
      kommune_nr: selected.kommune_nr,
      kommune_navn: kommuneNavn,
      gnr: selected.gnr,
      bnr: selected.bnr,
      fnr: selected.fnr,
      address: selected.address,
      status: 'draft',
      deadline: deadline || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addProject(project);
    router.push(`/prosjekter/${project.id}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/prosjekter"
          className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nytt prosjekt</h1>
          <p className="text-sm text-gray-500">
            {step === 'search' ? 'Søk etter eiendom' : 'Fyll inn prosjektdetaljer'}
          </p>
        </div>
      </div>

      {step === 'search' && (
        <SectionCard title="Finn eiendom" description="Søk på adresse, gnr/bnr eller eiendomsnavn">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="F.eks. Storgata 12, Oslo"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {searching ? 'Søker...' : 'Søk'}
              </button>
            </div>

            {results.length > 0 && (
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {results.map((unit, i) => (
                  <button
                    key={`${unit.kommune_nr}-${unit.gnr}-${unit.bnr}-${i}`}
                    onClick={() => handleSelect(unit)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {unit.address || 'Ukjent adresse'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Kommune {unit.kommune_nr} – gnr {unit.gnr} / bnr {unit.bnr}
                        {unit.fnr ? ` / fnr ${unit.fnr}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.length === 0 && query && !searching && (
              <p className="text-center text-sm text-gray-500 py-4">
                Ingen resultater for &quot;{query}&quot;
              </p>
            )}

            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  setSelected({
                    kommune_nr: '',
                    gnr: 0,
                    bnr: 0,
                    address: '',
                  });
                  setStep('details');
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Eller opprett manuelt uten søk →
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'details' && (
        <SectionCard title="Prosjektdetaljer">
          <div className="space-y-4">
            {selected && selected.address && (
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{selected.address}</p>
                  <p className="text-xs text-blue-700">
                    Kommune {selected.kommune_nr} – gnr {selected.gnr} / bnr {selected.bnr}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prosjektnavn</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Kort beskrivelse av byggesaken..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Svarfrist</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('search')}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tilbake
              </button>
              <button
                onClick={handleCreate}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Opprett prosjekt
              </button>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
