# Supabase Edge Functions — intentionally empty

LastBag does **not** use Supabase Edge Functions. All server-side logic lives in
Next.js API routes under `backend/app/api/`, deployed with the rest of the site.

We consolidated on one stack because the Edge Functions duplicated logic that
already existed in Next.js, and keeping both meant every notification change had
to be written twice and deployed twice (`supabase functions deploy` on top of the
normal Vercel deploy).

## Where the old functions went

| Deleted Edge Function     | Replacement                                          |
| ------------------------- | ---------------------------------------------------- |
| `send-notification`       | `backend/app/api/send-notification/route.ts`         |
| `webhook-order-insert`    | `backend/app/api/webhooks/order-created/route.ts`    |
| `webhook-bag-stock`       | `backend/app/api/webhooks/bag-stock/route.ts`        |
| `cron-expiring-bags`      | `backend/app/api/notify-expiring/route.ts`           |
| `cron-missed-orders`      | `backend/app/api/cron/missed-orders/route.ts`        |
| `cron-process-scheduled`  | `backend/app/api/cron/pickup-reminders/route.ts`     |
| `payment-initiate`        | Removed — payments are manual for v1                 |
| `payment-verify`          | Removed — payments are manual for v1                 |
| `payment-esewa-submit`    | Removed — payments are manual for v1                 |

## Action required after deploying

The database webhooks and scheduled jobs still point at the old Edge Function
URLs. Repoint them in the Supabase dashboard:

- **Database → Webhooks**: change the URL to
  `https://<site>/api/webhooks/order-created` and
  `https://<site>/api/webhooks/bag-stock`, keeping the
  `x-supabase-webhook-secret` header.
- **Cron jobs**: the schedules now live in `backend/vercel.json`, so any
  `pg_cron` / dashboard schedules invoking Edge Functions can be removed.

`supabase/migrations/` is still the source of truth for the schema — only the
functions directory is retired.
