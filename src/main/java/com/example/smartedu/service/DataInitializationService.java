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
} 