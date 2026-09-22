import { Request, Response } from 'express';
import * as cotizacionService from '../services/cotizacion.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendQuoteEmailNotification } from '../services/mail.service.js';

export async function getAll(_req: Request, res: Response) {
  try {
    const cotizaciones = await cotizacionService.findAll();
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

    const addonsList = Array.isArray(req.body.addons)
      ? req.body.addons
      : typeof req.body.addons === 'object' && req.body.addons !== null
      ? Object.entries(req.body.addons)
          .filter(([_, qty]) => Number(qty) > 0)
          .map(([key, qty]) => `${key}${Number(qty) > 1 ? ` (x${qty})` : ''}`)
      : [];

    sendQuoteEmailNotification({
      clientName: req.body.nombre || req.body.fullName || 'Cliente Web',
      clientEmail: req.body.email,
      clientPhone: req.body.telefono || req.body.phone,
      serviceType: req.body.serviceName || req.body.serviceLabel || serviceType,
      sizeLabel: req.body.sizeLabel || req.body.size,
      addons: addonsList,
      estimatedPrice: req.body.estimatedPrice,
      address: req.body.direccion || req.body.address,
      notes: req.body.notas || req.body.notes,
    }).catch((err) =>
      console.error('[CotizacionController] Error enviando email de cotización:', err)
    );

    let cotizacion = null;
    try {
      cotizacion = await cotizacionService.createPublic({ ...req.body, serviceType });
    } catch (dbErr) {
      console.warn('[CotizacionController] Advertencia: Base de datos no disponible, pero la cotización fue notificada por correo.', (dbErr as Error).message);
    }

    sendSuccess(res, cotizacion || { registered: true, mailSent: true }, 201);
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

export async function remove(req: Request, res: Response) {
  try {
    await cotizacionService.remove(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
