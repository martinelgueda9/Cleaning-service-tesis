import { Request, Response } from 'express';
import prisma from '../config/db.js';
import * as agendaService from '../services/agenda.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { EstadoCita } from '@prisma/client';

export async function getAll(req: Request, res: Response) {
  try {
    const { desde, hasta, estado } = req.query;
    const citas = await agendaService.findAll({
      desde: desde as string | undefined,
      hasta: hasta as string | undefined,
      estado: estado as EstadoCita | undefined,
    });
    sendSuccess(res, citas);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const cita = await agendaService.findById(req.params.id);
    if (!cita) {
      sendError(res, 'Cita no encontrada', 404);
      return;
    }
    sendSuccess(res, cita);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const cita = await agendaService.create(req.body);
    sendSuccess(res, cita, 201);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const cita = await agendaService.update(req.params.id, req.body);
    sendSuccess(res, cita);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function updateEstado(req: Request, res: Response) {
  try {
    const { estadoCita } = req.body;
    if (!['PROGRAMADA', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA'].includes(estadoCita)) {
      sendError(res, 'Estado de cita inválido');
      return;
    }
    const cita = await agendaService.updateEstado(req.params.id, estadoCita);
    sendSuccess(res, cita);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function getMisCitas(req: AuthRequest, res: Response) {
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

    const citas = await agendaService.findByClienteId(usuario.clienteId);
    sendSuccess(res, citas);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await agendaService.remove(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
