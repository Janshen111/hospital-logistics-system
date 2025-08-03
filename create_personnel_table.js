const db = require('./config/db');

async function createPersonnelTable() {
  try {
    // 创建personnel表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS personnel (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account VARCHAR(13) NOT NULL UNIQUE,
        username VARCHAR(10) NOT NULL,
        gender ENUM('男', '女') NOT NULL,
        age INT NOT NULL,
        position VARCHAR(20) NOT NULL,
        department_id INT NOT NULL,
        hire_date DATE NOT NULL,
        phone VARCHAR(11) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        status ENUM('approved', 'pending', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      )
    `);

    console.log('Personnel table created successfully');
  } catch (err) {
    console.error('Error creating personnel table:', err);
    throw err;
  }
}

createPersonnelTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));