package com.example.smartedu.config;

import com.example.smartedu.entity.Course;
import com.example.smartedu.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // 检查是否已有课程数据
        if (courseRepository.count() == 0) {
            // 添加测试课程数据
            Course course1 = new Course();
            course1.setName("Java程序设计");
            course1.setCourseCode("CS001");
            course1.setDescription("Java基础编程课程");
            course1.setCredit(3);
            course1.setHours(48);
            course1.setTeacherId(1L);
            course1.setTeacherName("张老师");
            courseRepository.save(course1);
            
            Course course2 = new Course();
            course2.setName("数据结构与算法");
            course2.setCourseCode("CS002");
            course2.setDescription("数据结构和算法分析");
            course2.setCredit(4);
            course2.setHours(64);
            course2.setTeacherId(1L);
            course2.setTeacherName("张老师");
            courseRepository.save(course2);
            
            Course course3 = new Course();
            course3.setName("数据库系统原理");
            course3.setCourseCode("CS003");
            course3.setDescription("关系数据库设计和SQL");
            course3.setCredit(3);
            course3.setHours(48);
            course3.setTeacherId(1L);
            course3.setTeacherName("张老师");
            courseRepository.save(course3);
            
            System.out.println("已初始化测试课程数据");
        } else {
            System.out.println("课程数据已存在，跳过初始化");
        }
    }
} 