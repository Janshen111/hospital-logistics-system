require('dotenv').config();
const pool = require('./config/db');

// 随机生成中文姓名
function generateChineseName() {
  const familyNames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
  const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平', '刚'];
  const familyName = familyNames[Math.floor(Math.random() * familyNames.length)];
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
  return familyName + givenName;
}

// 随机生成手机号
function generatePhone() {
  return '1' + ['3', '4', '5', '7', '8'][Math.floor(Math.random() * 5)] + Math.random().toString().substring(2, 11);
}

// 随机生成邮箱
function generateEmail(name) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', '163.com', 'qq.com'];
  return name.toLowerCase() + Math.floor(Math.random() * 100) + '@' + domains[Math.floor(Math.random() * domains.length)];
}

// 生成随机日期
function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

// 主函数
async function main() {
  try {
    // 获取部门ID列表
    const [departments] = await pool.query('SELECT id FROM departments');
    const departmentIds = departments.map(dept => dept.id);
    if (departmentIds.length === 0) {
      console.log('没有找到部门，请先添加部门');
      return;
    }

    // 要添加的职位列表
    const positions = ['主任', '护士', '医生', '护士长', '医技人员'];

    // 添加10条随机人员信息
    for (let i = 0; i < 10; i++) {
      const name = generateChineseName();
      const gender = Math.random() > 0.5 ? '男' : '女';
      const age = Math.floor(Math.random() * 30) + 20; // 20-50岁
      const position = positions[Math.floor(Math.random() * positions.length)];
      const departmentId = departmentIds[Math.floor(Math.random() * departmentIds.length)];
      const hireDate = generateRandomDate(new Date(2010, 0, 1), new Date());
      const phone = generatePhone();
      const email = generateEmail(name);
      const account = 'user' + Math.floor(Math.random() * 1000000);
      const password = 'password' + Math.floor(Math.random() * 10000);
      const status = 'active';

      // 插入数据
      await pool.query(
        'INSERT INTO personnel (account, username, gender, age, position, department_id, hire_date, phone, email, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [account, name, gender, age, position, departmentId, hireDate, phone, email, password, status]
      );

      console.log(`添加人员成功: ${name}, 职位: ${position}, 部门ID: ${departmentId}`);
    }

    console.log('成功添加10条随机人员信息');
  } catch (error) {
    console.error('添加人员失败:', error);
  } finally {
    // 关闭连接池
    pool.end();
  }
}

// 执行主函数
main();