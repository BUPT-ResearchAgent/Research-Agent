# 智囊SmartEdu

## 项目概述
智囊SmartEdu是一套面向现代教育场景的智能教学平台，集成教师端、学生端、管理端三大角色，融合大语言模型（DeepSeek）、AI知识库、自动出题、学情分析、智能消息、政策合规等多项前沿技术。平台致力于提升教学效率、优化学习体验、强化数据驱动决策，并为教育数字化转型提供一站式解决方案。

平台支持：
- 智能备课与教案生成
- 智能题库与自动出题
- 在线考试与自动批改
- 学情分析与个性化建议
- AI学习助手与智能问答
- 多角色权限与合规管理
- 政策文档与AI安全监控

## 主要功能
### 教师端
- **课程管理**：创建/编辑/归档课程，管理课程成员。
- **资料上传与知识库**：支持多格式（TXT、PDF、Word等）资料上传，自动提取文本并构建课程知识库。
- **智能教案生成**：基于知识库和大模型，自动生成教学大纲、教学目标、重点难点、思政设计等。
- **题库与出题**：按章节/知识点、题型（选择、填空、判断、计算、解答、自定义）智能生成题目，自动生成解析与参考答案。
- **考试管理**：创建、发布、定时考试，自动批改，成绩统计，支持答案与解析公布。
- **学情分析**：统计学生成绩、错题分布、知识点掌握情况，生成教学改进建议。
- **通知与消息**：发布课程公告、考试通知，支持消息推送与历史查询。

### 学生端
- **课程浏览与选课**：查看可选课程，加入/退出课程，查看课程资料与公告。
- **在线学习与资料下载**：访问课程知识库，下载学习资料。
- **在线考试与作业提交**：参加考试，提交作业，查看历史成绩与解析。
- **个人成绩与学情分析**：查看各科成绩、错题本、知识点掌握图谱，获取个性化学习建议。
- **AI学习助手**：基于课程知识库和大模型的智能问答，支持知识检索、疑难解答、学习建议。
- **互动与消息**：接收课程通知、考试提醒，与教师/同学互动。

### 管理端
- **用户管理**：批量导入/创建/编辑/删除教师和学生账号，分配角色与权限。
- **课程与考试全局管理**：审核课程、监控考试、管理资料与题库。
- **系统统计与活跃度分析**：统计用户活跃度、课程参与度、考试通过率等多维数据。
- **合规政策管理**：上传、维护政策文档，监控AI内容合规，生成合规报告。
- **AI安全与内容监控**：检测敏感内容、异常行为，支持审计与追踪。

## 技术架构
- **后端**：
  - Spring Boot 3.5.0（主框架）
  - Spring Data JPA（ORM与数据持久化）
  - Spring WebFlux（异步HTTP客户端，集成AI大模型API）
  - H2 Database（开发环境，支持MySQL/PostgreSQL切换）
  - Jackson（JSON序列化/反序列化）
  - 向量数据库/知识库（AI检索）
- **前端**：
  - HTML5、CSS3、JavaScript
  - 各端独立页面（teacher.html、student.html、admin.html、login.html、SmartEdu.html）
  - JS模块（teacher-api.js、student.js、admin.js等）封装API调用
- **AI能力**：
  - DeepSeek大语言模型API集成
  - 课程知识库向量化与语义检索
  - 智能问答、自动出题、内容生成
- **合规与安全**：
  - 内置政策文档（policy_documents/）
  - AI内容安全检测与监控
  - 数据权限分级、操作审计

## 快速开始
1. **环境准备**
   - 安装 Java 17 及以上
   - 安装 Maven 3.6 及以上
   - 获取 DeepSeek API 密钥

2. **前期准备：Docker安装与Milvus向量数据库部署**
   - 安装 Docker：
     1. 访问 Docker 官网，下载并安装 Docker Desktop，安装完成后启动 Docker。
     2. 安装完成后，可在命令行输入 `docker -v` 验证安装是否成功。
   - 部署 Milvus 向量数据库：
     1. 打开命令行，进入你希望存放 Milvus 配置的目录。
     2. 拉取 Milvus 官方 Docker Compose 配置文件：
        ```bash
        curl -fsSL https://raw.githubusercontent.com/milvus-io/milvus-docker-compose/master/docker-compose.yml -o docker-compose.yml
        ```
     3. 启动 Milvus 服务：
        ```bash
        docker-compose up -d
        ```
     4. 检查 Milvus 服务状态：
        ```bash
        docker ps
        ```
        正常情况下会看到 milvus-standalone、etcd、minio 等相关容器处于运行状态。
     5. （可选）如需图形化管理，可部署 Attu（Milvus 管理界面），具体可参考 Milvus 官方文档。
   - 注意事项：
     - 确保 Docker Desktop 已正常运行。
     - Milvus 默认使用 19530 端口（可在 docker-compose.yml 中修改）。
     - 启动后如需停止服务，可执行 `docker-compose down`。
     - 如遇端口冲突或资源不足，请调整 Docker 配置或释放端口资源。

