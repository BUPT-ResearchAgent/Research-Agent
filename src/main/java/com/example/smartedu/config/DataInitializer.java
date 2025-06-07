@Override
public void run(String... args) throws Exception {
    // 初始化默认用户
    initializeDefaultUsers();
    
    // 不再初始化课程数据，让用户自己创建课程
    System.out.println("课程数据初始化已禁用，用户需要自己创建课程");
} 