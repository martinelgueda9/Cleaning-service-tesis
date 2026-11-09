import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { citaCreateSchema, citaUpdateSchema } from '../schemas/index.js';
import * as agendaController from '../controllers/agenda.controller.js';

const router = Router();

router.get('/mis-citas', requireAuth, agendaController.getMisCitas);

router.use(requireAuth);
router.use(requireRole('PROPIETARIA'));

router.get('/', agendaController.getAll);
router.get('/:id', agendaController.getById);
router.post('/', validateBody(citaCreateSchema), agendaController.create);
router.put('/:id', validateBody(citaUpdateSchema), agendaController.update);
router.patch('/:id/estado', agendaController.updateEstado);
router.delete('/:id', agendaController.remove);

export default router;
