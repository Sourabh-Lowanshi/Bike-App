/**
 * Sends the password-reset email via EmailJS (emailjs.com).
 *
 * Setup (in your EmailJS dashboard):
 *   1. Add an Email Service (Gmail, Outlook, custom SMTP, etc.) → note its Service ID.
 *   2. Create an Email Template with these template variables:
 *        {{to_email}}    — recipient address
 *        {{user_name}}   — recipient's name
 *        {{reset_link}}  — the one-time reset URL
 *      Note the Template ID.
 *   3. Under Account → API Keys, grab your Public Key and Private Key.
 *   4. Set in .env.local:
 *        EMAILJS_SERVICE_ID=...
 *        EMAILJS_TEMPLATE_ID=...
 *        EMAILJS_PUBLIC_KEY=...
 *        EMAILJS_PRIVATE_KEY=...
 *
 * If you actually meant the `emailjs` npm SMTP package instead of the
 * emailjs.com service, swap this function's body for a nodemailer/emailjs
 * SMTP call — the rest of the app (token generation, routes, pages) doesn't
 * need to change.
 */

export class MailerNotConfiguredError extends Error {
  constructor() {
    super(
      "Email sending isn't configured yet. Set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY in your environment."
    );
    this.name = "MailerNotConfiguredError";
  }
}

function getEmailJsConfig() {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (!serviceId || !templateId || !publicKey || !privateKey) return null;
  return { serviceId, templateId, publicKey, privateKey };
}

export function isMailerConfigured(): boolean {
  return getEmailJsConfig() !== null;
}

export async function sendPasswordResetEmail(params: {
  toEmail: string;
  userName: string;
  resetLink: string;
}): Promise<void> {
  const config = getEmailJsConfig();
  if (!config) throw new MailerNotConfiguredError();

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: {
        to_email: params.toEmail,
        user_name: params.userName,
        reset_link: params.resetLink,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`EmailJS request failed (${res.status}): ${text.slice(0, 300)}`);
  }
}
