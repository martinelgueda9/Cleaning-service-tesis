import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { clienteCreateSchema, clienteUpdateSchema } from '../schemas/index.js';
import * as clientesController from '../controllers/clientes.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', clientesController.getAll);
router.get('/:id', clientesController.getById);
router.post('/', validateBody(clienteCreateSchema), clientesController.create);
router.put('/:id', validateBody(clienteUpdateSchema), clientesController.update);
router.delete('/:id', clientesController.remove);

export default router;
