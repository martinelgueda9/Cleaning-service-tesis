import { Request, Response } from 'express';
import * as pricingService from '../services/pricing.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getPublicPricing(_req: Request, res: Response) {
  try {
    const data = await pricingService.getFullPricing();
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function getAllServices(_req: Request, res: Response) {
  try {
    const servicios = await pricingService.findAllServices();
    sendSuccess(res, servicios);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function createService(req: Request, res: Response) {
  try {
    const servicio = await pricingService.createService(req.body);
    sendSuccess(res, servicio, 201);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function updateService(req: Request, res: Response) {
  try {
    const servicio = await pricingService.updateService(req.params.id, req.body);
    sendSuccess(res, servicio);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function deleteService(req: Request, res: Response) {
  try {
    await pricingService.deleteService(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function createSizeOption(req: Request, res: Response) {
  try {
    const option = await pricingService.createSizeOption(req.body);
    sendSuccess(res, option, 201);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function updateSizeOption(req: Request, res: Response) {
  try {
    const option = await pricingService.updateSizeOption(req.params.id, req.body);
    sendSuccess(res, option);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function deleteSizeOption(req: Request, res: Response) {
  try {
    await pricingService.deleteSizeOption(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function getAllAddons(_req: Request, res: Response) {
  try {
    const addons = await pricingService.findAllAddonsAdmin();
    sendSuccess(res, addons);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function createAddon(req: Request, res: Response) {
  try {
    const addon = await pricingService.createAddon(req.body);
    sendSuccess(res, addon, 201);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function updateAddon(req: Request, res: Response) {
  try {
    const addon = await pricingService.updateAddon(req.params.id, req.body);
    sendSuccess(res, addon);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function deleteAddon(req: Request, res: Response) {
  try {
    await pricingService.deleteAddon(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
