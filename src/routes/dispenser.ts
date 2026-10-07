import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getSlots, updateSlots, testAlert } from '../controllers/dispenserController';

const router = Router();
router.use(authMiddleware);

router.get('/slots', getSlots);
router.put('/slots', updateSlots);
router.post('/test-alert', testAlert);

export default router;
