const db = require('../config/db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const csv = require('csv-parser');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);

/**
 * 人员管理控制器
 * 标准CRUD实现，基于数据库人员表结构
 */

// 获取所有人员 - 支持分页和基本筛选
exports.getAllPersonnel = async (req, res) => {
  // 记录请求，但不包含敏感信息
  console.log('===== 收到getAllPersonnel请求 =====');
  console.log('请求时间:', new Date().toISOString());
  console.log('请求参数:', req.query);
  try {
    const { page = 1, limit = 10, account, department_id, status } = req.query;
    // 确保page和limit是整数
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    const queryParams = [];
    const whereClauses = [];

    // 构建查询条件
    if (account) {
      whereClauses.push('account LIKE ?');
      queryParams.push(`%${account}%`);
    }
    if (department_id) {
      whereClauses.push('department_id = ?');
      queryParams.push(department_id);
    }
    if (status) {
      whereClauses.push('status = ?');
      queryParams.push(status);
    }

    // 权限控制：普通用户只能查看已批准人员
    if (!['管理员', '主任'].includes(req.user.position)) {
      whereClauses.push('status = ?');
      queryParams.push('approved');
    }

    // 构建完整查询
    const whereClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    // 使用请求中的分页参数
    const [personnel] = await db.query(
      `SELECT * FROM personnel ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    // 获取总数用于分页
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM personnel ${whereClause}`,
      queryParams
    );

    res.json({
      success: true,
      data: personnel,
      pagination: {
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(countResult[0].total / limitNum)
      }
    });
  } catch (err) {
    console.error('获取人员列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取人员列表失败: ' + err.message
    });
  }
};

// 获取单个人员详情
exports.getPersonnelById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM personnel WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该人员'
      });
    }

    const personnel = rows[0];
    // 权限控制：非管理员只能查看已批准人员
    if (!['管理员', '主任'].includes(req.user.position) && personnel.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: '无权查看未批准人员信息'
      });
    }

    res.json({
      success: true,
      data: personnel
    });
  } catch (err) {
    console.error('获取人员详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取人员详情失败: ' + err.message
    });
  }
};

// 创建新人员
exports.createPersonnel = async (req, res) => {
  try {
    // 权限控制：管理员和主任可创建
    if (!['管理员', '主任'].includes(req.user.position)) {
      return res.status(403).json({
        success: false,
        message: '只有管理员和主任有权限创建人员'
      });
    }

    const { username, account, gender, age, position, department_id, hire_date, phone, email, password, status = 'pending' } = req.body;

    // 职位权限控制：只有管理员可以创建管理员
    if (position === '管理员' && req.user.position !== '管理员') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以创建管理员账户'
      });
    }

    // 管理员状态强制为已批准
    const finalStatus = position === '管理员' ? 'approved' : status;

    // 基本验证
    if (!account || !username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: '账号、用户名、邮箱和密码为必填项'
      });
    }

    // 验证account格式
    if (account.length < 6 || account.length > 13 || /[一-龥]/.test(account)) {
      return res.status(400).json({
        success: false,
        message: '账号必须为6-13位非中文字符'
      });
    }

    // 检查唯一性
    // 检查账号唯一性
const [accountExists] = await db.query('SELECT id FROM personnel WHERE account = ?', [account]);
if (accountExists.length) {
  return res.status(400).json({
    success: false,
    message: '该账号已被使用'
  });
}

