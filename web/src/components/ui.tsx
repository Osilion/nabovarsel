import type { NotificationStatus, ProjectStatus, ResponseType } from '@/lib/types';

// ============================================================
// Reusable UI primitives – matching Utskiller style
// ============================================================

interface StatusBadgeProps {
  status: NotificationStatus | ProjectStatus | ResponseType | string;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  // Notification status
  pending: 'bg-gray-100 text-gray-700',
  sending: 'bg-blue-100 text-blue-700',
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  read: 'bg-green-100 text-green-700',
  responded: 'bg-green-100 text-green-700',
  protested: 'bg-red-100 text-red-700',
  no_response: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  bounced: 'bg-red-100 text-red-700',
  // Project status
  draft: 'bg-gray-100 text-gray-700',
  ready: 'bg-blue-100 text-blue-700',
  partially_sent: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
  // Response types
  no_protest: 'bg-green-100 text-green-700',
  protest: 'bg-red-100 text-red-700',
  conditional: 'bg-yellow-100 text-yellow-700',
  none: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Venter',
  sending: 'Sender',
  sent: 'Sendt',
  delivered: 'Levert',
  read: 'Lest',
  responded: 'Besvart',
  protested: 'Protest',
  no_response: 'Ikke besvart',
  failed: 'Feilet',
  bounced: 'Returnert',
  draft: 'Utkast',
  ready: 'Klar',
  partially_sent: 'Delvis sendt',
  completed: 'Fullført',
  archived: 'Arkivert',
  no_protest: 'Ingen protest',
  protest: 'Protest',
  conditional: 'Betinget',
  none: 'Ingen',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${className}`}
    >
      {label}
    </span>
  );
}

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SectionCard({ title, description, children, className = '', action }: SectionCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
}

export function InfoRow({ label, value, children }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{children ?? value ?? '—'}</span>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
}

export function ProgressBar({ value, max, label, color = 'bg-blue-600' }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium text-gray-900">{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-500 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
