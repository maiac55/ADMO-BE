import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getSettings, updateSettings } from '../controllers/notificationController';

const router = Router();
router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
