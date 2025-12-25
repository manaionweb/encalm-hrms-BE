import { Router } from 'express';
import { getEmployee, updateEmployee, addDocument, deleteDocument } from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth'; // Assuming auth middleware exists

const router = Router();

router.get('/:id', authenticate, getEmployee);
router.put('/:id', authenticate, updateEmployee);
router.post('/:id/documents', authenticate, addDocument);
router.delete('/:id/documents/:docId', authenticate, deleteDocument);

export default router;
