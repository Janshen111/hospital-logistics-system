const bcrypt = require('bcrypt');
const pool = require('./config/db');

// 重置管理员密码为'admin123'
async function resetAdminPassword() {
  let connection;
  try {
    // 获取数据库连接
    connection = await pool.getConnection();
    console.log('数据库连接成功!');

    // 加密新密码
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('密码加密成功');

    // 更新管理员密码
    const [result] = await connection.execute(
      'UPDATE personnel SET password = ? WHERE account = ?',
      [hashedPassword, 'admin123']
    );

    if (result.affectedRows > 0) {
      console.log('管理员密码已成功重置为admin123');
    } else {
      console.log('未找到管理员账号admin123');
    }
  } catch (err) {
    console.error('重置密码过程中发生错误:', err);
  } finally {
    // 释放连接回连接池
    if (connection) connection.release();
    console.log('数据库连接已释放');
  }
}

// 执行函数
resetAdminPassword();