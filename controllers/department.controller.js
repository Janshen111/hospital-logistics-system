const db = require('../config/db');

// Get department statistics with personnel count
exports.getDepartmentStatistics = async (req, res) => {
  try {
    // Check if user has admin or director role
    if (!['管理员', '主任'].includes(req.user.position)) {
      return res.status(403).json({ message: 'Unauthorized: Only administrators and directors can access statistics' });
    }

    const [rows] = await db.execute(
      `SELECT d.id, d.name, COUNT(p.id) as personnel_count
       FROM departments d
       LEFT JOIN personnel p ON d.id = p.department_id AND p.status = 'approved'
       GROUP BY d.id, d.name
       ORDER BY d.id ASC`
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching department statistics:', err);
    res.status(500).json({ message: 'Server error while fetching department statistics' });
  }
};

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM departments ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ message: 'Server error while fetching departments' });
  }
};

// Get department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM departments WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching department:', err);
    res.status(500).json({ message: 'Server error while fetching department' });
  }
};

// Create new department
exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if user has admin role
    if (req.user.position !== '管理员') {
      return res.status(403).json({ message: 'Unauthorized: Only administrators can create departments' });
    }

    const [result] = await db.execute(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [name, description]
    );

    const newDepartmentId = result.insertId;
    const [newDepartment] = await db.execute(
      'SELECT * FROM departments WHERE id = ?',
      [newDepartmentId]
    );

    res.status(201).json(newDepartment[0]);
  } catch (err) {
    console.error('Error creating department:', err);
    res.status(500).json({ message: 'Server error while creating department' });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if department exists
    const [existingDepartment] = await db.execute(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    if (existingDepartment.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if user has admin role
    if (req.user.position !== '管理员') {
      return res.status(403).json({ message: 'Unauthorized: Only administrators can update departments' });
    }

    await db.execute(
      'UPDATE departments SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );

    // Get updated department
    const [updatedDepartment] = await db.execute(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    res.json(updatedDepartment[0]);
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ message: 'Server error while updating department' });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const [existingDepartment] = await db.execute(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    if (existingDepartment.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if department has associated personnel
    const [personnelInDepartment] = await db.execute(
      'SELECT id FROM personnel WHERE department_id = ?',
      [id]
    );

    if (personnelInDepartment.length > 0) {
      return res.status(400).json({ message: 'Cannot delete department with associated personnel' });
    }

    // Check if user has admin role
    if (req.user.position !== '管理员') {
      return res.status(403).json({ message: 'Unauthorized: Only administrators can delete departments' });
    }

    await db.execute('DELETE FROM departments WHERE id = ?', [id]);
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({ message: 'Server error while deleting department' });
  }
};