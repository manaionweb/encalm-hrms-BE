import { Router } from 'express';
import { getPunchStatus, punchToggle, getAttendanceHistory, getAttendanceStats } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/status', getPunchStatus);
router.post('/punch', punchToggle);
router.get('/history', getAttendanceHistory);
router.get('/stats', getAttendanceStats);

export default router;
