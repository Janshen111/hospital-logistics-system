// 记录服务器初始化开始
console.log('Server initialization started at', new Date().toISOString());

// 其他依赖导入
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const fileUpload = require('express-fileupload');
let authRoutes, personnelRoutes, departmentRoutes, dashboardRoutes;
require('dotenv').config();

const app = express();
const PORT = 4000;

// Import routes
console.log('Server initialization sequence starting...');

// Import routes
console.log('Importing route modules...');
try {
  authRoutes = require('./routes/auth.routes');
  console.log('auth.routes imported successfully');
} catch (err) {
  console.error('Failed to import auth.routes:', err);
  process.exit(1);
}

try {
  personnelRoutes = require('./routes/personnel.routes');
  console.log('personnel.routes imported successfully');
} catch (err) {
  console.error('Failed to import personnel.routes:', err);
  process.exit(1);
}

try {
  departmentRoutes = require('./routes/department.routes');
  console.log('department.routes imported successfully');

try {
  dashboardRoutes = require('./routes/dashboard.routes');
  console.log('dashboard.routes imported successfully');
} catch (err) {
  console.error('Failed to import dashboard.routes:', err);
  process.exit(1);
}
} catch (err) {
  console.error('Failed to import department.routes:', err);
  process.exit(1);
}

// Middleware setup
console.log('Configuring middleware...');
// 允许所有前端来源（开发环境）
app.use(cors({
  origin: '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// 配置文件上传中间件
app.use(fileUpload({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  createParentPath: true,
  tempFileDir: './temp',
  useTempFiles: true
}));

// API routes
// API routes registration
console.log('Registering API routes...');
try {
  app.use('/api/auth', authRoutes);
  console.log('auth.routes registered successfully');
} catch (err) {
  console.error('Failed to register auth.routes:', err);
  process.exit(1);
}

try {
  app.use('/api/personnel', personnelRoutes);
  console.log('personnel.routes registered successfully');
} catch (err) {
  console.error('Failed to register personnel.routes:', err);
  process.exit(1);
}

try {
  app.use('/api/departments', departmentRoutes);
  console.log('department.routes registered successfully');

try {
  app.use('/dashboard', dashboardRoutes);
  console.log('dashboard.routes registered successfully');
} catch (err) {
  console.error('Failed to register dashboard.routes:', err);
  process.exit(1);
}
} catch (err) {
  console.error('Failed to register department.routes:', err);
  process.exit(1);
}
console.log('API routes registered successfully');

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Hospital Staff API' });
});

console.log('Initiating database connection check...');
(async () => {
  try {
    const [result] = await db.execute('SELECT 1');
    console.log('Database connected successfully during startup');

    // Debug: Log available network interfaces
    const os = require('os');
    const interfaces = os.networkInterfaces();
    console.log('Network interfaces:', interfaces);

    // Start server after successful database connection
    console.log('Attempting to start server on port 4000...');
    const server = app.listen(4000, '0.0.0.0', () => {
      console.log(`Server running on port 4000`);
      console.log(`Server address: http://localhost:4000`);
    });

    server.on('error', (err) => {
      console.error('Server error event:', {
        code: err.code,
        message: err.message,
        stack: err.stack,
        address: err.address,
        port: err.port
      });
      // If port is already in use, try another port
      if (err.code === 'EADDRINUSE') {
        console.log('Port 4000 is already in use, trying port 4001...');
        server.listen(4001, '0.0.0.0', () => {
          console.log(`Server running on port 4001`);
          console.log(`Server address: http://localhost:4001`);
        });
      }
    });

    // 添加服务器运行状态监控
    let heartbeatInterval = setInterval(() => {
      console.log('Server heartbeat - still running at', new Date().toISOString());
      // Log server connections
      try {
        const connections = server.getConnections((err, count) => {
          if (!err) console.log(`Current connections: ${count}`);
        });
      } catch (e) {
        console.error('Error getting connections:', e);
      }
    }, 2000);

    // 在服务器关闭时清除监控
    server.on('close', () => {
      clearInterval(heartbeatInterval);
      console.log('Server closed, heartbeat stopped');
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down server...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (err) {
    console.error('Critical error: Database connection failed during startup:', err.stack);
    process.exit(1);
  }
})();

// 增强console.error日志 - 修复对象输出问题
const originalConsoleError = console.error;
console.error = function(...args) {
  const timestamp = new Date().toISOString();
  // 处理参数，确保对象被正确序列化
  const processedArgs = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return arg;
  });
  const message = `${timestamp} - ERROR: ${processedArgs.join(' ')}`;
  originalConsoleError(message);
};

// 改进错误处理中间件
app.use((err, req, res, next) => {
  // 使用改进后的console.error，现在能正确显示对象
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  // 根据环境返回适当的错误信息
  const errorMessage = process.env.NODE_ENV === 'development'
    ? err.message
    : 'Something went wrong!';
  
  res.status(500).json({
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 改进全局异常处理
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', {
    message: err.message,
    stack: err.stack
  });
  // 记录错误后等待3秒再退出
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // 记录错误后等待3秒再退出
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});