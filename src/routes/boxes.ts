import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { connectBox, setPersonInfo, getAllBoxes, getBox, deleteBox } from '../controllers/boxController';

const router = Router();

router.use(authMiddleware);

router.post('/', connectBox);
router.put('/:id/person', setPersonInfo);
router.get('/', getAllBoxes);
router.get('/:id', getBox);
router.delete('/:id', deleteBox);

export default router;
