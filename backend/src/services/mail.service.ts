import { Resend } from 'resend';
import { env } from '../config/env.js';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendClient && env.resendApiKey) {
    resendClient = new Resend(env.resendApiKey);
  }
  return resendClient;
}

export interface ContactNotificationData {
  name: string;
  email?: string;
  phone?: string;
  message: string;
}

export interface QuoteNotificationData {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceType: string;
  sizeLabel?: string;
  addons?: string[];
  estimatedPrice?: string;
  address?: string;
  notes?: string;
  frequency?: string;
  preferredDate?: string;
  preferredTime?: string;
  codigo?: string;
}

export interface QuoteReviewNotificationData {
  clientName: string;
  clientEmail: string;
  codigo: string;
  estado: string;
  motivoRechazo?: string;
  totalEstimado: number;
}

function wrapBrandedTemplate(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 20px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0;">

          <!-- Ultra-compact Slim Navy Banner (Only Company Name) -->
          <tr>
            <td style="background-color: #1b2a5a; padding: 10px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: 0.2px; line-height: 1.2;">
                Marcela's Cleaning Services
              </h1>
            </td>
          </tr>

          <!-- Clean White Email Body Content -->
          <tr>
            <td style="padding: 26px 26px 20px; background-color: #ffffff;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Contact Direct Callout -->
          <tr>
            <td style="padding: 14px 26px; background-color: #ffffff; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #64748b; font-weight: 500;">
                Questions or changes to your request?
              </p>
              <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">
                Call or text Marcela:
                <a href="tel:3202493106" style="color: #0284c7; text-decoration: none;">(320) 249-3106</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 26px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px; color: #1e293b; font-size: 12px; font-weight: 700;">
                Marcela's Cleaning Services
              </p>
              <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; line-height: 1.4;">
                Residential & Commercial Cleaning • Licensed & Insured • St. Cloud & Central MN
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                © ${new Date().getFullYear()} Marcela's Cleaning Services. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendContactEmailNotification(
  data: ContactNotificationData
): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn('[MailService] RESEND_API_KEY is not configured. Skipping email send.');
    return false;
  }

  try {
    const toEmail = env.notificationEmail;

    const bodyContent = `
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 700;">
        New Contact Message
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569; width: 120px;">Name:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 700;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569;">Email:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;"><a href="mailto:${data.email || ''}" style="color: #0284c7; text-decoration: none;">${data.email || 'Not provided'}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569;">Phone:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;"><a href="tel:${data.phone || ''}" style="color: #0284c7; text-decoration: none;">${data.phone || 'Not provided'}</a></td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border-left: 3px solid #2bb5b2; border-radius: 4px 8px 8px 4px; padding: 14px 16px; margin: 16px 0;">
        <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Message:</p>
        <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${data.message}</p>
      </div>
    `;

    const htmlContent = wrapBrandedTemplate('New Contact Message', bodyContent);

    const { error } = await client.emails.send({
      from: 'Marcela\'s Cleaning <onboarding@resend.dev>',
      to: toEmail,
      subject: `New Contact Message: ${data.name}`,
      html: htmlContent,
      replyTo: data.email || undefined,
    });

    if (error) {
      console.error('[MailService] Error sending contact email:', error);
      return false;
    }

    console.log(`[MailService] Contact email sent to ${toEmail} for ${data.name}`);
    return true;
  } catch (err) {
    console.error('[MailService] Exception sending contact email:', err);
    return false;
  }
}

