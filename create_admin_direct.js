const mysql = require('mysql2/promise');
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// 数据库连接配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

// 新管理员账号信息
const adminData = {
  account: 'admin123',
  username: 'admin',
  password: 'admin123', // 明文密码
  position: '管理员',
  department_id: 1, // 假设1是管理部门的ID
  gender: '男',
  age: 30,
  phone: '13800138000',
  email: 'admin@hospital.com',
  hire_date: '2023-01-01',
  status: 'approved' // 直接设置为已批准
};

// 直接创建管理员账号
async function createAdminDirect() {
  let connection;
  try {
    // 创建连接
    connection = await mysql.createConnection(config);
    console.log('数据库连接成功!');

    // 加密密码
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    console.log('密码加密成功');

    // 插入管理员数据
    const [result] = await connection.execute(
      `INSERT INTO personnel (
        account, username, password, position, department_id, gender, age, phone, email, hire_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminData.account,
        adminData.username,
        hashedPassword,
        adminData.position,
        adminData.department_id,
        adminData.gender,
        adminData.age,
        adminData.phone,
        adminData.email,
        adminData.hire_date,
        adminData.status
      ]
    );

    console.log('管理员账号创建成功!');
    console.log(`账号: ${adminData.account}`);
    console.log(`密码: ${adminData.password}`);
    console.log(`影响的行数: ${result.affectedRows}`);

  } catch (error) {
    console.error('数据库连接或插入失败:', error);
  } finally {
    // 关闭连接
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行创建操作
createAdminDirect();