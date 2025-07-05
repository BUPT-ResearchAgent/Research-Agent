package com.example.smartedu.service;

import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.Student;
import com.example.smartedu.entity.User;
import com.example.smartedu.entity.Course;
import com.example.smartedu.entity.Exam;
import com.example.smartedu.entity.Question;
import com.example.smartedu.repository.UserRepository;
import com.example.smartedu.repository.TeacherRepository;
import com.example.smartedu.repository.StudentRepository;
import com.example.smartedu.repository.CourseRepository;
import com.example.smartedu.repository.ExamRepository;
import com.example.smartedu.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

@Service
public class DataInitializationService implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private UserService userService;
    
    @Override
    public void run(String... args) throws Exception {
        initializeDefaultData();
    }
    
    private void initializeDefaultData() {
        try {
            // 检查是否已有管理员用户
            if (!userRepository.existsByUsername("admin")) {
                // 创建默认管理员
                User admin = userService.register("admin", "admin123", "admin");
                System.out.println("创建默认管理员账号: admin/admin123");
            }
            
            // 检查是否已有教师用户
            if (!userRepository.existsByUsername("teacher1")) {
                // 创建默认教师
                User teacherUser = userService.register("teacher1", "teacher123", "teacher");
                Teacher teacher = new Teacher(teacherUser, "张教授");
                teacher.setTeacherCode("T001");
                teacher.setDepartment("计算机科学与技术学院");
                teacher.setTitle("教授");
                teacher.setEducation("博士");
                teacher.setSpecialty("人工智能、机器学习");
                teacher.setIntroduction("从事人工智能研究20年，发表论文100余篇");
                teacher.setOfficeLocation("信息楼301");
                teacher.setOfficeHours("周一至周五 9:00-17:00");
                teacherRepository.save(teacher);
                System.out.println("创建默认教师账号: teacher1/teacher123");
            } else {
                // 更新现有教师信息
                java.util.Optional<Teacher> existingTeacherOpt = teacherRepository.findByTeacherCode("T001");
                if (existingTeacherOpt.isPresent()) {
                    Teacher existingTeacher = existingTeacherOpt.get();
                    existingTeacher.setRealName("张教授");
                    existingTeacher.setDepartment("计算机科学与技术学院");
                    existingTeacher.setTitle("教授");
                    existingTeacher.setEducation("博士");
                    existingTeacher.setSpecialty("人工智能、机器学习");
                    existingTeacher.setIntroduction("从事人工智能研究20年，发表论文100余篇");
                    existingTeacher.setOfficeLocation("信息楼301");
                    existingTeacher.setOfficeHours("周一至周五 9:00-17:00");
                    teacherRepository.save(existingTeacher);
                    System.out.println("更新默认教师信息: 张教授");
                }
            }
            
            // 检查是否已有学生用户
            if (!userRepository.existsByUsername("student1")) {
                // 创建默认学生
                User studentUser = userService.register("student1", "student123", "student");
                Student student = new Student(studentUser, "李小明");
                student.setStudentId("2024001");
                student.setClassName("计算机2024-1班");
                student.setMajor("计算机科学与技术");
                student.setGrade("2024级");
                student.setEntranceYear(2024);
                student.setGender("男");
                student.setAddress("北京市海淀区");
                student.setEmergencyContact("李父");
                student.setEmergencyPhone("13800138000");
                studentRepository.save(student);
                System.out.println("创建默认学生账号: student1/student123");
            }
            
            // 创建示例课程
            initializeSampleCourses();
            
            // 更新题目的知识点标记
            updateQuestionKnowledgePoints();
            
            System.out.println("数据初始化完成");
            
        } catch (Exception e) {
            System.err.println("数据初始化失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void initializeSampleCourses() {
        try {
            // 获取默认教师
            java.util.Optional<Teacher> teacherOpt = teacherRepository.findByTeacherCode("T001");
            if (!teacherOpt.isPresent()) {
                System.out.println("未找到默认教师，跳过课程创建");
                return;
            }
            Teacher teacher = teacherOpt.get();
            
            // 检查是否已有示例课程
            if (!courseRepository.existsByCourseCode("SE-9099")) {
                Course course1 = new Course();
                course1.setName("嵌入式Linux开发实践");
                course1.setCourseCode("SE-9099");
                course1.setDescription("暂无课程描述");
                course1.setCredit(3);
                course1.setHours(48);
                course1.setSemester("2025春");
                course1.setTeacher(teacher);
                course1.setMaxStudents(null); // 无限制
                course1.setCurrentStudents(1);
                courseRepository.save(course1);
                System.out.println("创建示例课程: 嵌入式Linux开发实践");
            }
            
            if (!courseRepository.existsByCourseCode("SE-3093")) {
                Course course2 = new Course();
                course2.setName("编程开发");
                course2.setCourseCode("SE-3093");
                course2.setDescription("编程开发");
                course2.setCredit(5);
                course2.setHours(80);
                course2.setSemester("2025春");
                course2.setTeacher(teacher);
                course2.setMaxStudents(null); // 无限制
                course2.setCurrentStudents(0);
                courseRepository.save(course2);
                System.out.println("创建示例课程: 编程开发");
            }
            
            if (!courseRepository.existsByCourseCode("SE-3125")) {
                Course course3 = new Course();
                course3.setName("物理");
                course3.setCourseCode("SE-3125");
                course3.setDescription("暂无课程描述");
                course3.setCredit(1);
                course3.setHours(16);
                course3.setSemester("2025春");
                course3.setTeacher(teacher);
                course3.setMaxStudents(null); // 无限制
                course3.setCurrentStudents(0);
                courseRepository.save(course3);
                System.out.println("创建示例课程: 物理");
            }
            
            
        } catch (Exception e) {
            System.err.println("创建示例课程失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void updateQuestionKnowledgePoints() {
        try {
            System.out.println("开始更新题目知识点标记...");
            
            // 获取所有题目
            java.util.List<Question> allQuestions = questionRepository.findAll();
            
            // 定义知识点映射
            java.util.Map<String, String> knowledgePointMap = new java.util.HashMap<>();
            
            // 编程相关知识点
            knowledgePointMap.put("变量", "变量与数据类型");
            knowledgePointMap.put("函数", "函数与方法");
            knowledgePointMap.put("循环", "循环结构");
            knowledgePointMap.put("条件", "条件判断");
            knowledgePointMap.put("数组", "数组与集合");
            knowledgePointMap.put("字符串", "字符串处理");
            knowledgePointMap.put("面向对象", "面向对象编程");
            knowledgePointMap.put("继承", "继承与多态");
            knowledgePointMap.put("封装", "封装与抽象");
            knowledgePointMap.put("算法", "算法与数据结构");
            knowledgePointMap.put("排序", "排序算法");
            knowledgePointMap.put("搜索", "搜索算法");
            knowledgePointMap.put("递归", "递归算法");
            knowledgePointMap.put("动态规划", "动态规划");
            knowledgePointMap.put("图论", "图论算法");
            knowledgePointMap.put("树", "树结构");
            knowledgePointMap.put("哈希", "哈希表");
            knowledgePointMap.put("栈", "栈与队列");
            knowledgePointMap.put("队列", "栈与队列");
            knowledgePointMap.put("链表", "链表结构");
            
            // 物理相关知识点
            knowledgePointMap.put("牛顿", "牛顿定律");
            knowledgePointMap.put("力学", "经典力学");
            knowledgePointMap.put("运动", "运动学");
            knowledgePointMap.put("能量", "能量守恒");
            knowledgePointMap.put("动量", "动量守恒");
            knowledgePointMap.put("电学", "电学基础");
            knowledgePointMap.put("磁学", "磁学基础");
            knowledgePointMap.put("光学", "光学基础");
            knowledgePointMap.put("热学", "热学基础");
            knowledgePointMap.put("波动", "波动光学");
            knowledgePointMap.put("量子", "量子力学");
            knowledgePointMap.put("相对论", "相对论");
            knowledgePointMap.put("电磁", "电磁学");
            knowledgePointMap.put("振动", "振动与波");
            knowledgePointMap.put("流体", "流体力学");
            
            // 嵌入式相关知识点
            knowledgePointMap.put("Linux", "Linux系统");
            knowledgePointMap.put("内核", "内核编程");
            knowledgePointMap.put("驱动", "设备驱动");
            knowledgePointMap.put("GPIO", "GPIO控制");
            knowledgePointMap.put("中断", "中断处理");
            knowledgePointMap.put("定时器", "定时器应用");
            knowledgePointMap.put("通信", "通信协议");
            knowledgePointMap.put("串口", "串口通信");
            knowledgePointMap.put("I2C", "I2C通信");
            knowledgePointMap.put("SPI", "SPI通信");
            knowledgePointMap.put("ARM", "ARM架构");
            knowledgePointMap.put("嵌入式", "嵌入式系统");
            knowledgePointMap.put("实时", "实时系统");
            knowledgePointMap.put("硬件", "硬件接口");
            knowledgePointMap.put("传感器", "传感器应用");
            
            int updatedCount = 0;
            
            for (Question question : allQuestions) {
                String currentKnowledgePoint = question.getKnowledgePoint();
                
                // 如果当前知识点为空或者是"通用知识点"，则尝试从题目内容中提取
                if (currentKnowledgePoint == null || currentKnowledgePoint.trim().isEmpty() || 
                    "通用知识点".equals(currentKnowledgePoint)) {
                    
                    String questionContent = question.getContent();
                    String detectedKnowledgePoint = "通用知识点";
                    
                    // 尝试从题目内容中匹配知识点
                    for (java.util.Map.Entry<String, String> entry : knowledgePointMap.entrySet()) {
                        if (questionContent.contains(entry.getKey())) {
                            detectedKnowledgePoint = entry.getValue();
                            break;
                        }
                    }
                    
                    question.setKnowledgePoint(detectedKnowledgePoint);
                    questionRepository.save(question);
                    updatedCount++;
                    
                    System.out.println("更新题目ID " + question.getId() + " 的知识点为: " + detectedKnowledgePoint);
                }
            }
            
            System.out.println("题目知识点更新完成，共更新了 " + updatedCount + " 个题目");
            
        } catch (Exception e) {
            System.err.println("更新题目知识点失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 