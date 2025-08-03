// 监听用户状态变化，一旦用户登录成功就导航
useEffect(() => {
  if (currentUser) {
    console.log('用户已登录，导航到:', redirectPath);
    // 添加微小延迟确保状态完全更新
    setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 100);
  }
}, [currentUser, navigate, redirectPath]);