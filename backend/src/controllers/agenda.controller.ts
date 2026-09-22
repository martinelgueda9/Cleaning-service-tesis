import { Request, Response } from 'express';
import * as agendaService from '../services/agenda.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getAll(req: Request, res: Response) {
  try {
    const { desde, hasta } = req.query;
    const citas = await agendaService.findAll({
      desde: desde as string | undefined,
      hasta: hasta as string | undefined,
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

export async function remove(req: Request, res: Response) {
  try {
    await agendaService.remove(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
