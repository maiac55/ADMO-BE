import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getHistory, logHistory } from '../controllers/historyController';

const router = Router();
router.use(authMiddleware);

router.get('/', getHistory);
router.post('/', logHistory);

export default router;
