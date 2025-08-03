const db = require('./config/db');

async function createDepartmentsTable() {
  try {
    // Create departments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default departments if they don't exist
    const departments = [
      ['人事部', '负责人力资源管理工作'],
      ['组织部', '负责组织建设工作'],
      ['宣传部', '负责宣传工作'],
      ['妇产科', '负责妇产科诊疗工作'],
      ['行政部', '负责医院行政管理工作'],
      ['内科', '负责内科诊疗工作'],
      ['外科', '负责外科诊疗工作'],
      ['儿科', '负责儿科诊疗工作'],
      ['急诊科', '负责急诊患者救治工作'],
      ['检验科', '负责临床检验工作'],
      ['影像科', '负责医学影像检查工作']
    ];

    for (const [name, description] of departments) {
      await db.execute(
        'INSERT IGNORE INTO departments (name, description) VALUES (?, ?)',
        [name, description]
      );
    }

    console.log('Departments table created and initialized successfully');
  } catch (err) {
    console.error('Error creating departments table:', err);
  } finally {
    process.exit();
  }
}

createDepartmentsTable();