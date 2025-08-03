const axios = require('axios');

// 登录信息 - 使用现有管理员账户
const loginData = {
  account: 'user_1',  // 使用正确的管理员账号
  password: 'Admin123456'  // 使用正确的管理员密码
};

// 完整的管理人员数据（包含所有必填字段）
  const adminData = {
    account: 'admin_2',
    name: '李四',
    position: '主任医师',
    department_id: 2,  // 内科的ID
    gender: '男',
    age: 45,
    phone: '13800138000',
    email: 'lisi_new@hospital.com',
    hire_date: '2023-01-15',
    password: 'Admin123456',
    status: 'approved'
  };
  console.log('📤 发送的人员数据:', JSON.stringify(adminData, null, 2));

// 登录并创建管理人员
async function createAdmin() {
  try {
    // 1. 登录获取令牌
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', loginData);
    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到令牌');

    // 2. 创建管理人员
    const createResponse = await axios.post(
      'http://localhost:4000/api/personnel',
      adminData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('🚀 管理人员创建成功：');
    console.log(createResponse.data);
  } catch (error) {
    console.error('❌ 创建失败详情：');
    console.error('状态码：', error.response?.status);
    console.error('响应数据：', error.response?.data);
    console.error('错误消息：', error.message);
  }
}

// 执行创建操作
createAdmin();