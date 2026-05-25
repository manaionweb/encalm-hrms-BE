import { Router } from 'express';
import { getPunchStatus, punchToggle, getAttendanceHistory, getAttendanceStats } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorizeRoles';
const router = Router();

router.use(authenticate);

router.get('/status', getPunchStatus);
router.post('/punch', punchToggle);
router.get('/history', getAttendanceHistory);
router.get('/stats', getAttendanceStats);
router.get(
   '/history',
   authenticate,
   authorizeRoles(['HR_ADMIN']),
   getAttendanceHistory
);
export default router;
