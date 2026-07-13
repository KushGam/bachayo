import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

type PostgresChangeBinding = {
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  table: string;
  filter?: string;
  callback: (payload: unknown) => void;
};

function channelTopic(channelName: string) {
  return `realtime:${channelName}`;
}

function findChannelsByName(supabase: SupabaseClient, channelName: string) {
  const topic = channelTopic(channelName);
  return supabase.getChannels().filter((ch) => ch.topic === topic);
}

export async function removeChannelByName(supabase: SupabaseClient, channelName: string) {
  const existing = findChannelsByName(supabase, channelName);
  await Promise.all(existing.map((ch) => supabase.removeChannel(ch)));
}

/**
 * Subscribe to postgres_changes safely.
 * Always removes any existing channel with the same name first, then attaches
 * all bindings before calling subscribe() — avoids the race that throws
 * "cannot add postgres_changes callbacks after subscribe()".
 */
export async function subscribePostgresChannel(
  supabase: SupabaseClient,
  channelName: string,
  bindings: PostgresChangeBinding[],
  isCancelled?: () => boolean,
): Promise<RealtimeChannel | null> {
  await removeChannelByName(supabase, channelName);
  if (isCancelled?.()) return null;

  // Guard against a leftover subscribed channel with the same topic.
  const leftover = findChannelsByName(supabase, channelName);
  if (leftover.length > 0) {
    await Promise.all(leftover.map((ch) => supabase.removeChannel(ch)));
  }
  if (isCancelled?.()) return null;

  const channel = supabase.channel(channelName);

  // If we somehow got an already-active channel, tear it down and recreate.
  const state = (channel as RealtimeChannel & { state?: string }).state;
  if (state && state !== 'closed') {
    await supabase.removeChannel(channel);
    if (isCancelled?.()) return null;
  }

  const fresh = state && state !== 'closed' ? supabase.channel(channelName) : channel;

  for (const binding of bindings) {
    fresh.on(
      'postgres_changes',
      {
        event: binding.event ?? '*',
        schema: binding.schema ?? 'public',
        table: binding.table,
        ...(binding.filter ? { filter: binding.filter } : {}),
      },
      binding.callback,
    );
  }

  if (isCancelled?.()) {
    await supabase.removeChannel(fresh);
    return null;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Realtime subscribe timed out'));
    }, 12_000);

    fresh.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        resolve();
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timeout);
        reject(err ?? new Error(`Realtime subscribe failed: ${status}`));
      }
    });
  });

  if (isCancelled?.()) {
    await supabase.removeChannel(fresh);
    return null;
  }

  return fresh;
}