// 检查邮箱唯一性
const [emailExists] = await db.query('SELECT id FROM personnel WHERE email = ?', [email]);
    if (emailExists.length) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被使用'
      });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入数据库
    const [result] = await db.query(
      `INSERT INTO personnel (
        account, username, gender, age, position, department_id, hire_date, phone, email, password, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [account, username, gender, age, position, department_id, hire_date, phone, email, hashedPassword, finalStatus]
    );

    res.status(201).json({
      success: true,
      message: '人员创建成功',
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('创建人员失败:', err);
    res.status(500).json({
      success: false,
      message: '创建人员失败: ' + err.message
    });
  }
};

// 更新人员信息
exports.updatePersonnel = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const isAdmin = req.user.position === '管理员';
    const isDirector = req.user.position === '主任';
    const isSelf = parseInt(id) === parseInt(req.user.id);

    // 职位变更权限控制
    if (updates.position && updates.position === '管理员' && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以设置管理员职位'
      });
    }

    // 如果更新管理员职位，强制状态为已批准
    if (updates.position === '管理员') {
      updates.status = 'approved';
    }

    // 权限控制
    if (!isAdmin && !isDirector && !isSelf) {
      return res.status(403).json({
        success: false,
        message: '没有权限修改此人员信息'
      });
    }

    // 主任不能修改管理员信息
    if (isDirector) {
      const [targetUser] = await db.query('SELECT position FROM personnel WHERE id = ?', [id]);
      if (targetUser.length > 0 && targetUser[0].position === '管理员') {
        return res.status(403).json({
          success: false,
          message: '主任不能修改管理员信息'
        });
      }
    }

    // 普通用户只能修改自己的基本信息
    if (!isAdmin && !isDirector && isSelf) {
      const allowedFields = ['username', 'phone', 'email', 'password'];
      Object.keys(updates).forEach(key => {
        if (!allowedFields.includes(key)) delete updates[key];
      });
    }

    // 密码加密
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // 检查account唯一性（如果更新了account）
    if (updates.account) {
      // 验证account格式
      if (updates.account.length < 6 || updates.account.length > 13 || /[一-龥]/.test(updates.account)) {
      return res.status(400).json({
        success: false,
        message: '账号必须为6-13位非中文字符'
      });
    }

      // 检查账号唯一性（排除当前人员）
      const [accountExists] = await db.query('SELECT id FROM personnel WHERE account = ? AND id != ?', [updates.account, id]);
      if (accountExists.length) {
        return res.status(400).json({
          success: false,
          message: '该账号已被使用'
        });
      }
    }

    // 构建更新查询
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    const [result] = await db.query(
      `UPDATE personnel SET ${setClause} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该人员'
      });
    }

    res.json({
      success: true,
      message: '人员信息更新成功'
    });
  } catch (err) {
    console.error('更新人员失败:', err);
    res.status(500).json({
      success: false,
      message: '更新人员失败: ' + err.message
    });
  }
};

// 更新人员状态
exports.updatePersonnelStatus = async (req, res) => {
  try {
    // 权限控制：仅管理员和主任可修改状态
    if (!['管理员', '主任'].includes(req.user.position)) {
      return res.status(403).json({
        success: false,
        message: '没有权限修改人员状态'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // 获取目标用户信息
    const [targetUserResult] = await db.query('SELECT position, id FROM personnel WHERE id = ?', [id]);
    if (targetUserResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该人员'
      });
    }
    const targetUser = targetUserResult[0];

    // 主任不能修改管理员状态或自己的状态
    if (req.user.position === '主任') {
      if (targetUser.position === '管理员' || targetUser.id === req.user.id) {
        return res.status(403).json({
          success: false,
          message: '主任不能修改管理员或自己的状态'
        });
      }
    }

    // 管理员不能修改自己的状态
    if (req.user.position === '管理员' && targetUser.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: '管理员不能修改自己的状态'
      });
    }

    // 验证状态值
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值，必须是pending、approved或rejected'
      });
    }

    const [result] = await db.query(
      'UPDATE personnel SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该人员'
      });
    }

    res.json({
      success: true,
      message: '人员状态更新成功'
    });
  } catch (err) {
    console.error('更新人员状态失败:', err);
    res.status(500).json({
      success: false,
      message: '更新人员状态失败: ' + err.message
    });
  }
};

