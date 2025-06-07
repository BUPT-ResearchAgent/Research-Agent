package com.example.smartedu.repository;

import com.example.smartedu.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByTeacherId(Long teacherId);
    List<Course> findByTeacherIdOrderByUpdatedAtDesc(Long teacherId);
    
    // 检查课程代码是否存在
    boolean existsByCourseCode(String courseCode);
    
    // 根据课程代码查找课程
    Course findByCourseCode(String courseCode);
} 