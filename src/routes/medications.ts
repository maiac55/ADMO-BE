import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getMedications, getMedication,
  addMedication, updateMedication, deleteMedication,
} from '../controllers/medicationController';

const router = Router();
router.use(authMiddleware);

router.get('/', getMedications);
router.get('/:id', getMedication);
router.post('/', addMedication);
router.put('/:id', updateMedication);
router.delete('/:id', deleteMedication);

export default router;
