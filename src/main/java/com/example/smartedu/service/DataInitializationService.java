package com.example.smartedu.service;

import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.Student;
import com.example.smartedu.entity.User;
import com.example.smartedu.repository.UserRepository;
import com.example.smartedu.repository.TeacherRepository;
import com.example.smartedu.repository.StudentRepository;
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
            
            System.out.println("数据初始化完成");
            
        } catch (Exception e) {
            System.err.println("数据初始化失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 