// 批量导入人员
exports.bulkImportPersonnel = async (req, res) => {
  try {
    // 权限控制：只有管理员可以批量导入
    if (req.user.position !== '管理员') {
      return res.status(403).json({
        success: false,
        message: '只有管理员有权限批量导入人员'
      });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: '请上传CSV文件'
      });
    }

    const file = req.files.file;
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension !== 'csv') {
      return res.status(400).json({
        success: false,
        message: '只能上传CSV格式的文件'
      });
    }

    // 保存文件到临时目录
    const tempFilePath = `./temp/${Date.now()}-${file.name}`;
    await file.mv(tempFilePath);

    const results = [];
    const errors = [];
    let processedCount = 0;
    let importedCount = 0;

    // 解析CSV文件
    await pipeline(
      fs.createReadStream(tempFilePath),
      csv({
        headers: ['account', 'username', 'gender', 'age', 'position', 'department_id', 'hire_date', 'phone', 'email', 'password'],
        skipLines: 1 // 跳过标题行
      }),
      async function* (source) {
        for await (const row of source) {
          processedCount++;

          // 基本验证
          if (!row.account || !row.username || !row.password || !row.email) {
            errors.push({
              row: processedCount,
              message: '账号、用户名、密码和邮箱为必填项',
              data: row
            });
            continue;
          }

          // 验证账号格式
          if (row.account.length < 6 || row.account.length > 13 || /[一-龥]/.test(row.account)) {
            errors.push({
              row: processedCount,
              message: '账号必须为6-13位非中文字符',
              data: row
            });
            continue;
          }

          try {
            // 检查唯一性
            const [accountExists] = await db.query('SELECT id FROM personnel WHERE account = ?', [row.account]);
            if (accountExists.length) {
              errors.push({
                row: processedCount,
                message: '该账号已被使用',
                data: row
              });
              continue;
            }

            const [emailExists] = await db.query('SELECT id FROM personnel WHERE email = ?', [row.email]);
            if (emailExists.length) {
              errors.push({
                row: processedCount,
                message: '该邮箱已被使用',
                data: row
              });
              continue;
            }

            // 密码加密
            const hashedPassword = await bcrypt.hash(row.password, 10);

            // 职位权限控制：只有管理员可以创建管理员
            let status = 'pending';
            if (row.position === '管理员') {
              status = 'approved';
            }

            // 插入数据库
            const [result] = await db.query(
              `INSERT INTO personnel (
                account, username, gender, age, position, department_id, hire_date, phone, email, password, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                row.account, row.username, row.gender, row.age, row.position,
                row.department_id, row.hire_date, row.phone, row.email,
                hashedPassword, status
              ]
            );

            importedCount++;
            results.push({
              row: processedCount,
              id: result.insertId,
              message: '导入成功',
              data: row
            });
          } catch (err) {
            errors.push({
              row: processedCount,
              message: `导入失败: ${err.message}`,
              data: row
            });
          }
        }
      }
    );

    // 删除临时文件
    fs.unlinkSync(tempFilePath);

    res.json({
      success: true,
      message: `批量导入完成，共处理 ${processedCount} 条记录，成功导入 ${importedCount} 条，失败 ${errors.length} 条`,
      importedCount: importedCount,
      failedCount: errors.length,
      processedCount: processedCount,
      results: results,
      errors: errors
    });
  } catch (err) {
    console.error('批量导入人员失败:', err);
    res.status(500).json({
      success: false,
      message: '批量导入人员失败: ' + err.message
    });
  }
};

// 删除人员
exports.deletePersonnel = async (req, res) => {
  try {
    // 权限控制：管理员和主任可删除
    if (!['管理员', '主任'].includes(req.user.position)) {
      return res.status(403).json({
        success: false,
        message: '只有管理员和主任有权限删除人员'
      });
    }

    const { id } = req.params;
    // 主任不能删除管理员
    if (req.user.position === '主任') {
      const [targetUser] = await db.query('SELECT position FROM personnel WHERE id = ?', [id]);
      if (targetUser.length > 0 && targetUser[0].position === '管理员') {
        return res.status(403).json({
          success: false,
          message: '主任不能删除管理员'
        });
      }
    }

    const [result] = await db.query('DELETE FROM personnel WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该人员'
      });
    }

    res.json({
      success: true,
      message: '人员删除成功'
    });
  } catch (err) {
    console.error('删除人员失败:', err);
    res.status(500).json({
      success: false,
      message: '删除人员失败: ' + err.message
    });
  }
};
