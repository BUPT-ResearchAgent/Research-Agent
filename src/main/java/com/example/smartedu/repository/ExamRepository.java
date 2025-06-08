package com.example.smartedu.repository;

import com.example.smartedu.entity.Exam;
import com.example.smartedu.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    
    /**
     * 根据课程ID查找考试
     */
    List<Exam> findByCourseId(Long courseId);
    
    /**
     * 根据课程ID查找考试并按创建时间倒序排列
     */
    List<Exam> findByCourseIdOrderByCreatedAtDesc(Long courseId);
    
    /**
     * 根据课程查找考试并按创建时间倒序排列
     */
    List<Exam> findByCourseOrderByCreatedAtDesc(Course course);
    
    /**
     * 查找所有已发布的考试
     */
    List<Exam> findByIsPublishedTrue();
    
    /**
     * 根据发布状态查找考试
     */
    List<Exam> findByIsPublished(Boolean isPublished);
    
    /**
     * 根据课程ID和发布状态查找考试
     */
    List<Exam> findByCourseIdAndIsPublished(Long courseId, Boolean isPublished);
    
    /**
     * 根据课程ID查找已发布的考试
     */
    List<Exam> findByCourseIdAndIsPublishedTrue(Long courseId);
    
    /**
     * 根据课程查找已发布的考试
     */
    List<Exam> findByCourseAndIsPublishedTrue(Course course);
    
    /**
     * 根据教师ID查找考试（通过课程关联）
     */
    @Query("SELECT e FROM Exam e WHERE e.course.teacher.id = :teacherId")
    List<Exam> findByTeacherId(@Param("teacherId") Long teacherId);
    
    /**
     * 根据考试类型查找考试
     */
    List<Exam> findByExamType(String examType);
    
    /**
     * 根据章节查找考试
     */
    List<Exam> findByChapter(String chapter);
    
    /**
     * 统计课程的考试数量
     */
    @Query("SELECT COUNT(e) FROM Exam e WHERE e.course.id = :courseId")
    long countByCourseId(@Param("courseId") Long courseId);
    
    /**
     * 统计已发布的考试数量
     */
    long countByIsPublishedTrue();
} 