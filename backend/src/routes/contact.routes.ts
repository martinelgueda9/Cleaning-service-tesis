import { Router } from 'express';
import * as contactController from '../controllers/contact.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { contactSchema } from '../schemas/index.js';

const router = Router();

router.post('/', validateBody(contactSchema), contactController.submitContact);

export default router;
