import { supabase } from '@/lib/supabase';

export const PARTNER_REPORT_REASONS = [
  '🍱 Food quality was poor',
  '❌ Bag was not available',
  '📦 Wrong items in bag',
  '😠 Rude or unprofessional',
  '🚫 Listing was misleading',
  '⚠️ Other issue',
] as const;

export const CUSTOMER_REPORT_REASONS = [
  "🚫 No-show (didn't pick up)",
  '😠 Rude or abusive behavior',
  '🔄 Repeated fake reservations',
  '⚠️ Suspicious activity',
  '📱 QR code fraud attempt',
  '🔴 Other issue',
] as const;

export type ReportType = 'partner' | 'customer';

export async function submitReport(input: {
  reportedType: ReportType;
  reportedId: string;
  reason: string;
  details?: string | null;
  orderId?: string | null;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const reporterId = sessionData.session?.user?.id;
  if (!reporterId) {
    throw new Error('Please sign in to submit a report');
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    reported_type: input.reportedType,
    reported_id: input.reportedId,
    order_id: input.orderId ?? null,
    reason: input.reason,
    details: input.details?.trim() ? input.details.trim() : null,
  } as never);

  if (error) throw error;
}