export async function sendQuoteEmailNotification(
  data: QuoteNotificationData
): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn('[MailService] RESEND_API_KEY is not configured. Skipping quote email send.');
    return false;
  }

  try {
    const toEmail = env.notificationEmail;

    const addonsFormatted =
      data.addons && data.addons.length > 0 ? data.addons.join(', ') : 'None requested';

    const cleanNotes = data.notes ? data.notes.replace(/\[|\]/g, '').trim() : '';

    const bodyContent = `
      <div style="margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
        <h2 style="margin: 0 0 4px; color: #0f172a; font-size: 18px; font-weight: 800;">
          New Quote Request Received
        </h2>
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          A customer has submitted a quote request through the website.
        </p>
      </div>

      <!-- Estimated Price Highlight Box (Clean & Minimal) -->
      <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #0284c7;">
          Estimated Starting Price
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 4px 0 2px;">
          ${data.estimatedPrice || 'Custom Quote'}
        </div>
        <div style="font-size: 11px; color: #64748b;">
          Initial web estimate • Subject to final confirmation
        </div>
      </div>

      <!-- Details Table (Clean white design) -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b; width: 140px;">Customer:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a;">${data.clientName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Phone:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">
            <a href="tel:${data.clientPhone || ''}" style="color: #0284c7; font-weight: 600; text-decoration: none;">${data.clientPhone || 'Not provided'}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Email:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">
            <a href="mailto:${data.clientEmail || ''}" style="color: #0284c7; text-decoration: none;">${data.clientEmail || 'Not provided'}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Service:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #1e2952;">${data.serviceType}</td>
        </tr>
        ${data.sizeLabel ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Home Size:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${data.sizeLabel}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Add-on Services:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${addonsFormatted}</td>
        </tr>
        ${data.frequency ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Frequency:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${data.frequency}</td>
        </tr>` : ''}
        ${data.preferredDate ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Preferred Date:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${data.preferredDate}${data.preferredTime ? ` • ${data.preferredTime}` : ''}</td>
        </tr>` : ''}
        ${data.address ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Service Location:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${data.address}</td>
        </tr>` : ''}
        ${cleanNotes ? `
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #64748b; vertical-align: top;">Notes:</td>
          <td style="padding: 8px 0; color: #334155; line-height: 1.5;">${cleanNotes}</td>
        </tr>` : ''}
      </table>
    `;

    const htmlContent = wrapBrandedTemplate(
      `New Quote: ${data.serviceType} - ${data.clientName}`,
      bodyContent
    );

    const subject = `Quote Request: ${data.serviceType} — ${data.clientName}`;

    const { error } = await client.emails.send({
      from: 'Marcela\'s Cleaning <onboarding@resend.dev>',
      to: toEmail,
      subject,
      html: htmlContent,
      replyTo: data.clientEmail || undefined,
    });

    if (error) {
      console.error('[MailService] Error sending quote email to business:', error);
      return false;
    }

    console.log(`[MailService] Quote notification sent to ${toEmail} for ${data.clientName}`);
    return true;
  } catch (err) {
    console.error('[MailService] Exception sending quote notification:', err);
    return false;
  }
}

export async function sendQuoteCustomerConfirmation(
  data: QuoteNotificationData
): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn('[MailService] RESEND_API_KEY is not configured. Skipping customer confirmation.');
    return false;
  }

  if (!data.clientEmail || !data.clientEmail.includes('@')) {
    console.log('[MailService] No valid customer email provided for confirmation.');
    return false;
  }

  try {
    const addonsFormatted =
      data.addons && data.addons.length > 0
        ? data.addons.map((a) => `<span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 5px; font-size: 13px; font-weight: 600; margin: 2px 4px 2px 0;">${a}</span>`).join('')
        : '<span style="color: #64748b; font-style: italic;">None selected</span>';

    const cleanNotes = data.notes ? data.notes.replace(/\[|\]/g, '').trim() : '';

    const bodyContent = `
      <!-- Greeting -->
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 6px; color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">
          Thank you, ${data.clientName}!
        </h2>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
          We have successfully received your cleaning service request. Marcela and our team are reviewing your home details to prepare your personalized service plan.
        </p>
      </div>

      <!-- Estimated Price Callout Box (Clean White / Soft Border) -->
      <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; text-align: center; margin-bottom: 22px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #0284c7;">
          Estimated Starting Price
        </div>
        <div style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 4px 0 2px; letter-spacing: -0.5px;">
          ${data.estimatedPrice || 'Custom Quote'}
        </div>
        <div style="font-size: 11px; color: #64748b; line-height: 1.4;">
          Transparent estimate based on your selections • Confirmed with you before work begins
        </div>
      </div>

      <!-- Summary of Request -->
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 22px;">
        <div style="background-color: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="margin: 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #334155;">
            Summary of Your Request
          </h3>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 14px 16px; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600; width: 140px;">Service:</td>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 700;">${data.serviceType}</td>
          </tr>
          ${data.sizeLabel ? `
          <tr>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Home Size:</td>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${data.sizeLabel}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600; vertical-align: top;">Add-on Services:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${addonsFormatted}</td>
          </tr>
          ${data.frequency ? `
          <tr>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Frequency:</td>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${data.frequency}</td>
          </tr>` : ''}
          ${data.preferredDate ? `
          <tr>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Preferred Date:</td>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${data.preferredDate}${data.preferredTime ? ` • ${data.preferredTime}` : ''}</td>
          </tr>` : ''}
          ${data.address ? `
          <tr>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Service Area:</td>
            <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${data.address}</td>
          </tr>` : ''}
          ${cleanNotes ? `
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600; vertical-align: top;">Notes:</td>
            <td style="padding: 7px 0; color: #334155; line-height: 1.4;">${cleanNotes}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- What Happens Next (3 Steps) -->
      <div style="background-color: #f8fafc; border-radius: 10px; padding: 16px 16px 12px; margin-bottom: 18px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #0f172a;">
          What happens next?
        </h3>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 6px;">
          <tr>
            <td style="width: 26px; vertical-align: top; padding-right: 10px;">
              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #2bb5b2; color: #ffffff; font-weight: 700; font-size: 12px;">1</span>
            </td>
            <td style="vertical-align: top; padding-bottom: 10px;">
              <div style="font-weight: 700; color: #1e293b; font-size: 13px;">We review your request</div>
              <div style="color: #64748b; font-size: 12px; line-height: 1.4;">Marcela personally checks schedule availability and matches your home size with our team.</div>
            </td>
          </tr>
          <tr>
            <td style="width: 26px; vertical-align: top; padding-right: 10px;">
              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #2bb5b2; color: #ffffff; font-weight: 700; font-size: 12px;">2</span>
            </td>
            <td style="vertical-align: top; padding-bottom: 10px;">
              <div style="font-weight: 700; color: #1e293b; font-size: 13px;">We contact you within 24 hours</div>
              <div style="color: #64748b; font-size: 12px; line-height: 1.4;">We will give you a quick call or message to confirm your preferred timing and answer any questions.</div>
            </td>
          </tr>
          <tr>
            <td style="width: 26px; vertical-align: top; padding-right: 10px;">
              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #2bb5b2; color: #ffffff; font-weight: 700; font-size: 12px;">3</span>
            </td>
            <td style="vertical-align: top;">
              <div style="font-weight: 700; color: #1e293b; font-size: 13px;">Zero obligation & 100% satisfaction</div>
              <div style="color: #64748b; font-size: 12px; line-height: 1.4;">No prepayment needed. If you're happy with the date and price, we lock your appointment in.</div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const htmlContent = wrapBrandedTemplate(
      `Your Cleaning Estimate — Marcela's Cleaning Services`,
      bodyContent
    );

    const sendResult = await client.emails.send({
      from: 'Marcela\'s Cleaning <onboarding@resend.dev>',
      to: data.clientEmail,
      subject: `We've received your cleaning request! — Marcela's Cleaning Services`,
      html: htmlContent,
      replyTo: env.notificationEmail,
    });

    if (sendResult.error) {
      console.warn(
        `[MailService] Could not send direct to ${data.clientEmail} (${sendResult.error.message}). ` +
        `Sending preview copy to ${env.notificationEmail}...`
      );

      if (data.clientEmail !== env.notificationEmail) {
        await client.emails.send({
          from: 'Marcela\'s Cleaning <onboarding@resend.dev>',
          to: env.notificationEmail,
          subject: `[Customer Preview for ${data.clientEmail}] We've received your cleaning request!`,
          html: htmlContent,
        }).catch((e) => console.error('[MailService] Error sending preview copy:', e));
      }

      return false;
    }

    console.log(`[MailService] Confirmation email sent successfully to customer: ${data.clientEmail}`);
    return true;
  } catch (err) {
    console.error('[MailService] Exception sending customer confirmation:', err);
    return false;
  }
}

