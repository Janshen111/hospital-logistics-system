const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../controllers/auth.controller');

// 仪表盘路由需要身份验证
router.use(authenticateToken);

// 仪表盘首页路由
router.get('/', (req, res) => {
  // 这里可以返回仪表盘数据或渲染仪表盘页面
  res.status(200).json({
    message: '仪表盘数据',
    user: req.user,
    // 可以添加更多仪表盘相关数据
  });
});

module.exports = router;