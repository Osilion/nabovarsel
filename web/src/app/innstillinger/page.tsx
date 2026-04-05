'use client';

import { SectionCard } from '@/components/ui';
import { Settings, User, Building2, Bell, Link2 } from 'lucide-react';

export default function InnstillingerPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Innstillinger</h1>
        <p className="mt-1 text-sm text-gray-500">Administrer konto og integrasjoner</p>
      </div>

      <SectionCard title="Profil" description="Din kontoinformasjon">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fullt navn</label>
            <input
              type="text"
              defaultValue=""
              placeholder="Ditt navn"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
            <input
              type="email"
              defaultValue=""
              placeholder="din@epost.no"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
            <input
              type="text"
              defaultValue=""
              placeholder="Firmanavn (valgfritt)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              defaultValue=""
              placeholder="+47 ..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Lagre endringer
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Integrasjoner" description="Koble til eksterne tjenester">
        <div className="space-y-4">
          <IntegrationRow
            icon={<Building2 className="h-5 w-5 text-blue-600" />}
            name="Grunnboken"
            description="Hent eierdata automatisk fra Kartverket"
            status="Ikke konfigurert"
          />
          <IntegrationRow
            icon={<Bell className="h-5 w-5 text-green-600" />}
            name="Altinn"
            description="Send nabovarsel via Altinn melding"
            status="Ikke konfigurert"
          />
          <IntegrationRow
            icon={<Link2 className="h-5 w-5 text-purple-600" />}
            name="Utskiller"
            description="Koble til Utskiller-appen for tomteutskilling"
            status="Ikke konfigurert"
          />
        </div>
      </SectionCard>
    </div>
  );
}

function IntegrationRow({
  icon,
  name,
  description,
  status,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 p-2">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-yellow-600 bg-yellow-50 rounded-full px-2.5 py-1">
        {status}
      </span>
    </div>
  );
}
