'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Send,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  UserPlus,
  Mail,
  FileText,
  MoreVertical,
  Building2,
  User,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { SectionCard, StatusBadge, InfoRow, ProgressBar, EmptyState } from '@/components/ui';
import type { Neighbor, Project } from '@/lib/types';

export default function ProsjektDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const {
    projects,
    neighbors,
    hydrate,
    setCurrentProjectId,
    updateProject,
    removeProject,
    addNeighbor,
    updateNeighbor,
    removeNeighbor,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'neighbors' | 'documents'>('overview');
  const [showAddNeighbor, setShowAddNeighbor] = useState(false);

  useEffect(() => {
    hydrate();
    setCurrentProjectId(projectId);
  }, [hydrate, projectId, setCurrentProjectId]);

  const project = projects.find((p) => p.id === projectId);
  const projectNeighbors = neighbors.filter((n) => n.project_id === projectId);

  if (!project) {
    return (
      <div className="space-y-4">
        <Link href="/prosjekter" className="text-sm text-blue-600 hover:text-blue-700">
          ← Tilbake til prosjekter
        </Link>
        <EmptyState title="Prosjekt ikke funnet" description="Prosjektet eksisterer ikke." />
      </div>
    );
  }

  const sentCount = projectNeighbors.filter((n) =>
    ['sent', 'delivered', 'read', 'responded', 'protested', 'no_response'].includes(n.notification_status)
  ).length;
  const respondedCount = projectNeighbors.filter((n) =>
    ['responded', 'protested', 'no_response'].includes(n.notification_status)
  ).length;
  const protestedCount = projectNeighbors.filter((n) => n.notification_status === 'protested').length;

  async function handleSendAll() {
    const pending = projectNeighbors.filter((n) => n.notification_status === 'pending');
    if (pending.length === 0) return;

    updateProject(projectId, { status: 'sending' });

    for (const neighbor of pending) {
      updateNeighbor(neighbor.id, {
        notification_status: 'sent',
        notification_sent_at: new Date().toISOString(),
        notification_method: 'altinn',
        response_deadline: project?.deadline,
      });
    }

    updateProject(projectId, { status: 'sent' });
  }

  function handleAddManualNeighbor(data: {
    owner_name: string;
    address: string;
    relation_type: string;
    contact_email: string;
  }) {
    const neighbor: Neighbor = {
      id: crypto.randomUUID(),
      project_id: projectId,
      owner_name: data.owner_name,
      address: data.address,
      relation_type: data.relation_type as Neighbor['relation_type'],
      contact_email: data.contact_email,
      notification_status: 'pending',
      source: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addNeighbor(neighbor);
    setShowAddNeighbor(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/prosjekter"
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {project.kommune_navn && `${project.kommune_navn} – `}
              gnr {project.gnr} / bnr {project.bnr}
              {project.address && ` – ${project.address}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSendAll}
            disabled={!projectNeighbors.some((n) => n.notification_status === 'pending')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
            Send alle varsler
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={Users} label="Naboer" value={projectNeighbors.length} />
        <MiniStat icon={Send} label="Sendt" value={sentCount} color="text-green-600" />
        <MiniStat icon={CheckCircle2} label="Besvart" value={respondedCount} color="text-emerald-600" />
        <MiniStat icon={AlertTriangle} label="Protester" value={protestedCount} color="text-red-600" />
      </div>

      {/* Progress */}
      {projectNeighbors.length > 0 && (
        <SectionCard>
          <div className="space-y-3">
            <ProgressBar value={sentCount} max={projectNeighbors.length} label="Sendt" color="bg-blue-600" />
            <ProgressBar value={respondedCount} max={projectNeighbors.length} label="Besvart" color="bg-green-600" />
          </div>
        </SectionCard>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: 'overview', label: 'Oversikt' },
            { key: 'neighbors', label: `Naboer (${projectNeighbors.length})` },
            { key: 'documents', label: 'Dokumenter' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <SectionCard title="Prosjektinfo">
          <InfoRow label="Prosjektnavn" value={project.name} />
          <InfoRow label="Beskrivelse" value={project.description} />
          <InfoRow label="Kommune" value={project.kommune_navn ? `${project.kommune_navn} (${project.kommune_nr})` : project.kommune_nr} />
          <InfoRow label="Gnr/Bnr" value={`${project.gnr}/${project.bnr}`} />
          <InfoRow label="Adresse" value={project.address} />
          <InfoRow label="Status">
            <StatusBadge status={project.status} />
          </InfoRow>
          {project.deadline && (
            <InfoRow label="Svarfrist" value={new Date(project.deadline).toLocaleDateString('nb-NO')} />
          )}
          <InfoRow label="Opprettet" value={new Date(project.created_at).toLocaleDateString('nb-NO')} />
        </SectionCard>
      )}

      {activeTab === 'neighbors' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddNeighbor(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Legg til nabo
            </button>
          </div>

          {showAddNeighbor && (
            <AddNeighborForm
              onAdd={handleAddManualNeighbor}
              onCancel={() => setShowAddNeighbor(false)}
            />
          )}

          {projectNeighbors.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="Ingen naboer lagt til"
                description="Legg til naboer manuelt eller hent fra Grunnboken."
                action={
                  <button
                    onClick={() => setShowAddNeighbor(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Legg til nabo
                  </button>
                }
              />
            </SectionCard>
          ) : (
            <div className="space-y-3">
              {projectNeighbors.map((neighbor) => (
                <NeighborCard
                  key={neighbor.id}
                  neighbor={neighbor}
                  onRemove={() => removeNeighbor(neighbor.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <SectionCard>
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Ingen dokumenter"
            description="Last opp situasjonsplan, tegninger eller andre vedlegg."
            action={
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Last opp dokument
              </button>
            }
          />
        </SectionCard>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color = 'text-gray-900',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function NeighborCard({
  neighbor,
  onRemove,
}: {
  neighbor: Neighbor;
  onRemove: () => void;
}) {
  const isCompany = neighbor.owner_type === 'company';
  return (
    <SectionCard className="!p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 ${isCompany ? 'bg-purple-50' : 'bg-blue-50'}`}>
            {isCompany ? (
              <Building2 className={`h-5 w-5 ${isCompany ? 'text-purple-600' : 'text-blue-600'}`} />
            ) : (
              <User className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900">
                {neighbor.owner_name || 'Ukjent eier'}
              </h4>
              <StatusBadge status={neighbor.notification_status} />
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              {neighbor.address || `gnr ${neighbor.gnr} / bnr ${neighbor.bnr}`}
            </p>
            {neighbor.org_number && (
              <p className="text-xs text-gray-400">Org.nr: {neighbor.org_number}</p>
            )}
            {neighbor.response_text && (
              <div className="mt-2 rounded-lg bg-red-50 p-2">
                <p className="text-xs font-medium text-red-800">Merknad:</p>
                <p className="text-xs text-red-700">{neighbor.response_text}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {neighbor.notification_status === 'pending' && (
            <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <Send className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onRemove}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function AddNeighborForm({
  onAdd,
  onCancel,
}: {
  onAdd: (data: { owner_name: string; address: string; relation_type: string; contact_email: string }) => void;
  onCancel: () => void;
}) {
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [relationType, setRelationType] = useState('neighbor');
  const [contactEmail, setContactEmail] = useState('');

  return (
    <SectionCard title="Legg til nabo manuelt">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Navn</label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Eiers navn"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Adresse til naboeiendommen"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Relasjon</label>
          <select
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="neighbor">Nabo</option>
            <option value="gjenboer">Gjenboer</option>
            <option value="adjacent">Tilstøtende</option>
            <option value="easement_holder">Servitutthaver</option>
            <option value="other">Annet</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-post (valgfritt)</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="eier@eksempel.no"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Avbryt
          </button>
          <button
            onClick={() =>
              onAdd({
                owner_name: ownerName,
                address,
                relation_type: relationType,
                contact_email: contactEmail,
              })
            }
            disabled={!ownerName}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Legg til
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
