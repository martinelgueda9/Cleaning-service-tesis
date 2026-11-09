import { Request, Response } from 'express';
import prisma from '../config/db.js';
import * as cotizacionService from '../services/cotizacion.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  sendQuoteEmailNotification,
  sendQuoteCustomerConfirmation,
  sendQuoteReviewNotification,
} from '../services/mail.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { EstadoCotizacion } from '@prisma/client';

export async function getAll(req: Request, res: Response) {
  try {
    const estado = req.query.estado as EstadoCotizacion | undefined;
    const cotizaciones = await cotizacionService.findAll({ estado });
    sendSuccess(res, cotizaciones);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const cotizacion = await cotizacionService.findById(req.params.id);
    if (!cotizacion) {
      sendError(res, 'Cotización no encontrada', 404);
      return;
    }
    sendSuccess(res, cotizacion);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function createPublic(req: Request, res: Response) {
  try {
    const serviceType = req.body.serviceType || req.body.tipoLimpieza;
    if (!serviceType) {
      sendError(res, 'serviceType o tipoLimpieza es requerido');
      return;
    }

    const addonsObj =
      typeof req.body.addons === 'object' && !Array.isArray(req.body.addons) && req.body.addons !== null
        ? req.body.addons
        : {};

    const addonsList: string[] =
      Array.isArray(req.body.addonLabels) && req.body.addonLabels.length > 0
        ? req.body.addonLabels
        : Array.isArray(req.body.addons)
        ? req.body.addons
        : Object.entries(addonsObj)
            .filter(([_, qty]) => Number(qty) > 0)
            .map(([key, qty]) => `${key}${Number(qty) > 1 ? ` (x${qty})` : ''}`);

    let cotizacion = null;
    try {
      cotizacion = await cotizacionService.createPublic({
        ...req.body,
        serviceType,
        addons: addonsObj,
        addonLabels: addonsList,
      });
    } catch (dbErr) {
      console.warn(
        '[CotizacionController] Advertencia: Base de datos no disponible, pero la cotización se procesará por correo.',
        (dbErr as Error).message
      );
    }

    const codigo =
      cotizacion?.codigo ||
      `COT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const emailPayload = {
      clientName: req.body.nombre || req.body.fullName || 'Cliente Web',
      clientEmail: req.body.email,
      clientPhone: req.body.telefono || req.body.phone,
      serviceType: req.body.serviceLabel || req.body.serviceName || serviceType,
      sizeLabel: req.body.sizeLabel || req.body.size,
      addons: addonsList,
      estimatedPrice: req.body.estimatedPrice,
      address: req.body.direccion || req.body.address,
      notes: req.body.notas || req.body.notes,
      frequency: req.body.frequency,
      preferredDate: req.body.preferredDate,
      preferredTime: req.body.preferredTime,
      codigo,
    };

    sendQuoteEmailNotification(emailPayload).catch((err) =>
      console.error('[CotizacionController] Error enviando email de cotización al negocio:', err)
    );

    if (emailPayload.clientEmail) {
      sendQuoteCustomerConfirmation(emailPayload).catch((err) =>
        console.error('[CotizacionController] Error enviando confirmación al cliente:', err)
      );
    }

    sendSuccess(res, cotizacion || { registered: true, codigo, mailSent: true }, 201);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function createAdmin(req: Request, res: Response) {
  try {
    const cotizacion = await cotizacionService.createAdmin(req.body);
    sendSuccess(res, cotizacion, 201);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function revisar(req: AuthRequest, res: Response) {
  try {
    const { accion, motivo, cita } = req.body;

    if (!['aceptar', 'rechazar'].includes(accion)) {
      sendError(res, 'Acción inválida. Debe ser "aceptar" o "rechazar"');
      return;
    }

    const cotizacion = await cotizacionService.revisar(
      req.params.id,
      accion,
      req.userId!,
      motivo,
      cita
    );

    if (cotizacion.cliente.email) {
      sendQuoteReviewNotification({
        clientName: cotizacion.cliente.nombre,
        clientEmail: cotizacion.cliente.email,
        codigo: cotizacion.codigo,
        estado: cotizacion.estado,
        motivoRechazo: cotizacion.motivoRechazo || undefined,
        totalEstimado: cotizacion.totalEstimado,
      }).catch((err) =>
        console.error('[CotizacionController] Error enviando notificación de revisión:', err)
      );
    }

    sendSuccess(res, cotizacion);
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function getMisCotizaciones(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      sendError(res, 'No autenticado', 401);
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: { clienteId: true },
    });

    if (!usuario?.clienteId) {
      sendSuccess(res, []);
      return;
    }

    const cotizaciones = await cotizacionService.findByClienteId(usuario.clienteId);
    sendSuccess(res, cotizaciones);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await cotizacionService.remove(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
