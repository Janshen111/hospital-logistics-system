const db = require('./config/db');

async function updatePersonnelDepartmentRelation() {
  try {
    // Check if department_id column exists
    const [columnCheck] = await db.execute(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['personnel', 'department_id']
    );

    // Add department_id column if it doesn't exist
    if (columnCheck.length === 0) {
      await db.execute(
        'ALTER TABLE personnel ADD COLUMN department_id INT NULL AFTER department'
      );
    }

    // Check if foreign key exists
    const [fkCheck] = await db.execute(
      `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
       WHERE TABLE_NAME = 'personnel' AND CONSTRAINT_NAME = 'fk_personnel_department'`
    );

    // Create foreign key constraint if it doesn't exist
    if (fkCheck.length === 0) {
      await db.execute(
        'ALTER TABLE personnel ADD CONSTRAINT fk_personnel_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL'
      );
    }

    // Update existing personnel records with department_id based on department name
    const [departments] = await db.execute('SELECT id, name FROM departments');
    const departmentMap = new Map(departments.map(dept => [dept.name, dept.id]));

    for (const [name, id] of departmentMap) {
      await db.execute(
        'UPDATE personnel SET department_id = ? WHERE department = ?',
        [id, name]
      );
    }

    // Check if old department column exists
    const [deptColumnCheck] = await db.execute(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['personnel', 'department']
    );

    // Remove old department column if it exists
    if (deptColumnCheck.length > 0) {
      await db.execute('ALTER TABLE personnel DROP COLUMN department');
    }

    console.log('Personnel table updated to use department_id foreign key successfully');
  } catch (err) {
    console.error('Error updating personnel department relation:', err);
  } finally {
    process.exit();
  }
}

updatePersonnelDepartmentRelation();