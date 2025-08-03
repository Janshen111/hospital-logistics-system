const db = require('./config/db');

async function modifyPersonnelTable() {
  try {
    // 重命名name列为username
    await db.execute(`
      ALTER TABLE personnel
      CHANGE COLUMN name username VARCHAR(255) NOT NULL;
    `);

    // 添加新的name列存储姓名
    await db.execute(`
      ALTER TABLE personnel
      ADD COLUMN name VARCHAR(255) NOT NULL AFTER username;
    `);

    console.log('Personnel table modified successfully: name -> username, added new name column');
  } catch (err) {
    console.error('Error modifying personnel table:', err);
    throw err;
  }
}

modifyPersonnelTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));