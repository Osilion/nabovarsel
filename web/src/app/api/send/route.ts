import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendNotification } from '@/lib/api/altinn';

const sendSchema = z.object({
  recipient_name: z.string().min(1),
  recipient_org_number: z.string().optional(),
  recipient_ssn: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  neighbor_id: z.string().uuid(),
  project_id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = sendSchema.parse(json);

    const result = await sendNotification({
      recipient_name: data.recipient_name,
      recipient_org_number: data.recipient_org_number,
      recipient_ssn: data.recipient_ssn,
      subject: data.subject,
      body: data.body,
    });

    return NextResponse.json({
      success: result.status === 'accepted',
      reference_id: result.reference_id,
      message: result.message,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
