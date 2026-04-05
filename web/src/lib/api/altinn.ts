// ============================================================
// Altinn API wrapper (placeholder)
// Will send nabovarsel notifications via Altinn
// ============================================================

import type { AltinnNotificationRequest, AltinnNotificationResponse } from '../types';

/**
 * Send a nabovarsel notification via Altinn.
 *
 * TODO: Replace with real Altinn 3 API integration.
 * Reference: https://docs.altinn.studio/api/
 *
 * The real integration will use:
 * - Altinn 3 Correspondence API for sending formal notices
 * - Maskinporten for authentication
 * - Server-side only (API route handler)
 *
 * Environment variables needed:
 * - ALTINN_API_URL
 * - ALTINN_API_KEY
 * - MASKINPORTEN_CLIENT_ID
 * - MASKINPORTEN_JWK
 * - MASKINPORTEN_ISSUER
 */
export async function sendNotification(
  request: AltinnNotificationRequest
): Promise<AltinnNotificationResponse> {
  // Mock implementation – simulates successful send
  console.log('[Altinn Mock] Sending notification to:', request.recipient_name);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    reference_id: `ALT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'accepted',
    message: 'Melding akseptert for sending (mock)',
  };
}

/**
 * Check the delivery status of a previously sent notification.
 *
 * TODO: Implement with real Altinn status polling.
 */
export async function checkDeliveryStatus(
  referenceId: string
): Promise<{ status: string; delivered_at?: string }> {
  return {
    status: 'delivered',
    delivered_at: new Date().toISOString(),
  };
}

/**
 * Send nabovarsel to multiple recipients in batch.
 */
export async function sendBatchNotifications(
  requests: AltinnNotificationRequest[]
): Promise<AltinnNotificationResponse[]> {
  const results = await Promise.all(requests.map(sendNotification));
  return results;
}
