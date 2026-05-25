import { Router } from 'express';
import { getLeaveBalances, getLeaveHistory, applyLeave, updateLeaveStatus } from '../controllers/leave.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/balances', getLeaveBalances);
router.get('/history', getLeaveHistory);
router.post('/apply', applyLeave);
router.put('/:id/status', updateLeaveStatus);

export default router;
