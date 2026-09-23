import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getProfile, updateProfile, changePassword } from '../controllers/profileController';

const router = Router();
router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/change-password', changePassword);

export default router;
