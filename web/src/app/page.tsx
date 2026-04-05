'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  FolderOpen,
  Users,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { SectionCard, StatusBadge, ProgressBar, EmptyState } from '@/components/ui';
import type { ProjectSummary } from '@/lib/types';

export default function DashboardPage() {
  const { projects, neighbors, hydrate, projectSummaries } = useStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const summaries = projectSummaries();

  const totalProjects = projects.length;
  const totalNeighbors = neighbors.length;
  const totalSent = neighbors.filter((n) =>
    ['sent', 'delivered', 'read', 'responded', 'protested', 'no_response'].includes(n.notification_status)
  ).length;
  const totalProtests = neighbors.filter((n) => n.notification_status === 'protested').length;
  const totalResponded = neighbors.filter((n) =>
    ['responded', 'protested', 'no_response'].includes(n.notification_status)
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Oversikt over alle nabovarsel-prosjekter
          </p>
        </div>
        <Link
          href="/prosjekter/ny"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nytt prosjekt
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={FolderOpen} label="Prosjekter" value={totalProjects} color="text-blue-600 bg-blue-50" />
        <StatCard icon={Users} label="Naboer" value={totalNeighbors} color="text-purple-600 bg-purple-50" />
        <StatCard icon={Send} label="Sendt" value={totalSent} color="text-green-600 bg-green-50" />
        <StatCard icon={CheckCircle2} label="Besvart" value={totalResponded} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={AlertTriangle} label="Protester" value={totalProtests} color="text-red-600 bg-red-50" />
      </div>

      <SectionCard
        title="Prosjekter"
        action={
          <Link href="/prosjekter" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Se alle →
          </Link>
        }
      >
        {summaries.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-12 w-12" />}
            title="Ingen prosjekter ennå"
            description="Opprett ditt første nabovarsel-prosjekt for å komme i gang."
            action={
              <Link
                href="/prosjekter/ny"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nytt prosjekt
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {summaries.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-lg p-2 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function ProjectRow({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/prosjekter/${project.id}`}
      className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h4>
          <StatusBadge status={project.status} />
        </div>
        <p className="mt-1 text-sm text-gray-500 truncate">
          {project.kommune_navn && `${project.kommune_navn} – `}
          {project.gnr}/{project.bnr}
          {project.address && ` – ${project.address}`}
        </p>
      </div>
      <div className="ml-4 flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span>{project.neighbor_count}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Send className="h-4 w-4" />
          <span>{project.sent_count}</span>
        </div>
        {project.protested_count > 0 && (
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{project.protested_count}</span>
          </div>
        )}
        {project.deadline && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{new Date(project.deadline).toLocaleDateString('nb-NO')}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
