const db = require('./config/db');

async function removeNameColumn() {
  try {
    console.log('开始移除personnel表中的name列...');

    // 检查表结构
    const [columns] = await db.execute('SHOW COLUMNS FROM personnel');
    console.log('当前表列:', columns.map(col => col.Field));

    // 检查是否有name列
    const hasNameColumn = columns.some(col => col.Field === 'name');
    const hasAccountColumn = columns.some(col => col.Field === 'account');
    const hasUsernameColumn = columns.some(col => col.Field === 'username');

    // 如果有name列则删除
    if (hasNameColumn) {
      await db.execute('ALTER TABLE personnel DROP COLUMN name');
      console.log('已成功删除name列');
    } else {
      console.log('name列不存在，无需删除');
    }

    // 确保account列存在且唯一
    if (!hasAccountColumn) {
      await db.execute('ALTER TABLE personnel ADD COLUMN account VARCHAR(255) NOT NULL UNIQUE');
      console.log('已添加account列并设置为唯一');
    } else {
      // 确保account列是唯一的
      try {
        await db.execute('ALTER TABLE personnel ADD UNIQUE (account)');
        console.log('已设置account列为唯一');
      } catch (err) {
        console.log('account列已经是唯一的');
      }
    }

    // 确保username列存在
    if (!hasUsernameColumn) {
      await db.execute('ALTER TABLE personnel ADD COLUMN username VARCHAR(255) NOT NULL');
      console.log('已添加username列');
    }

    // 再次检查表结构
    const [newColumns] = await db.execute('SHOW COLUMNS FROM personnel');
    console.log('修改后的表列:', newColumns.map(col => col.Field));

    console.log('表结构修改完成');
  } catch (err) {
    console.error('修改表结构时出错:', err);
    throw err;
  }
}

removeNameColumn()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));