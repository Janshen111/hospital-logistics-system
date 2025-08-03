const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

// 查询personnel表中的用户数据
async function queryPersonnel() {
  let connection;
  try {
    // 创建连接
    connection = await mysql.createConnection(config);
    console.log('数据库连接成功!');

    // 查询personnel表
    const [rows] = await connection.execute('SELECT id, account, password, status FROM personnel');
    console.log('人员数据:');
    rows.forEach(user => {
      console.log(`ID: ${user.id}, 账号: ${user.account}, 密码: ${user.password}, 状态: ${user.status}`);
    });

  } catch (error) {
    console.error('数据库连接或查询失败:', error);
  } finally {
    // 关闭连接
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行查询
queryPersonnel();