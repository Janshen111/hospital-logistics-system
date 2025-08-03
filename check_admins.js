// 检查管理员账号数量脚本
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAdminCount() {
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

    // 执行查询，查找所有管理员账号
    const [rows] = await connection.execute(
      'SELECT id, account, username, position FROM personnel WHERE position = ?',
      ['管理员']
    );

    console.log(`当前系统中的管理员账号数量: ${rows.length}`);
    console.log('管理员账号列表:', rows);

    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');

  } catch (error) {
    console.error('检查管理员账号失败:', error);
    process.exit(1);
  }
}

checkAdminCount();