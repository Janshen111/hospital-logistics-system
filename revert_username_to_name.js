const db = require('./config/db');

// 数据库字段回滚脚本
async function revertUsernameToName() {
  try {
    console.log('开始回滚用户名/姓名字段修改...');

    // 1. 先创建临时字段存储原始name数据
    await db.execute('ALTER TABLE personnel ADD COLUMN temp_name VARCHAR(255)');
    await db.execute('UPDATE personnel SET temp_name = name');

    // 2. 删除新增的name字段
    await db.execute('ALTER TABLE personnel DROP COLUMN name');

    // 3. 将username字段改回name
    await db.execute('ALTER TABLE personnel CHANGE COLUMN username name VARCHAR(255) NOT NULL');

    // 4. 恢复原始name数据
    await db.execute('UPDATE personnel SET name = temp_name');
    await db.execute('ALTER TABLE personnel DROP COLUMN temp_name');

    console.log('用户名/姓名字段回滚成功');
  } catch (error) {
    console.error('回滚过程中出错:', error);
    throw error;
  }
}

// 执行回滚
revertUsernameToName();