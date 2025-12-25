import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as MastersController from '../controllers/masters.controller';

const router = Router();

router.use(authenticate);

// Company
router.get('/company', MastersController.getCompany);
router.post('/company', MastersController.updateCompany);

// Locations
router.get('/locations', MastersController.getAll('location'));
router.post('/locations', MastersController.createLocation);

// Departments
router.get('/departments', MastersController.getAll('department'));
router.post('/departments', MastersController.createDepartment);

// Designations
router.get('/designations', MastersController.getAll('designation'));
router.post('/designations', MastersController.create('designation'));

// Statutory
router.get('/salary-components', MastersController.getAll('salaryComponent'));
router.post('/salary-components', MastersController.create('salaryComponent'));

router.get('/statutory-settings', MastersController.getStatutorySettings);
router.post('/statutory-settings', MastersController.updateStatutorySettings);

router.get('/professional-tax-slabs', MastersController.getAll('professionalTaxSlab'));
router.post('/professional-tax-slabs', MastersController.create('professionalTaxSlab'));

router.get('/bank-masters', MastersController.getAll('bankMaster'));
router.post('/bank-masters', MastersController.create('bankMaster'));

// Attendance
router.get('/shifts', MastersController.getAll('shift'));
router.post('/shifts', MastersController.create('shift'));

router.get('/holidays', MastersController.getAll('holiday'));
router.post('/holidays', MastersController.create('holiday'));

// Leave Types (includes policy)
router.get('/leave-types', MastersController.getAll('leaveType'));
router.post('/leave-types', MastersController.create('leaveType'));

// Attendance Policy
router.get('/attendance-policy', MastersController.getAttendancePolicy);
router.post('/attendance-policy', MastersController.updateAttendancePolicy);

// Access Control
router.get('/permissions', MastersController.getPermissions);
router.get('/roles', MastersController.getRoles);
router.post('/roles', MastersController.createRole);
router.put('/roles/:id', MastersController.updateRole);

// Geo
router.get('/states', MastersController.getStates);
router.get('/cities', MastersController.getCities);

export default router;
