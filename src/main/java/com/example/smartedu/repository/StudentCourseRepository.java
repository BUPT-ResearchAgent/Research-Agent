package com.example.smartedu.repository;

import com.example.smartedu.entity.StudentCourse;
import com.example.smartedu.entity.Student;
import com.example.smartedu.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentCourseRepository extends JpaRepository<StudentCourse, Long> {
    
    /**
     * 根据学生ID和课程ID查找关联记录
     */
    Optional<StudentCourse> findByStudentIdAndCourseId(Long studentId, Long courseId);
    
    /**
     * 根据学生查找已加入的课程
     */
    List<StudentCourse> findByStudentAndStatus(Student student, String status);
    
    /**
     * 根据学生ID查找已加入的课程
     */
    List<StudentCourse> findByStudentIdAndStatus(Long studentId, String status);
    
    /**
     * 根据课程查找已加入的学生
     */
    List<StudentCourse> findByCourseAndStatus(Course course, String status);
    
    /**
     * 根据课程ID查找已加入的学生
     */
    List<StudentCourse> findByCourseIdAndStatus(Long courseId, String status);
    
    /**
     * 检查学生是否已加入指定课程
     */
    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, String status);
    
    /**
     * 统计课程的学生数量
     */
    @Query("SELECT COUNT(sc) FROM StudentCourse sc WHERE sc.courseId = :courseId AND sc.status = :status")
    long countByCourseIdAndStatus(@Param("courseId") Long courseId, @Param("status") String status);
    
    /**
     * 统计学生已加入的课程数量
     */
    @Query("SELECT COUNT(sc) FROM StudentCourse sc WHERE sc.studentId = :studentId AND sc.status = :status")
    long countByStudentIdAndStatus(@Param("studentId") Long studentId, @Param("status") String status);
    
    /**
     * 根据学生ID和状态查询课程列表
     */
    @Query("SELECT sc.course FROM StudentCourse sc WHERE sc.studentId = :studentId AND sc.status = :status ORDER BY sc.enrollmentDate DESC")
    List<Course> findCoursesByStudentIdAndStatus(@Param("studentId") Long studentId, @Param("status") String status);
    
    /**
     * 根据课程ID和状态查询学生列表
     */
    @Query("SELECT sc.student FROM StudentCourse sc WHERE sc.courseId = :courseId AND sc.status = :status ORDER BY sc.enrollmentDate ASC")
    List<Student> findStudentsByCourseIdAndStatus(@Param("courseId") Long courseId, @Param("status") String status);

    /**
     * 根据课程ID删除所有学生选课记录
     */
    @Modifying
    @Query("DELETE FROM StudentCourse sc WHERE sc.courseId = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    /**
     * 根据课程ID删除所有学生选课记录（使用原生SQL）
     */
    @Modifying
    @Query(value = "DELETE FROM STUDENT_COURSES WHERE COURSE_ID = :courseId", nativeQuery = true)
    void deleteByCourseIdNative(@Param("courseId") Long courseId);

    /**
     * 根据课程ID查找所有学生选课记录（不限状态）
     */
    @Query("SELECT sc FROM StudentCourse sc WHERE sc.courseId = :courseId")
    List<StudentCourse> findAllByCourseId(@Param("courseId") Long courseId);
    
    /**
     * 根据课程ID查找所有学生选课记录（简化方法名）
     */
    default List<StudentCourse> findByCourseId(Long courseId) {
        return findAllByCourseId(courseId);
    }
} 