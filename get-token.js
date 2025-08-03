const fs = require('fs');
const axios = require('axios');

// 登录参数
const loginData = {
  account: 'admin_new',
  password: 'Admin123456'
};

// 基础URL
const baseURL = 'http://localhost:4001';

// 创建axios实例
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 登录函数
async function getToken() {
  try {
    console.log('尝试登录...');
    const response = await api.post('/api/auth/login', loginData);
    console.log('登录成功!');
    console.log('Token:', response.data.token);

    // 保存token到文件
    fs.writeFileSync('token.txt', response.data.token);
    console.log('Token已保存到token.txt文件');
  } catch (error) {
    console.error('登录失败:', error.response ? error.response.data : error.message);
  }
}

getToken();