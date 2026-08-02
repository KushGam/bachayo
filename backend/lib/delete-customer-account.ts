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

  if (!profile) {
    // Auth user may still exist without a profile row.
    const { error: deleteOrphanAuth } = await admin.auth.admin.deleteUser(userId);
    if (deleteOrphanAuth) {
      const msg = deleteOrphanAuth.message.toLowerCase();
      if (msg.includes('not found') || msg.includes('user not found')) {
        throw Object.assign(new Error('Customer not found.'), { code: 'NOT_FOUND' });
      }
      throw new Error(deleteOrphanAuth.message);
    }
    return;
  }

  if (profile.role !== 'customer') {
    throw Object.assign(new Error('Only customer accounts can be deleted this way.'), {
      code: 'NOT_CUSTOMER',
    });
  }

  const fallbackName =
    (typeof profile.full_name === 'string' && profile.full_name.trim()) || 'Customer';

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
    const msg = deleteError.message.toLowerCase();
    // Auth already gone — remove orphaned profile so admin delete still succeeds.
    if (msg.includes('not found') || msg.includes('user not found')) {
      const { error: profileDeleteError } = await admin.from('profiles').delete().eq('id', userId);
      if (profileDeleteError) {
        throw new Error(profileDeleteError.message);
      }
      return;
    }
    throw new Error(deleteError.message);
  }
}
