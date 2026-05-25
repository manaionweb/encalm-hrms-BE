import { Router } from 'express';
import { login, forgotPassword } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);

export default router;