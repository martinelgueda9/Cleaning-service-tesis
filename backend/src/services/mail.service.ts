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
}

export async function sendContactEmailNotification(
  data: ContactNotificationData
): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn(
      '[MailService] RESEND_API_KEY no está configurada en .env. Se omite el envío de correo.'
    );
    return false;
  }

  try {
    const toEmail = env.notificationEmail;
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 15px; line-height: 1.8; color: #1e293b;">
        <p style="margin: 0 0 10px 0;"><strong>Nombre:</strong> ${data.name}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${data.email || 'No proporcionado'}</p>
        <p style="margin: 0 0 10px 0;"><strong>Teléfono:</strong> ${data.phone || 'No proporcionado'}</p>
        <p style="margin: 0;"><strong>Mensaje:</strong> ${data.message}</p>
      </div>
    `;

    const { error } = await client.emails.send({
      from: 'onboarding@resend.dev',
      to: toEmail,
      subject: `Contacto: ${data.name}`,
      html: htmlContent,
      replyTo: data.email || undefined,
    });

    if (error) {
      console.error('[MailService] Error de Resend al enviar email:', error);
      return false;
    }

    console.log(`[MailService] Correo enviado exitosamente a ${toEmail} para ${data.name}`);
    return true;
  } catch (err) {
    console.error('[MailService] Excepción al enviar correo:', err);
    return false;
  }
}

export async function sendQuoteEmailNotification(
  data: QuoteNotificationData
): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn(
      '[MailService] RESEND_API_KEY no está configurada en .env. Se omite el envío de correo.'
    );
    return false;
  }

  try {
    const toEmail = env.notificationEmail;
    const addonsFormatted =
      data.addons && data.addons.length > 0
        ? data.addons.join(', ')
        : 'Ninguno';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 15px; line-height: 1.8; color: #1e293b;">
        <p style="margin: 0 0 10px 0;"><strong>Cliente:</strong> ${data.clientName}</p>
        <p style="margin: 0 0 10px 0;"><strong>Teléfono:</strong> ${data.clientPhone || 'No proporcionado'}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${data.clientEmail || 'No proporcionado'}</p>
        <p style="margin: 0 0 10px 0;"><strong>Servicio:</strong> ${data.serviceType}</p>
        ${data.sizeLabel ? `<p style="margin: 0 0 10px 0;"><strong>Tamaño:</strong> ${data.sizeLabel}</p>` : ''}
        <p style="margin: 0 0 10px 0;"><strong>Add-ons:</strong> ${addonsFormatted}</p>
        <p style="margin: 0 0 10px 0;"><strong>Precio Estimado:</strong> ${data.estimatedPrice || 'Por definir'}</p>
        ${data.address ? `<p style="margin: 0 0 10px 0;"><strong>Dirección:</strong> ${data.address}</p>` : ''}
        ${data.notes ? `<p style="margin: 0;"><strong>Notas / Fecha:</strong> ${data.notes}</p>` : ''}
      </div>
    `;

    const { error } = await client.emails.send({
      from: 'onboarding@resend.dev',
      to: toEmail,
      subject: `Cotización: ${data.serviceType} - ${data.clientName}`,
      html: htmlContent,
      replyTo: data.clientEmail || undefined,
    });

    if (error) {
      console.error('[MailService] Error de Resend al enviar cotización:', error);
      return false;
    }

    console.log(`[MailService] Correo de cotización enviado a ${toEmail} para ${data.clientName}`);
    return true;
  } catch (err) {
    console.error('[MailService] Excepción al enviar cotización por email:', err);
    return false;
  }
}
