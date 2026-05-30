import { Resend } from "resend";
import { logger } from "./logger";

// Resend is only instantiated on demand so the server can boot without a key
// in environments that do not send mail (typecheck, build, local dev with
// stubs). A missing key surfaces as a 500 on /auth/request-link, not a crash.
const FROM = "Amplify X Momentum <auth@amplify-x.co>";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export interface MagicLinkEmail {
  to: string;
  code: string;
  url: string;
}

/**
 * Send a magic-link sign-in email. The 6-digit code is the primary affordance
 * (copy/paste works from any mail client); the deep-link button is a
 * convenience for users reading the email on the device that has the app.
 * Throws on a configuration miss or Resend API error so the caller can decide
 * whether the request should fail (auth flow) or be best-effort (webhook).
 */
export async function sendMagicLinkEmail({ to, code, url }: MagicLinkEmail): Promise<void> {
  const client = getClient();
  if (!client) {
    logger.warn({ to }, "RESEND_API_KEY not set; magic link email not sent");
    throw new Error("Email service is not configured");
  }
  const subject = "Sign in to Amplify X Momentum";
  const { error } = await client.emails.send({
    from: FROM,
    to,
    subject,
    html: buildHtml({ code, url }),
    text: buildText({ code, url }),
  });
  if (error) {
    logger.error({ err: error, to }, "Resend send failed");
    throw new Error("Failed to send email");
  }
}

function buildHtml({ code, url }: { code: string; url: string }): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in to Amplify X Momentum</title></head><body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0f0f1a;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#1a1a2e;border-radius:16px;padding:36px 28px;">
        <tr><td align="center" style="padding-bottom:18px;">
          <div style="display:inline-block;padding:6px 14px;border-radius:20px;background:rgba(212,160,23,0.15);border:1px solid rgba(212,160,23,0.3);color:#d4a017;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">Amplify X</div>
        </td></tr>
        <tr><td align="center" style="padding-bottom:10px;font-size:22px;font-weight:700;color:#ffffff;line-height:30px;">Your sign-in code</td></tr>
        <tr><td align="center" style="padding-bottom:26px;font-size:14px;color:rgba(255,255,255,0.6);line-height:20px;">Enter this 6-digit code in the app to sign in. It expires in 15 minutes.</td></tr>
        <tr><td align="center" style="padding-bottom:26px;">
          <div style="display:inline-block;padding:18px 28px;background:#0f0f1a;border:1px solid rgba(255,255,255,0.1);border-radius:14px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:38px;letter-spacing:10px;color:#ffffff;font-weight:700;">${code}</div>
        </td></tr>
        <tr><td align="center" style="padding-bottom:18px;font-size:13px;color:rgba(255,255,255,0.45);">or tap the button below on your phone</td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${url}" style="display:inline-block;padding:14px 28px;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:12px;">Sign in to Amplify X</a>
        </td></tr>
        <tr><td align="center" style="font-size:11px;color:rgba(255,255,255,0.35);line-height:16px;">Didn't request this? You can safely ignore this email.</td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

function buildText({ code, url }: { code: string; url: string }): string {
  return `Your sign-in code for Amplify X Momentum is ${code}\n\nIt expires in 15 minutes.\n\nOr open this link on your phone to sign in: ${url}\n\nDidn't request this? You can safely ignore this email.`;
}
