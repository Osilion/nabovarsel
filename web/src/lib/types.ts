// ============================================================
// Nabovarsel – Domain Types
// ============================================================

export type ProjectStatus =
  | 'draft'
  | 'ready'
  | 'sending'
  | 'partially_sent'
  | 'sent'
  | 'completed'
  | 'archived';

export type NotificationStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'responded'
  | 'protested'
  | 'no_response'
  | 'failed';

export type NotificationMethod = 'altinn' | 'email' | 'mail' | 'manual';

export type OwnerType = 'person' | 'company' | 'municipality' | 'state' | 'unknown';

export type RelationType = 'neighbor' | 'gjenboer' | 'adjacent' | 'easement_holder' | 'other';

export type ResponseType = 'no_protest' | 'protest' | 'conditional' | 'none';

export type DocumentType =
  | 'nabovarsel_skjema'
  | 'situasjonsplan'
  | 'tegning'
  | 'vedtak'
  | 'attachment'
  | 'response';

export type NeighborSource = 'matrikkel' | 'grunnbok' | 'manual' | 'utskiller';

// ---------- Core models ----------

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  kommune_nr?: string;
  kommune_navn?: string;
  gnr?: number;
  bnr?: number;
  fnr?: number;
  snr?: number;
  address?: string;
  status: ProjectStatus;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface Neighbor {
  id: string;
  project_id: string;
  gnr?: number;
  bnr?: number;
  fnr?: number;
  snr?: number;
  kommune_nr?: string;
  address?: string;
  owner_name?: string;
  owner_type?: OwnerType;
  org_number?: string;
  person_id?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  relation_type: RelationType;
  distance_meters?: number;
  notification_status: NotificationStatus;
  notification_sent_at?: string;
  notification_method?: NotificationMethod;
  response_deadline?: string;
  response_received_at?: string;
  response_type?: ResponseType;
  response_text?: string;
  source: NeighborSource;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationLogEntry {
  id: string;
  neighbor_id: string;
  project_id: string;
  method: NotificationMethod;
  altinn_reference?: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  payload?: Record<string, unknown>;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  name: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  doc_type: DocumentType;
  uploaded_by?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// ---------- API response types ----------

export interface MatrikkelUnit {
  kommune_nr: string;
  gnr: number;
  bnr: number;
  fnr?: number;
  snr?: number;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

export interface GrunnbokOwner {
  name: string;
  type: OwnerType;
  org_number?: string;
  person_id?: string;
  share?: string;
  address?: string;
}

export interface GrunnbokEntry {
  matrikkel_unit: MatrikkelUnit;
  owners: GrunnbokOwner[];
  easements?: string[];
}

export interface AltinnNotificationRequest {
  recipient_org_number?: string;
  recipient_ssn?: string;
  recipient_name: string;
  subject: string;
  body: string;
  attachments?: { name: string; data: string; mime_type: string }[];
}

export interface AltinnNotificationResponse {
  reference_id: string;
  status: 'accepted' | 'rejected' | 'error';
  message?: string;
}

// ---------- Dashboard aggregates ----------

export interface ProjectSummary extends Project {
  neighbor_count: number;
  sent_count: number;
  responded_count: number;
  protested_count: number;
}
