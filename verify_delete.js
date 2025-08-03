// 验证管理员账号删除脚本
require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyDelete() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    console.log('数据库连接成功');

    // 要验证的账号
    const adminAccount = 'admin_new';

    // 执行查询
    const [rows] = await connection.execute(
      'SELECT * FROM personnel WHERE account = ?',
      [adminAccount]
    );

    if (rows.length === 0) {
      console.log(`验证成功: 账号 ${adminAccount} 已不存在`);
    } else {
      console.log(`验证失败: 账号 ${adminAccount} 仍然存在`);
      console.log('账号信息:', rows);
    }

    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');

  } catch (error) {
    console.error('验证删除失败:', error);
    process.exit(1);
  }
}

verifyDelete();