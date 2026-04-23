import { Router } from 'express';
import { getStats, getLiveAttendance, getPendingApprovals, getEmployeeOverview } from '../controllers/dashboard.controller';

// Using a basic middleware mock if there's no auth middleware extracted yet,
// Wait, the auth.routes.ts might just use the controller directly without middleware.
// Let's assume there is a middleware or we just bypass auth strictly for this MVP if middleware isn't present.
// Actually, looking at auth routes, it might not have an authenticate middleware in this simple template.
// I will just use a simple mock middleware to decode the token so tenantId is available, 
// OR just rely on standard JWT token pass.
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
            if (err) {
                return res.sendStatus(403);
            }
            (req as any).user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/live-attendance', getLiveAttendance);
router.get('/pending-approvals', getPendingApprovals);
router.get('/employee-overview', getEmployeeOverview);

export default router;