export async function sendQuoteReviewNotification(
  data: QuoteReviewNotificationData
): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn('[MailService] RESEND_API_KEY is not configured. Skipping review notification.');
    return false;
  }

  try {
    const isAccepted = data.estado === 'ACEPTADA';
    const statusLabel = isAccepted ? 'Quote Accepted' : 'Quote Update';
    const statusColor = isAccepted ? '#16a34a' : '#dc2626';

    const bodyContent = `
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 8px; color: #0f172a; font-size: 20px; font-weight: 800;">
          Hello ${data.clientName},
        </h2>
        <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
          Your quote request has been reviewed by our team:
        </p>
      </div>

      <div style="background: #f8fafc; border-left: 4px solid ${statusColor}; padding: 18px; border-radius: 4px 10px 10px 4px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${statusColor};">
          ${isAccepted ? 'Service Request Confirmed' : 'Status Update'}
        </p>
        ${isAccepted ? `
          <p style="margin: 10px 0 0 0; font-size: 15px; color: #1e293b;">
            Confirmed price: <strong style="font-size: 18px; color: #0f172a;">$${data.totalEstimado.toFixed(2)}</strong>
          </p>
        ` : ''}
        ${data.motivoRechazo ? `
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">
            <strong>Note:</strong> ${data.motivoRechazo}
          </p>
        ` : ''}
      </div>

      ${isAccepted ? `
        <p style="margin: 0 0 16px; color: #334155; font-size: 15px; line-height: 1.6;">
          We will contact you shortly to coordinate the exact appointment time. Thank you for choosing Marcela's Cleaning Services!
        </p>
      ` : `
        <p style="margin: 0 0 16px; color: #334155; font-size: 15px; line-height: 1.6;">
          If you have any questions or wish to adjust your requested service, please give Marcela a call directly.
        </p>
      `}
    `;

    const htmlContent = wrapBrandedTemplate(
      `Quote Update — Marcela's Cleaning Services`,
      bodyContent
    );

    const { error } = await client.emails.send({
      from: 'Marcela\'s Cleaning <onboarding@resend.dev>',
      to: data.clientEmail,
      subject: `Quote Update — ${isAccepted ? 'Accepted' : 'Update'}`,
      html: htmlContent,
    });

    if (error) {
      console.error('[MailService] Error sending review notification:', error);
      return false;
    }

    console.log(`[MailService] Review notification sent to ${data.clientEmail}`);
    return true;
  } catch (err) {
    console.error('[MailService] Exception sending review notification:', err);
    return false;
  }
}
