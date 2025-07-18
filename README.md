# SmartEdu 智囊系统 - 教师端后端实现

## 项目概述

SmartEdu是一个基于Spring Boot的智能教学系统，集成了DeepSeek大语言模型，为教师提供智能化的教学辅助功能。

## 主要功能

### 1. 备课与设计
- **上传课程资料**：支持多种格式文件上传，自动提取文本内容作为知识库
- **智能生成教学大纲**：基于上传的课程资料，调用DeepSeek API自动生成包含教学目的、教学思路、教学重点、教学难点、思政设计和教学设计的完整教学大纲
- **发布课程通知**：教师可发送课程相关通知，学生可在公告栏查看

### 2. 考核内容生成
- **智能题目生成**：根据知识库内容，教师选择章节/知识点、题目种类、测评时间、测评时长和测评班级，系统自动生成相应的考核题目
- **题目类型支持**：选择题（单选和多选）、填空题、判断题、计算题、解答题或教师自定义类型
- **答案解析**：自动生成题目解析和参考答案，教师可对不合理的解析答案进行修改
- **自动发布**：到达预定时间后自动发布测评
- **答案公布**：测评结束后，教师可选择是否向学生公布答案与解析

### 3. 学情数据分析
- **自动批改**：系统对学生答卷根据答案进行自动化批改
- **错误定位**：提供错误定位与修正建议
- **成绩管理**：教师可查看学生试卷与成绩，对有疑问的试卷或题目可进行更正
- **统计分析**：查看测评情况统计大屏，包括每道题的错误率与错误情况，以及错误对应知识点统计
- **改进建议**：生成教学改进建议

## 技术架构

### 后端技术栈
- **Spring Boot 3.5.0**：主框架
- **Spring Data JPA**：数据持久化
- **H2 Database**：内存数据库（开发环境）
- **Spring WebFlux**：HTTP客户端调用DeepSeek API
- **Jackson**：JSON处理

### 数据库设计
- **Course**：课程信息
- **CourseMaterial**：课程资料
- **TeachingOutline**：教学大纲
- **Notice**：通知公告
- **Exam**：考试信息
- **Question**：题目信息
- **ExamResult**：考试结果
- **StudentAnswer**：学生答案

## 快速开始

### 1. 环境要求
- Java 17+
- Maven 3.6+
- DeepSeek API密钥

### 2. 配置说明
在 `application.properties` 中配置：
```properties
# DeepSeek API配置
deepseek.api.url=https://api.deepseek.com/v1/chat/completions
deepseek.api.key=your-deepseek-api-key

# 文件存储路径
file.upload.path=./uploads
```

### 3. 启动应用
```bash
mvn spring-boot:run
```

### 4. 访问地址
- 教师端页面：http://localhost:8080/teacher.html
- API测试页面：http://localhost:8080/api-test.html
- H2数据库控制台：http://localhost:8080/h2-console

## API接口文档

### 教师端接口

#### 获取课程列表
```
GET /api/teacher/courses?teacherId={teacherId}
```

#### 上传课程资料
```
POST /api/teacher/materials/upload
Content-Type: multipart/form-data
参数：courseId, file
```

#### 生成教学大纲
```
POST /api/teacher/outline/generate?courseId={courseId}
```

#### 发布通知
```
POST /api/teacher/notices?courseId={courseId}&title={title}&content={content}
```

### 考试管理接口

#### 生成考试
```
POST /api/exam/generate
Content-Type: application/json
Body: ExamGenerationRequest
```

#### 发布考试
```
POST /api/exam/{examId}/publish
```

#### 发布答案
```
POST /api/exam/{examId}/publish-answers
```

## 前后端交互

### 前端集成
- `teacher-api.js`：封装了所有API调用的JavaScript模块
- `teacher.html`：教师端主页面，集成了API调用功能
- `api-test.html`：API测试页面，用于验证后端功能

### 数据流程
1. 教师上传课程资料 → 文件存储 → 内容提取 → 保存到数据库
2. 生成教学大纲 → 获取课程资料 → 调用DeepSeek API → 解析结果 → 显示大纲
3. 生成考试题目 → 获取知识库内容 → 调用DeepSeek API → 解析题目 → 保存到数据库
4. 学情分析 → 收集答题数据 → 统计分析 → 生成报告

## 开发说明

### 扩展功能
1. **文件处理**：当前支持TXT格式，可扩展支持PDF、Word等格式
2. **题目类型**：可根据需要添加更多题目类型
3. **统计分析**：可增加更详细的学情分析功能
4. **权限管理**：可添加用户认证和权限控制

### 注意事项
1. DeepSeek API需要有效的API密钥
2. 文件上传大小限制为50MB
3. 数据库使用H2内存数据库，重启后数据会丢失
4. 生产环境建议使用MySQL或PostgreSQL

## 测试指南

### 使用API测试页面
1. 访问 http://localhost:8080/api-test.html
2. 按顺序测试各个API功能
3. 查看返回结果和错误信息

### 测试数据
系统启动时数据库为空状态，所有数据需要用户手动创建：
- 课程列表为空
- 通知列表为空
- 统计数据为0

## 联系方式

如有问题或建议，请联系开发团队。 