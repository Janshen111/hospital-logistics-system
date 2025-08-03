const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
// 确保JWT_SECRET已设置
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET环境变量未设置，使用默认密钥');
}
// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, account: user.account, username: user.username, position: user.position },
    process.env.JWT_SECRET || 'your-default-secret-key', // 添加默认密钥以防环境变量未设置
    { expiresIn: '1h' } // 缩短token过期时间，提高安全性
  );
};

// Middleware to authenticate token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Register new user (pending approval)
exports.register = async (req, res) => {
  try {
    const { username, gender, age, position, department_id, hire_date, phone, email, password, account } = req.body;

    // Check if account or email already exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM personnel WHERE account = ? OR email = ?',
      [account, email]
    );

    if (existingUsers.length > 0) {
      // 检查是用户名还是邮箱重复
      if (existingUsers.some(user => user.username === username)) {
        return res.status(400).json({ message: '用户名已存在' });
      } else if (existingUsers.some(user => user.account === account)) {
        return res.status(400).json({ message: '账号已存在' });
      } else {
        return res.status(400).json({ message: '邮箱已存在' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with pending status
    const [result] = await db.execute(
      `INSERT INTO personnel (
        username, account, gender, age, position, department_id, hire_date, phone, email, password, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, account, gender, age, position, department_id, hire_date, phone, email, hashedPassword, 'pending']
    );

    res.status(201).json({ 
      message: '注册成功，请等待管理员审核'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: '注册过程中发生错误' });
  }
};

// Login function
exports.login = async (req, res) => {
  try {
    const { account, password } = req.body;

    // 验证account格式
    if (!account || account.length < 6 || account.length > 10 || /[一-龥]/.test(account)) {
      console.log('登录失败 - 账号格式不正确:', account);
      return res.status(400).json({ message: '账号必须为6-10位非中文字符' });
    }

    // Find user by account
    const query = 'SELECT * FROM personnel WHERE account = ?';
    const [rows] = await db.execute(query, [account]);

    if (rows.length === 0) {
      console.log('登录失败 - 账号不存在:', account);
      return res.status(401).json({ message: '账号或密码错误' });
    }

    const user = rows[0];
    console.log('找到用户 - 状态检查:', user.status);

    // Check if user is approved
    if (user.status !== 'approved') {
      console.log('用户状态未通过:', user.status);
      return res.status(403).json({
        message: user.status === 'pending' ? '用户名待审核，请等待管理员批准' : '用户名已被拒绝，请联系管理员'
      });
    }

    // Compare password with bcrypt
    console.log('密码验证 - 详细信息:', { storedHash: user.password, storedHashLength: user.password?.length, providedPassword: password, providedPasswordLength: password?.length, passwordTrimmed: password?.trim(), passwordTrimmedLength: password?.trim().length });
    let validPassword = false;
    // 调试密码验证过程
    try {
      validPassword = await bcrypt.compare(password.trim(), user.password || '');
      console.log('密码验证结果:', validPassword);
      if (!validPassword) {
        // 如果密码验证失败，记录日志
        console.log('密码验证失败 - 账号:', account);
      }
    } catch (bcryptError) {
      console.error('密码验证过程中发生错误:', bcryptError);
    }

    if (!validPassword) {
      console.log('登录失败 - 密码错误:', account);
      return res.status(401).json({ message: '账号或密码错误' });
    }

    // Generate token
    const token = generateToken(user);
    console.log('生成令牌 - 成功:', token.substring(0, 20) + '...');

    // Return token and user info
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        account: user.account,
        position: user.position,
        department_id: user.department_id,
        status: user.status
      }
    });

    console.log('登录成功:', account);


  } catch (err) {
    console.error('登录请求处理错误 - 完整详情:', { error: err, stack: err.stack, requestBody: req.body });
      console.error('Database query:', 'SELECT * FROM personnel WHERE account = ?', [account]);
    res.status(500).json({ 
      message: '登录过程中发生服务器错误', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined, 
    });
  }
};

// Get current user information
exports.getCurrentUser = async (req, res) => {
  try {
    console.log('获取当前用户信息 - 用户ID:', req.user.id);
    const [rows] = await db.execute(
        'SELECT id, username, gender, age, position, department_id, phone, email, status FROM personnel WHERE id = ?',
        [req.user.id]
      );
    console.log('获取用户信息查询结果 - 行数:', rows.length);
    console.log('获取用户信息查询结果 - 详情:', rows[0] ? JSON.stringify(rows[0], null, 2) : '无结果');

    if (rows.length === 0) {
      console.log('用户不存在 - ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('获取用户信息错误 - 完整详情:', { error: err, stack: err.stack });
    res.status(500).json({
      message: 'Server error while fetching user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // 验证token (即使已过期也能提取用户信息)
    let userData;
    try {
      // 设置ignoreExpiration为true以提取过期token中的数据
      userData = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-key', { ignoreExpiration: true });
    } catch (err) {
      return res.status(403).json({ message: 'Invalid token.' });
    }

    console.log('刷新token - 用户ID:', userData.id);
    // 查找用户信息以确保用户仍然存在且有效
    const [rows] = await db.execute(
      'SELECT id, username, position, status FROM personnel WHERE id = ?',
      [userData.id]
    );

    if (rows.length === 0) {
      console.log('刷新token失败 - 用户不存在:', userData.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // 检查用户状态
    if (user.status !== 'approved') {
      console.log('刷新token失败 - 用户状态未通过:', user.status);
      return res.status(403).json({
        message: user.status === 'pending' ? '用户名待审核，请等待管理员批准' : '用户名已被拒绝，请联系管理员'
      });
    }

    // 生成新token
    const newToken = generateToken(user);
    console.log('生成新token - 成功:', newToken.substring(0, 20) + '...');

    res.json({
      token: newToken
    });
  } catch (err) {
    console.error('刷新token错误 - 完整详情:', { error: err, stack: err.stack });
    res.status(500).json({
      message: 'Server error while refreshing token',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};