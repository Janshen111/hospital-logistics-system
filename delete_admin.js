// 删除管理员账号脚本
require('dotenv').config();
const mysql = require('mysql2/promise');

async function deleteAdminAccount() {
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

    // 要删除的管理员账号
    const adminAccount = 'admin_new';

    // 执行删除操作
    const [result] = await connection.execute(
      'DELETE FROM personnel WHERE account = ?',
      [adminAccount]
    );

    console.log(`删除账号 ${adminAccount} 成功，影响行数: ${result.affectedRows}`);

    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');

  } catch (error) {
    console.error('删除管理员账号失败:', error);
    process.exit(1);
  }
}

deleteAdminAccount();