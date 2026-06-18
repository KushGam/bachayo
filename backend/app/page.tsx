export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Bachayo API</h1>
      <p>Serverless API routes for payment verification and webhooks.</p>
      <ul>
        <li>POST /api/send-notification</li>
        <li>POST /api/verify-esewa</li>
        <li>POST /api/verify-khalti</li>
        <li>POST /api/webhooks/order-created</li>
        <li>GET /api/notify-expiring (Vercel cron)</li>
      </ul>
    </main>
  );
}
