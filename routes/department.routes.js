const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authenticateToken } = require('../controllers/auth.controller');

// Input validation middleware for create
const validateCreateDepartment = [
  body('name').notEmpty().withMessage('部门名称不能为空'),
  body('description').optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Input validation middleware for update
const validateUpdateDepartment = [
  body('name').optional().notEmpty().withMessage('部门名称不能为空'),
  body('description').optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Get all departments (no authentication required)
router.get('/', departmentController.getAllDepartments);

// All other routes require authentication
router.use(authenticateToken);

// Get department by ID
router.get('/:id', departmentController.getDepartmentById);

// Get department statistics
router.get('/statistics', departmentController.getDepartmentStatistics);

// Create new department
router.post('/', validateCreateDepartment, departmentController.createDepartment);

// Update department
router.put('/:id', validateUpdateDepartment, departmentController.updateDepartment);

// Delete department
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;