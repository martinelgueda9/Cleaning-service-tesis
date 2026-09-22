import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { cotizacionPublicSchema, cotizacionAdminSchema } from '../schemas/index.js';
import * as cotizacionController from '../controllers/cotizacion.controller.js';

const router = Router();

router.post('/', validateBody(cotizacionPublicSchema), cotizacionController.createPublic);

router.get('/', requireAuth, cotizacionController.getAll);
router.get('/:id', requireAuth, cotizacionController.getById);
router.post('/admin', requireAuth, validateBody(cotizacionAdminSchema), cotizacionController.createAdmin);
router.delete('/:id', requireAuth, cotizacionController.remove);

export default router;
