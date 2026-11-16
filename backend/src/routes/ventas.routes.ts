import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  ventaCreateSchema,
  ventaUpdateSchema,
  ventaPagoSchema,
  ventaAnularSchema,
} from '../schemas/index.js';
import * as ventasController from '../controllers/ventas.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('PROPIETARIA'));

router.get('/resumen', ventasController.getResumen);
router.get('/ingresos-mensuales', ventasController.getIngresosMensuales);
router.get('/export', ventasController.exportExcel);

router.get('/', ventasController.getAll);
router.get('/:id', ventasController.getById);
router.post('/', validateBody(ventaCreateSchema), ventasController.create);
router.put('/:id', validateBody(ventaUpdateSchema), ventasController.update);
router.patch('/:id/pago', validateBody(ventaPagoSchema), ventasController.registrarPago);
router.patch('/:id/anular', validateBody(ventaAnularSchema), ventasController.anular);

export default router;
