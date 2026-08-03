import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Contact LastBag support and find answers to common questions.',
  alternates: {
    canonical: '/support',
  },
};

export default function SupportPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F3EF',
        fontFamily: '-apple-system, sans-serif',
        padding: '40px 20px',
      }}>
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
        }}>
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '40px',
          }}>
          <div style={{ fontSize: '48px' }}>🛍</div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '900',
              color: '#1A1A1A',
              margin: '12px 0 4px',
            }}>
            LastBag Support
          </h1>
          <p
            style={{
              color: '#6B7280',
              fontSize: '15px',
            }}>
            We&apos;re here to help 🙏
          </p>
        </div>

        {/* Contact options */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1A1A1A',
              marginBottom: '16px',
            }}>
            Contact us
          </h2>

          <a
            href="mailto:lastbagnp@gmail.com"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 0',
              borderBottom: '1px solid #F0EDE8',
              textDecoration: 'none',
              color: '#1A1A1A',
            }}>
            <span style={{ fontSize: '24px' }}>📧</span>
            <div>
              <div
                style={{
                  fontWeight: '600',
                  fontSize: '14px',
                }}>
                Email us
              </div>
              <div
                style={{
                  color: '#D85A30',
                  fontSize: '13px',
                }}>
                lastbagnp@gmail.com
              </div>
            </div>
          </a>

          <a
            href="https://wa.me/9779762623241"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 0',
              borderBottom: '1px solid #F0EDE8',
              textDecoration: 'none',
              color: '#1A1A1A',
            }}>
            <span style={{ fontSize: '24px' }}>💬</span>
            <div>
              <div
                style={{
                  fontWeight: '600',
                  fontSize: '14px',
                }}>
                WhatsApp us
              </div>
              <div
                style={{
                  color: '#D85A30',
                  fontSize: '13px',
                }}>
                +977 9762623241
              </div>
            </div>
          </a>

          <a
            href="https://lastbag.app"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 0',
              textDecoration: 'none',
              color: '#1A1A1A',
            }}>
            <span style={{ fontSize: '24px' }}>🌐</span>
            <div>
              <div
                style={{
                  fontWeight: '600',
                  fontSize: '14px',
                }}>
                Visit website
              </div>
              <div
                style={{
                  color: '#D85A30',
                  fontSize: '13px',
                }}>
                lastbag.app
              </div>
            </div>
          </a>
        </div>

        {/* FAQ */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1A1A1A',
              marginBottom: '20px',
            }}>
            Frequently asked questions
          </h2>

          {[
            {
              q: 'How do I reserve a rescue bag?',
              a: 'Browse bags on the home screen, tap on one you like, then tap Reserve. Show your QR code at pickup.',
            },
            {
              q: 'How do I cancel a reservation?',
              a: 'Go to My Bags → find your order → tap Cancel. Cancellations must be made before the pickup window.',
            },
            {
              q: 'How do I list my restaurant on LastBag?',
              a: 'Tap "I run a restaurant" on the signup screen. After approval, you can start listing rescue bags.',
            },
            {
              q: 'How does payment work?',
              a: 'Contact us via WhatsApp to arrange payment via eSewa or Khalti for restaurant subscriptions.',
            },
            {
              q: 'What cities are available?',
              a: 'We are currently launching in Kathmandu, Lalitpur, Pokhara, and Bhaktapur.',
            },
            {
              q: 'How do I delete my account?',
              a: 'Go to Profile → Settings → Delete Account, or visit lastbag.app/delete-account',
            },
          ].map((faq, i) => (
            <div
              key={i}
              style={{
                marginBottom: '20px',
                paddingBottom: '20px',
                borderBottom: i < 5 ? '1px solid #F0EDE8' : 'none',
              }}>
              <div
                style={{
                  fontWeight: '700',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  marginBottom: '6px',
                }}>
                {faq.q}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: '1.6',
                }}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            color: '#9CA3AF',
            fontSize: '12px',
            marginTop: '32px',
          }}>
          © 2026 LastBag · Mamata Technologies
          <br />
          Made with ❤️ in Nepal 🇳🇵
        </p>
      </div>
    </main>
  );
}
