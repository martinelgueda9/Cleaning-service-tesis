import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { citaCreateSchema, citaUpdateSchema } from '../schemas/index.js';
import * as agendaController from '../controllers/agenda.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', agendaController.getAll);
router.get('/:id', agendaController.getById);
router.post('/', validateBody(citaCreateSchema), agendaController.create);
router.put('/:id', validateBody(citaUpdateSchema), agendaController.update);
router.delete('/:id', agendaController.remove);

export default router;
