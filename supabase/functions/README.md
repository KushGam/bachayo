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

- **Database → Webhooks** (header `x-supabase-webhook-secret`):
  - `orders` INSERT → `https://<site>/api/webhooks/order-created`
  - `rescue_bags` UPDATE → `https://<site>/api/webhooks/bag-stock`
  - `rescue_bags` INSERT → `https://<site>/api/webhooks/bag-created`
  - `partners` INSERT → `https://<site>/api/webhooks/partner-signup`
- **Cron jobs**: schedules live in `backend/vercel.json`:
  - `/api/cron/check-subscriptions` — daily (subscription + review reminders)
  - `/api/notify-expiring` — hourly (partner bag expiring in ≤1h)
  - `/api/cron/pickup-reminders` — every 15 min
  - `/api/cron/missed-orders` — every 15 min

Any `pg_cron` / dashboard schedules invoking Edge Functions can be removed.

`supabase/migrations/` is still the source of truth for the schema — only the
functions directory is retired.
