package com.example.smartedu.service;

import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CourseService {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private StudentCourseRepository studentCourseRepository;
    
    /**
     * 学生加入课程
     */
    public void joinCourse(Long studentId, String courseCode) {
        // 查找学生
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("学生不存在"));
        
        // 查找课程
        Course course = courseRepository.findByCourseCode(courseCode);
        if (course == null) {
            throw new RuntimeException("课程不存在");
        }
        
        // 检查课程状态
        if (!"active".equals(course.getStatus())) {
            throw new RuntimeException("课程已关闭，无法加入");
        }
        
        // 检查是否已经加入（活跃状态）
        boolean alreadyJoined = studentCourseRepository.existsByStudentIdAndCourseIdAndStatus(
                studentId, course.getId(), "active");
        if (alreadyJoined) {
            throw new RuntimeException("您已经加入了这门课程");
        }
        
        // 检查课程容量
        if (course.getMaxStudents() != null && course.getCurrentStudents() >= course.getMaxStudents()) {
            throw new RuntimeException("课程已满员，无法加入");
        }
        
        // 检查是否存在已退出的记录
        Optional<StudentCourse> existingRecord = studentCourseRepository
                .findByStudentIdAndCourseId(studentId, course.getId());
        
        StudentCourse studentCourse;
        if (existingRecord.isPresent()) {
            // 如果存在记录，重新激活
            studentCourse = existingRecord.get();
            studentCourse.setStatus("active");
            studentCourse.setEnrollmentDate(LocalDateTime.now());
            studentCourse.setUpdatedAt(LocalDateTime.now());
        } else {
            // 如果不存在记录，创建新记录
            studentCourse = new StudentCourse(student, course);
        }
        
        studentCourseRepository.save(studentCourse);
        
        // 更新课程当前学生数
        course.setCurrentStudents(course.getCurrentStudents() + 1);
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
    }
    
    /**
     * 根据课程号查找课程
     */
    public Course findByCourseCode(String courseCode) {
        return courseRepository.findByCourseCode(courseCode);
    }
    
    /**
     * 获取学生已加入的课程列表
     */
    public List<Course> getStudentCourses(Long studentId) {
        return studentCourseRepository.findCoursesByStudentIdAndStatus(studentId, "active");
    }
    
    /**
     * 获取所有可加入的课程
     */
    public List<Course> getAvailableCourses() {
        return courseRepository.findByStatus("active");
    }
    
    /**
     * 检查学生是否已加入课程
     */
    public boolean isStudentEnrolled(Long studentId, Long courseId) {
        return studentCourseRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, "active");
    }
    
    /**
     * 退出课程
     */
    public void dropCourse(Long studentId, Long courseId) {
        Optional<StudentCourse> studentCourseOpt = studentCourseRepository
                .findByStudentIdAndCourseId(studentId, courseId);
        
        if (!studentCourseOpt.isPresent()) {
            throw new RuntimeException("您未加入此课程");
        }
        
        StudentCourse studentCourse = studentCourseOpt.get();
        if (!"active".equals(studentCourse.getStatus())) {
            throw new RuntimeException("您已经退出了此课程");
        }
        
        // 更新状态为退出
        studentCourse.setStatus("dropped");
        studentCourse.setUpdatedAt(LocalDateTime.now());
        studentCourseRepository.save(studentCourse);
        
        // 更新课程当前学生数
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        course.setCurrentStudents(Math.max(0, course.getCurrentStudents() - 1));
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
    }
    
    /**
     * 获取课程的活跃学生数量
     */
    public long getActiveCourseStudentCount(Long courseId) {
        return studentCourseRepository.countByCourseIdAndStatus(courseId, "active");
    }
    
    /**
     * 获取课程的活跃学生列表
     */
    public List<Student> getCourseStudents(Long courseId) {
        return studentCourseRepository.findStudentsByCourseIdAndStatus(courseId, "active");
    }
    
    /**
     * 同步课程学生数量（用于数据修复）
     */
    public void syncCourseStudentCount(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        long actualCount = getActiveCourseStudentCount(courseId);
        course.setCurrentStudents((int) actualCount);
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
    }
} 