3. **配置**
   - 编辑 `src/main/resources/application.properties` 或 `application.yml`，配置如下：
     ```properties
     # DeepSeek API配置
     deepseek.api.url=https://api.deepseek.com/v1/chat/completions
     deepseek.api.key=your-deepseek-api-key
     # 文件存储路径
     file.upload.path=./uploads
     # 数据库配置（开发默认H2，可切换MySQL/PostgreSQL）
     ```
4. **启动后端服务**
   ```bash
   mvn spring-boot:run
   ```
5. **访问前端页面**
   - 教师端：http://localhost:8080/teacher.html
   - 学生端：http://localhost:8080/student.html
   - 管理端：http://localhost:8080/admin.html
   - 登录页：http://localhost:8080/login.html
   - 主页：http://localhost:8080/SmartEdu.html
6. **默认数据库为空**，请先注册用户、创建课程等。

## API接口文档
### 认证与用户管理
- 用户注册：
  - `POST /api/auth/register`  
    参数：username, password, role
- 用户登录：
  - `POST /api/auth/login`  
    参数：username, password, role
- 用户登出：
  - `POST /api/auth/logout`
- 获取/更新个人信息、修改密码、角色切换等

### 教师端接口
- 获取课程列表：
  - `GET /api/teacher/courses?teacherId={teacherId}`
- 上传课程资料：
  - `POST /api/teacher/materials/upload`  
    Content-Type: multipart/form-data，参数：courseId, file
- 生成教学大纲：
  - `POST /api/teacher/outline/generate?courseId={courseId}`
- 题库管理、考试发布、成绩统计、公告发布等

### 学生端接口
- 获取可选课程：
  - `GET /api/student/courses`
- 加入/退出课程：
  - `POST /api/student/courses/join`，`POST /api/student/courses/leave`
- 参加考试、提交作业、获取成绩、AI问答等

### 管理端接口
- 用户管理：
  - `GET /api/admin/users`，`POST /api/admin/users`，`PUT /api/admin/users/{userId}`，`DELETE /api/admin/users/{userId}`
- 课程/考试/资料全局管理、合规报告、系统统计等

### AI与知识库接口
- 智能问答：
  - `POST /api/ai-helper/chat`  
    参数：userId, courseId, message
- 知识检索、内容生成、AI安全检测等

> 更多接口详见各Controller源码及前端JS模块。

## 前后端交互
- **页面与API**：前端页面通过AJAX/Fetch等方式调用RESTful API，所有接口支持跨域。
- **主要页面说明**：
  - `teacher.html`：教师端主界面，集成课程、资料、题库、考试、学情、公告等功能
  - `student.html`：学生端主界面，集成选课、学习、考试、成绩、AI助手、消息等
  - `admin.html`：管理端主界面，集成用户、课程、合规、统计等管理功能
  - `login.html`：统一登录入口，支持多角色
  - `SmartEdu.html`：智能问答与导航主页
- **数据流示例**：
  1. 教师上传资料 → 后端解析 → 知识库入库 → 可用于AI出题/问答
  2. 学生提问 → AI助手检索知识库+大模型生成答案 → 返回前端展示
  3. 教师发布考试 → 学生参加 → 自动批改 → 成绩/错题统计 → 学情分析
- **前端JS模块**：如 `teacher-api.js`、`student.js`、`admin.js` 封装API调用逻辑，便于维护和扩展。

## 开发说明
- **扩展性**：
  - 支持自定义题型、知识库格式、AI模型API
  - 可扩展更多统计分析、个性化推荐、互动功能
- **安全与合规**：
  - API密钥、用户数据、文件上传等需妥善保护
  - 合规政策可根据实际需求扩展，支持政策文档自动推送
  - AI内容安全检测建议结合实际场景调整
- **部署建议**：
  - 生产环境建议使用MySQL/PostgreSQL，H2仅用于开发测试
  - 文件存储路径、数据库连接等参数请根据实际环境配置
- **常见问题**：
  - DeepSeek API需有效密钥，否则AI相关功能不可用
  - 文件上传大小默认限制为50MB，可在配置中调整
  - 数据库为空时需手动创建初始数据

## 测试指南
1. **功能测试**
   - 访问 http://localhost:8080/login.html，注册并登录不同角色账号
   - 教师端：测试课程创建、资料上传、出题、考试发布、学情分析、公告等
   - 学生端：测试选课、学习、考试、成绩查询、AI问答、消息等
   - 管理端：测试用户管理、课程/考试全局管理、合规报告、系统统计等
2. **API测试**
   - 使用 Postman、curl 或内置API测试页面，验证各端API接口
   - 检查接口返回数据、错误处理、权限校验等
3. **数据初始化与清理**
   - 系统启动时数据库为空，需手动注册用户、创建课程等
   - 可通过管理端批量导入/删除数据
4. **异常与安全测试**
   - 测试无权限访问、参数异常、文件超限、AI内容安全等场景
5. **日志与监控**
   - 检查后端日志输出，关注AI调用、数据存储、异常处理等