const pool = require('./config/db');

// 查询管理员账号状态
async function checkUserStatus() {
  let connection;
  try {
    // 获取数据库连接
    connection = await pool.getConnection();
    console.log('数据库连接成功!');

    // 查询管理员账号状态
    const [rows] = await connection.execute(
      'SELECT id, account, status, password FROM personnel WHERE account = ?',
      ['admin123']
    );

    if (rows.length > 0) {
      console.log('找到管理员账号:');
      console.log(`ID: ${rows[0].id}`);
      console.log(`账号: ${rows[0].account}`);
      console.log(`状态: ${rows[0].status}`);
      console.log(`密码哈希长度: ${rows[0].password?.length}`);
    } else {
      console.log('未找到管理员账号admin123');
    }
  } catch (err) {
    console.error('查询过程中发生错误:', err);
  } finally {
    // 释放连接回连接池
    if (connection) connection.release();
    console.log('数据库连接已释放');
  }
}

// 执行函数
checkUserStatus();