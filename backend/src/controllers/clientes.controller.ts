import { Request, Response } from 'express';
import * as clientesService from '../services/clientes.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getAll(req: Request, res: Response) {
  try {
    const { q } = req.query;
    const clientes = q
      ? await clientesService.search(q as string)
      : await clientesService.findAll();
    sendSuccess(res, clientes);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const cliente = await clientesService.findById(req.params.id);
    if (!cliente) {
      sendError(res, 'Cliente no encontrado', 404);
      return;
    }
    sendSuccess(res, cliente);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const cliente = await clientesService.create(req.body);
    sendSuccess(res, cliente, 201);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const cliente = await clientesService.update(req.params.id, req.body);
    sendSuccess(res, cliente);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await clientesService.remove(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
