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

export async function removeChannelByName(supabase: SupabaseClient, channelName: string) {
  const topic = channelTopic(channelName);
  const existing = supabase.getChannels().find((ch) => ch.topic === topic);
  if (existing) {
    await supabase.removeChannel(existing);
  }
}

export async function subscribePostgresChannel(
  supabase: SupabaseClient,
  channelName: string,
  bindings: PostgresChangeBinding[],
  isCancelled?: () => boolean,
): Promise<RealtimeChannel | null> {
  await removeChannelByName(supabase, channelName);
  if (isCancelled?.()) return null;

  let channel = supabase.channel(channelName);
  for (const binding of bindings) {
    channel = channel.on(
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
    await supabase.removeChannel(channel);
    return null;
  }

  channel.subscribe();
  return channel;
}
