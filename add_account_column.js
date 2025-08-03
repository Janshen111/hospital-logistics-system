const db = require('./config/db');

async function addAccountColumn() {
  try {
    console.log('开始添加account字段...');
    
    // 检查字段是否已存在
    const [columns] = await db.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'personnel' AND column_name = 'account'"
    );
    
    if (columns.length > 0) {
      console.log('account字段已存在，无需重复添加');
      process.exit(0);
    }
    
    // 添加account字段
    await db.query(
      "ALTER TABLE personnel ADD COLUMN account VARCHAR(50) NULL AFTER id"
    );
    
    // 为现有记录生成唯一账号
    const [existingRecords] = await db.query("SELECT id FROM personnel WHERE account IS NULL");
    for (const record of existingRecords) {
      // 使用ID生成唯一账号
      const uniqueAccount = `user_${record.id}`;
      await db.query("UPDATE personnel SET account = ? WHERE id = ?", [uniqueAccount, record.id]);
    }

    // 修改字段为非空唯一
    await db.query("ALTER TABLE personnel MODIFY COLUMN account VARCHAR(50) NOT NULL UNIQUE");
    console.log('account字段添加并初始化成功');
    process.exit(0);
  } catch (err) {
    console.error('添加account字段失败:', err);
    process.exit(1);
  }
}

addAccountColumn();