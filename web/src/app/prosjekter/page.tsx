'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Send, AlertTriangle, Clock, Search } from 'lucide-react';
import { useStore } from '@/lib/store';
import { SectionCard, StatusBadge, EmptyState } from '@/components/ui';
import type { ProjectSummary } from '@/lib/types';
import { useState } from 'react';

export default function ProsjekterPage() {
  const { hydrate, projectSummaries } = useStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const summaries = projectSummaries();
  const filtered = search
    ? summaries.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.address?.toLowerCase().includes(search.toLowerCase()) ||
          p.kommune_navn?.toLowerCase().includes(search.toLowerCase())
      )
    : summaries;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prosjekter</h1>
          <p className="mt-1 text-sm text-gray-500">Administrer dine nabovarsel-prosjekter</p>
        </div>
        <Link
          href="/prosjekter/ny"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nytt prosjekt
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Søk prosjekter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <SectionCard>
          <EmptyState
            title={search ? 'Ingen resultater' : 'Ingen prosjekter ennå'}
            description={
              search
                ? 'Prøv et annet søkeord.'
                : 'Opprett ditt første nabovarsel-prosjekt.'
            }
            action={
              !search ? (
                <Link
                  href="/prosjekter/ny"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Nytt prosjekt
                </Link>
              ) : undefined
            }
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/prosjekter/${project.id}`}>
      <SectionCard className="hover:border-blue-200 hover:shadow-md transition-all cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 truncate pr-2">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {project.kommune_navn && `${project.kommune_navn} – `}
          {project.gnr}/{project.bnr}
          {project.address && (
            <>
              <br />
              {project.address}
            </>
          )}
        </p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-gray-50 p-2">
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <Users className="h-3.5 w-3.5" />
              <span className="text-lg font-bold">{project.neighbor_count}</span>
            </div>
            <p className="text-xs text-gray-500">Naboer</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <Send className="h-3.5 w-3.5" />
              <span className="text-lg font-bold">{project.sent_count}</span>
            </div>
            <p className="text-xs text-gray-500">Sendt</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <div className="flex items-center justify-center gap-1 text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-lg font-bold">{project.protested_count}</span>
            </div>
            <p className="text-xs text-gray-500">Protester</p>
          </div>
        </div>

        {project.deadline && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            Frist: {new Date(project.deadline).toLocaleDateString('nb-NO')}
          </div>
        )}
      </SectionCard>
    </Link>
  );
}
