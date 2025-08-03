const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const personnelController = require('../controllers/personnel.controller');
const { authenticateToken } = require('../controllers/auth.controller');

// 统一错误处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Input validation middleware for create
const validateCreatePersonnel = [
  body('username').notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 2, max: 50 }).withMessage('用户名长度必须在2-50个字符之间'),
  body('gender').isIn(['男', '女']).withMessage('性别必须是男或女'),
  body('age').isInt({ min: 18, max: 65 }).withMessage('年龄必须在18-65之间'),
  body('position').notEmpty().withMessage('职位不能为空')
    .isLength({ max: 100 }).withMessage('职位名称不能超过100个字符'),
  body('department_id').isInt().withMessage('部门ID必须是整数'),
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('email').isEmail().withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('hire_date').isISO8601().withMessage('入职日期格式应为YYYY-MM-DD'),
  body('password').notEmpty().isLength({ min: 6 }).withMessage('密码不能为空且至少6个字符'),
  body('account').notEmpty().withMessage('账号为必填项')
    .isLength({ min: 3, max: 30 }).withMessage('账号长度必须在3-30个字符之间'),
  handleValidationErrors
];

// Input validation middleware for update
const validateUpdatePersonnel = [
  body('username').optional().notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 2, max: 50 }).withMessage('用户名长度必须在2-50个字符之间'),
  body('gender').optional().isIn(['男', '女']).withMessage('性别必须是男或女'),
  body('age').optional().isInt({ min: 18, max: 65 }).withMessage('年龄必须在18-65之间'),
  body('position').optional().notEmpty().withMessage('职位不能为空')
    .isLength({ max: 100 }).withMessage('职位名称不能超过100个字符'),
  body('department_id').optional().isInt().withMessage('部门ID必须是整数'),
  body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('hire_date').optional().isISO8601().withMessage('入职日期格式应为YYYY-MM-DD'),
  body('password').optional().notEmpty().isLength({ min: 6 }).withMessage('密码不能为空且至少6个字符'),
  body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('状态必须是pending、approved或rejected'),
  handleValidationErrors
];

// Input validation middleware for status update
const validateStatusUpdate = [
  body('status').notEmpty().withMessage('状态不能为空')
    .isIn(['pending', 'approved', 'rejected']).withMessage('无效的状态值，必须是pending、approved或rejected'),
  handleValidationErrors
];

// All routes require authentication
router.use(authenticateToken);

// Get all personnel
router.get('/', personnelController.getAllPersonnel);

// Get personnel by ID
router.get('/:id', personnelController.getPersonnelById);

// Create new personnel
router.post('/', validateCreatePersonnel, personnelController.createPersonnel);

// Update personnel
router.put('/:id', validateUpdatePersonnel, personnelController.updatePersonnel);

// Update personnel status
router.patch('/:id/status', validateStatusUpdate, personnelController.updatePersonnelStatus);

// Delete personnel
router.delete('/:id', authenticateToken, personnelController.deletePersonnel);

// Bulk import personnel
router.post('/bulk-import', authenticateToken, personnelController.bulkImportPersonnel);

module.exports = router;