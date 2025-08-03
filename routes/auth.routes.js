const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Register validation middleware
const validateRegister = [
  body('username').notEmpty().withMessage('姓名不能为空'),
  body('email').isEmail().withMessage('请输入有效的邮箱'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('department_id').isInt().withMessage('部门ID必须是整数'),
  body('position').notEmpty().withMessage('职位不能为空'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Login validation middleware
const validateLogin = [
  body('account').notEmpty().withMessage('账号不能为空')
    .isLength({ min: 6, max: 10 }).withMessage('账号必须为6-10位字符')
    .matches(/^[^一-龥]*$/).withMessage('账号不能包含中文'),
  body('password').notEmpty().withMessage('密码不能为空'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Register route
router.post('/register', validateRegister, authController.register);

// Login route
router.post('/login', validateLogin, authController.login);

// Get current user info
router.get('/me', authController.authenticateToken, authController.getCurrentUser);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

module.exports = router;