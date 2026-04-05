'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { SectionCard, StatusBadge } from '@/components/ui';
import { Bell, Send, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function VarslerPage() {
  const { hydrate, neighbors, projects } = useStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const sentNeighbors = neighbors
    .filter((n) => n.notification_status !== 'pending')
    .sort((a, b) => {
      const aTime = a.notification_sent_at ?? a.created_at;
      const bTime = b.notification_sent_at ?? b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Varsler</h1>
        <p className="mt-1 text-sm text-gray-500">Oversikt over alle sendte nabovarsel</p>
      </div>

      {sentNeighbors.length === 0 ? (
        <SectionCard>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Ingen varsler sendt ennå</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md">
              Gå til et prosjekt og send nabovarsel til naboene.
            </p>
          </div>
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {sentNeighbors.map((neighbor) => {
            const project = projects.find((p) => p.id === neighbor.project_id);
            return (
              <Link key={neighbor.id} href={`/prosjekter/${neighbor.project_id}`}>
                <SectionCard className="hover:border-blue-200 transition-all cursor-pointer !p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <NotificationIcon status={neighbor.notification_status} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {neighbor.owner_name || 'Ukjent'}
                          </h4>
                          <StatusBadge status={neighbor.notification_status} />
                        </div>
                        <p className="text-sm text-gray-500">
                          {neighbor.address}
                          {project && ` · ${project.name}`}
                        </p>
                        {neighbor.notification_sent_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Sendt {new Date(neighbor.notification_sent_at).toLocaleDateString('nb-NO')}{' '}
                            via {neighbor.notification_method}
                          </p>
                        )}
                        {neighbor.response_text && (
                          <p className="mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1 inline-block">
                            {neighbor.response_text}
                          </p>
                        )}
                      </div>
                    </div>
                    {neighbor.response_deadline && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        Frist: {new Date(neighbor.response_deadline).toLocaleDateString('nb-NO')}
                      </div>
                    )}
                  </div>
                </SectionCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationIcon({ status }: { status: string }) {
  switch (status) {
    case 'protested':
      return (
        <div className="rounded-lg bg-red-50 p-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
      );
    case 'responded':
    case 'no_response':
      return (
        <div className="rounded-lg bg-green-50 p-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
      );
    default:
      return (
        <div className="rounded-lg bg-blue-50 p-2">
          <Send className="h-5 w-5 text-blue-600" />
        </div>
      );
  }
}
