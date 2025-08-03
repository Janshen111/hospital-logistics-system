const db = require('./config/db');

// 添加password字段到personnel表
async function addPasswordColumn() {
  try {
    // 执行ALTER TABLE命令
    await db.execute('ALTER TABLE personnel ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT \'\'');
    console.log('✅ password字段添加成功');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ password字段已存在，无需重复添加');
    } else {
      console.error('❌ 添加字段失败:', error.message);
    }
  } finally {
    // 关闭数据库连接
    process.exit();
  }
}

// 执行添加字段操作
addPasswordColumn();