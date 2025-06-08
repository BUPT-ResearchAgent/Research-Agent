package com.example.smartedu.repository;

import com.example.smartedu.entity.Course;
import com.example.smartedu.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    /**
     * 根据教师查找课程
     */
    List<Course> findByTeacher(Teacher teacher);
    
    /**
     * 根据教师ID查找课程
     */
    List<Course> findByTeacherId(Long teacherId);
    
    /**
     * 根据教师ID查找课程并按更新时间排序
     */
    List<Course> findByTeacherIdOrderByUpdatedAtDesc(Long teacherId);
    
    /**
     * 根据教师查找课程并按更新时间排序
     */
    List<Course> findByTeacherOrderByUpdatedAtDesc(Teacher teacher);
    
    /**
     * 检查课程代码是否存在
     */
    boolean existsByCourseCode(String courseCode);
    
    /**
     * 根据课程代码查找课程
     */
    Course findByCourseCode(String courseCode);
    
    /**
     * 根据课程状态查找课程
     */
    List<Course> findByStatus(String status);
    
    /**
     * 根据学期查找课程
     */
    List<Course> findBySemester(String semester);
    
    /**
     * 根据学年查找课程
     */
    List<Course> findByAcademicYear(String academicYear);
    
    /**
     * 根据学年和学期查找课程
     */
    List<Course> findByAcademicYearAndSemester(String academicYear, String semester);
    
    /**
     * 根据课程名称模糊查询
     */
    @Query("SELECT c FROM Course c WHERE c.name LIKE %:name%")
    List<Course> findByNameContaining(@Param("name") String name);
    
    /**
     * 根据教师姓名模糊查询课程
     */
    @Query("SELECT c FROM Course c JOIN c.teacher t WHERE t.realName LIKE %:teacherName%")
    List<Course> findByTeacherNameContaining(@Param("teacherName") String teacherName);
    
    /**
     * 统计课程总数
     */
    @Query("SELECT COUNT(c) FROM Course c")
    long countAllCourses();
    
    /**
     * 根据状态统计课程数量
     */
    long countByStatus(String status);
    
    /**
     * 根据教师统计课程数量
     */
    long countByTeacher(Teacher teacher);
} 