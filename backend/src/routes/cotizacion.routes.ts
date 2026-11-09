import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { cotizacionPublicSchema, cotizacionAdminSchema } from '../schemas/index.js';
import * as cotizacionController from '../controllers/cotizacion.controller.js';

const router = Router();

router.post('/', validateBody(cotizacionPublicSchema), cotizacionController.createPublic);

router.get('/mis-cotizaciones', requireAuth, cotizacionController.getMisCotizaciones);

router.get('/', requireAuth, requireRole('PROPIETARIA'), cotizacionController.getAll);
router.get('/:id', requireAuth, cotizacionController.getById);
router.post('/admin', requireAuth, requireRole('PROPIETARIA'), validateBody(cotizacionAdminSchema), cotizacionController.createAdmin);
router.patch('/:id/revisar', requireAuth, requireRole('PROPIETARIA'), cotizacionController.revisar);
router.delete('/:id', requireAuth, requireRole('PROPIETARIA'), cotizacionController.remove);

export default router;
