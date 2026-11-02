/**
 * Email service for transactional emails (verification, etc.).
 *
 * Uses Resend when RESEND_API_KEY is configured; otherwise falls back to
 * logging the email content to the console (useful during development).
 */
import { env } from '../config.js';

let resendClient: import('resend').Resend | null = null;

async function getClient(): Promise<import('resend').Resend | null> {
  if (resendClient) return resendClient;
  if (env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    resendClient = new Resend(env.RESEND_API_KEY);
    return resendClient;
  }
  return null;
}

/**
 * Send a verification email to the given address.
 * In dev mode (no RESEND_API_KEY), the verification link is logged to the console.
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${env.APP_URL}/verify?token=${token}`;

  const client = await getClient();

  if (client) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1120; padding: 40px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background: #131a2b; border-radius: 16px; border: 1px solid #1e293b; padding: 40px;">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #0891b2, #06b6d4); line-height: 48px; text-align: center; font-size: 22px; font-weight: 800; color: white;">SF</div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 8px;">
                      <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 0;">Verify your email</h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">Click the button below to verify your email address and get started with SheetFlow.</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <a href="${link}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; font-size: 14px; font-weight: 600; text-decoration: none;">Verify Email</a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">If you didn't create an account, you can safely ignore this email.<br/>This link expires in 24 hours.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await client.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Verify your email — SheetFlow',
      html,
    });
  } else {
    // Dev fallback — log to console
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║            📧 EMAIL VERIFICATION (dev mode)            ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  To: ${email.padEnd(42)}║`);
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  ${link.padEnd(58)}║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
  }
}
