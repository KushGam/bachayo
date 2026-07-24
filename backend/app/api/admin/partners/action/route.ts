import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { sendNotificationPayload } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

type PartnerAction = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const valid = token ? await verifyAdminSession(token).catch(() => false) : false;
  if (!valid) {
    throw new Error('Unauthorized');
  }
}

async function getPartnerUserId(partnerId: string) {
  const supabase = createSupabaseAdmin();
  const { data: partner, error } = await supabase
    .from('partners')
    .select('user_id')
    .eq('id', partnerId)
    .single();

  if (error || !partner?.user_id) {
    throw new Error('Partner not found');
  }

  return partner.user_id;
}

async function notifyPartner(
  partnerId: string,
  payload: { title: string; body: string; type?: string; data?: Record<string, unknown> },
) {
  const userId = await getPartnerUserId(partnerId);
  await sendNotificationPayload(userId, {
    title: payload.title,
    body: payload.body,
    type: payload.type ?? 'approval',
    data: { partner_id: partnerId, ...payload.data },
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { partnerId, action, reason } = (await request.json()) as {
      partnerId?: string;
      action?: PartnerAction;
      reason?: string;
    };

    if (!partnerId) {
      return NextResponse.json({ success: false, error: 'partnerId is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ success: false, error: 'action is required' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const trimmedReason = reason?.trim() || 'Please contact us for more information.';

    switch (action) {
      case 'approve': {
        const { error } = await supabase
          .from('partners')
          .update({
            approval_status: 'approved',
            is_active: true,
            approved_at: new Date().toISOString(),
            approved_by: 'admin',
            rejection_reason: null,
            suspension_reason: null,
            suspended_at: null,
            deleted_at: null,
          })
          .eq('id', partnerId);

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        await notifyPartner(partnerId, {
          title: "You're approved! 🎉",
          body: 'Your LastBag dashboard is now unlocked. List your first bag today!',
        });
        break;
      }

      case 'reject': {
        const { error } = await supabase
          .from('partners')
          .update({
            approval_status: 'rejected',
            is_active: false,
            rejection_reason: trimmedReason,
          })
          .eq('id', partnerId);

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        await notifyPartner(partnerId, {
          title: 'Application update',
          body: `We couldn't approve your account. Reason: ${trimmedReason}. Call 0405290710 to discuss.`,
          type: 'approval',
          data: { status: 'rejected' },
        });
        break;
      }

      case 'suspend': {
        const { error } = await supabase
          .from('partners')
          .update({
            is_active: false,
            approval_status: 'suspended',
            suspension_reason: trimmedReason,
            suspended_at: new Date().toISOString(),
          })
          .eq('id', partnerId);

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const { data: activeBags } = await supabase
          .from('rescue_bags')
          .select('id, title')
          .eq('partner_id', partnerId)
          .eq('status', 'active');

        const { data: partnerRow } = await supabase
          .from('partners')
          .select('name')
          .eq('id', partnerId)
          .maybeSingle();

        const partnerName = partnerRow?.name?.trim() || 'The restaurant';

        await supabase
          .from('rescue_bags')
          .update({ status: 'cancelled' })
          .eq('partner_id', partnerId)
          .eq('status', 'active');

        const bagIds = (activeBags ?? []).map((bag) => bag.id);
        if (bagIds.length > 0) {
          const { data: activeOrders } = await supabase
            .from('orders')
            .select('id, customer_id, bag_id, rescue_bags(title)')
            .in('bag_id', bagIds)
            .in('status', ['pending', 'confirmed']);

          if (activeOrders && activeOrders.length > 0) {
            await supabase
              .from('orders')
              .update({
                status: 'cancelled',
                cancellation_reason: 'Partner cancelled this bag',
                cancelled_at: new Date().toISOString(),
              })
              .in(
                'id',
                activeOrders.map((order) => order.id),
              );

            for (const order of activeOrders) {
              if (!order.customer_id) continue;
              const bagRel = order.rescue_bags as
                | { title?: string | null }
                | { title?: string | null }[]
                | null;
              const bagTitle = Array.isArray(bagRel)
                ? bagRel[0]?.title
                : bagRel?.title;
              await sendNotificationPayload(order.customer_id, {
                title: 'Reservation cancelled 😔',
                body: `${partnerName} has cancelled their ${bagTitle || 'Rescue bag'} bag today. Your reservation has been automatically cancelled.`,
                type: 'bag_cancelled',
                data: {
                  order_id: order.id,
                  bag_id: order.bag_id,
                  type: 'bag_cancelled',
                  reason: 'suspended',
                },
              }).catch(console.error);
            }
          }
        }

        await notifyPartner(partnerId, {
          title: 'Account suspended',
          body: `Your LastBag account has been suspended. Reason: ${trimmedReason}. Call 0405290710 for support.`,
          type: 'approval',
          data: { status: 'suspended' },
        });
        break;
      }

      case 'reactivate': {
        const { error } = await supabase
          .from('partners')
          .update({
            is_active: true,
            approval_status: 'approved',
            suspension_reason: null,
            suspended_at: null,
          })
          .eq('id', partnerId);

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        await notifyPartner(partnerId, {
          title: 'Account reactivated ✓',
          body: 'Your LastBag account is active again. Welcome back!',
          type: 'approval',
          data: { status: 'approved' },
        });
        break;
      }

      case 'delete': {
        const { error } = await supabase
          .from('partners')
          .update({
            is_active: false,
            approval_status: 'deleted',
            deleted_at: new Date().toISOString(),
          })
          .eq('id', partnerId);

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        await supabase
          .from('rescue_bags')
          .update({ status: 'cancelled' })
          .eq('partner_id', partnerId)
          .eq('status', 'active');
        break;
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Partner not found' ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
