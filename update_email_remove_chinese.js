require('dotenv').config();
const mysql = require('mysql2/promise');

// 生成随机英文邮箱
function generateRandomEmail() {
  const prefix = Math.random().toString(36).substring(2, 10);
  const domains = ['example.com', 'test.com', 'demo.com', 'mail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${prefix}@${domain}`;
}

// 主函数
async function updateEmails() {
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('成功连接到数据库');

    // 查找包含中文的邮箱
    const [rows] = await connection.execute(
      "SELECT id, email FROM personnel WHERE email REGEXP '[一-龥]'"
    );

    console.log(`找到 ${rows.length} 条包含中文的邮箱记录`);

    // 更新每条记录
    for (const row of rows) {
      const newEmail = generateRandomEmail();
      await connection.execute(
        "UPDATE personnel SET email = ? WHERE id = ?",
        [newEmail, row.id]
      );
      console.log(`已更新记录 ID: ${row.id}, 旧邮箱: ${row.email}, 新邮箱: ${newEmail}`);
    }

    console.log('所有包含中文的邮箱已更新完毕');
  } catch (error) {
    console.error('操作出错:', error);
  } finally {
    // 关闭连接
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行主函数
updateEmails();