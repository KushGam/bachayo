import { createSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Remove a customer auth user while keeping partner order/review history.
 * DB trigger snapshots customer_name onto orders; FKs SET NULL on delete.
 */
export async function deleteCustomerAccount(userId: string) {
  const admin = createSupabaseAdmin();

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (profile && profile.role !== 'customer') {
    throw Object.assign(new Error('Only customer accounts can be deleted this way.'), {
      code: 'NOT_CUSTOMER',
    });
  }

  const fallbackName =
    (typeof profile?.full_name === 'string' && profile.full_name.trim()) || 'Customer';

  // Fill missing display names before the profile row disappears.
  await admin
    .from('orders')
    .update({ customer_name: fallbackName } as never)
    .eq('customer_id', userId)
    .is('customer_name', null);

  // Strip phone PII from order snapshots.
  await admin
    .from('orders')
    .update({ customer_phone: null } as never)
    .eq('customer_id', userId);

  await admin.from('notifications').delete().eq('user_id', userId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }
}
