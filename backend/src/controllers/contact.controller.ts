import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendContactEmailNotification } from '../services/mail.service.js';

export async function submitContact(req: Request, res: Response): Promise<void> {
  try {
    
    const { name, email, phone, message } = req.body;

    const cleanPhone = phone || 'Sin teléfono';
    const notaFormatted = `[Mensaje de Contacto Web - ${new Date().toLocaleString()}]: ${message}`;

    let cliente = null;

    try {
      if (cleanPhone && cleanPhone !== 'Sin teléfono') {
        cliente = await prisma.cliente.findFirst({ where: { telefono: cleanPhone } });
      }
      if (!cliente && email) {
        cliente = await prisma.cliente.findFirst({ where: { email } });
      }

      if (cliente) {
        cliente = await prisma.cliente.update({
          where: { id: cliente.id },
          data: {
            notas: cliente.notas ? `${cliente.notas}\n\n${notaFormatted}` : notaFormatted,
          },
        });
      } else {
        cliente = await prisma.cliente.create({
          data: {
            nombre: name,
            email: email || undefined,
            telefono: cleanPhone,
            direccion: 'Contacto Web',
            notas: notaFormatted,
          },
        });
      }
    } catch (dbErr) {
      console.warn('Advertencia al guardar en base de datos (se continúa):', (dbErr as Error).message);
    }

    sendContactEmailNotification({
      name,
      email,
      phone: cleanPhone,
      message,
    }).catch((mailErr) => {
      console.error('[ContactController] Error al disparar notificación de email:', mailErr);
    });

    sendSuccess(
      res,
      {
        message: '¡Gracias por comunicarte con nosotros! Te responderemos a la brevedad.',
        contact: {
          name,
          email,
          phone: cleanPhone,
          receivedAt: new Date().toISOString(),
        },
      },
      201
    );
  } catch (err) {
    console.error('Error en submitContact:', err);
    sendError(res, 'Ocurrió un error al procesar el mensaje de contacto', 500);
  }
}
