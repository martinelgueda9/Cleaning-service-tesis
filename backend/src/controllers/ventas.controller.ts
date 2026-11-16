import { Request, Response } from 'express';
import { EstadoPago } from '@prisma/client';
import * as ventasService from '../services/ventas.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

const ESTADOS: EstadoPago[] = ['PENDIENTE', 'PAGADO', 'ANULADO'];

function handleError(res: Response, err: unknown) {
  if (err instanceof ventasService.VentaError) {
    sendError(res, err.message, err.status);
    return;
  }
  sendError(res, (err as Error).message, 500);
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function parseFilters(query: Request['query']): ventasService.VentaFilters {
  const estado = str(query.estado)?.toUpperCase() as EstadoPago | undefined;
  if (estado && !ESTADOS.includes(estado)) {
    throw new ventasService.VentaError('Estado de pago inválido');
  }
  return {
    estado,
    mes: str(query.mes),
    clienteId: str(query.clienteId),
    q: str(query.q),
  };
}

export async function getAll(req: Request, res: Response) {
  try {
    sendSuccess(res, await ventasService.findAll(parseFilters(req.query)));
  } catch (err) {
    handleError(res, err);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const venta = await ventasService.findById(req.params.id);
    if (!venta) {
      sendError(res, 'Venta no encontrada', 404);
      return;
    }
    sendSuccess(res, venta);
  } catch (err) {
    handleError(res, err);
  }
}

export async function getResumen(req: Request, res: Response) {
  try {
    sendSuccess(res, await ventasService.resumen(str(req.query.mes)));
  } catch (err) {
    handleError(res, err);
  }
}

export async function getIngresosMensuales(req: Request, res: Response) {
  try {
    const meses = Number(str(req.query.meses) ?? 12);
    sendSuccess(res, await ventasService.ingresosMensuales(meses, str(req.query.hasta)));
  } catch (err) {
    handleError(res, err);
  }
}

export async function exportExcel(req: Request, res: Response) {
  try {
    const filters = parseFilters(req.query);
    const buffer = await ventasService.exportarExcel(filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${ventasService.exportFileName(filters)}"`);
    res.send(buffer);
  } catch (err) {
    handleError(res, err);
  }
}

export async function create(req: Request, res: Response) {
  try {
    sendSuccess(res, await ventasService.create(req.body), 201);
  } catch (err) {
    handleError(res, err);
  }
}

export async function update(req: Request, res: Response) {
  try {
    sendSuccess(res, await ventasService.update(req.params.id, req.body));
  } catch (err) {
    handleError(res, err);
  }
}

export async function registrarPago(req: Request, res: Response) {
  try {
    sendSuccess(res, await ventasService.registrarPago(req.params.id, req.body));
  } catch (err) {
    handleError(res, err);
  }
}

export async function anular(req: Request, res: Response) {
  try {
    sendSuccess(res, await ventasService.anular(req.params.id, req.body?.motivo));
  } catch (err) {
    handleError(res, err);
  }
}

export async function getClientesCrm(req: Request, res: Response) {
  try {
    sendSuccess(res, await ventasService.clientesConResumen(str(req.query.q)));
  } catch (err) {
    handleError(res, err);
  }
}

export async function getClienteHistorial(req: Request, res: Response) {
  try {
    const historial = await ventasService.historialCliente(req.params.id);
    if (!historial) {
      sendError(res, 'Cliente no encontrado', 404);
      return;
    }
    sendSuccess(res, historial);
  } catch (err) {
    handleError(res, err);
  }
}
