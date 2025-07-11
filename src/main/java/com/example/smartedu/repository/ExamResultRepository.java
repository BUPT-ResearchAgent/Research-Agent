package com.example.smartedu.repository;

import com.example.smartedu.entity.ExamResult;
import com.example.smartedu.entity.Exam;
import com.example.smartedu.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    
    /**
     * 根据学生和考试查找考试结果
     */
    Optional<ExamResult> findByStudentAndExam(Student student, Exam exam);
    
    /**
     * 根据学生ID和考试ID查找考试结果
     */
    Optional<ExamResult> findByStudentIdAndExamId(Long studentId, Long examId);
    
    /**
     * 根据学生查找所有考试结果
     */
    List<ExamResult> findByStudent(Student student);
    
    /**
     * 根据学生ID查找所有考试结果
     */
    List<ExamResult> findByStudentId(Long studentId);
    
    /**
     * 根据考试查找所有考试结果
     */
    List<ExamResult> findByExam(Exam exam);
    
    /**
     * 根据考试ID查找所有考试结果
     */
    List<ExamResult> findByExamId(Long examId);
    
    /**
     * 根据批改状态查找考试结果
     */
    List<ExamResult> findByGradeStatus(String gradeStatus);
    
    /**
     * 根据考试和批改状态查找考试结果
     */
    List<ExamResult> findByExamAndGradeStatus(Exam exam, String gradeStatus);
    
    /**
     * 根据学生查找考试结果并按提交时间排序
     */
    List<ExamResult> findByStudentOrderBySubmitTimeDesc(Student student);
    
    /**
     * 根据考试查找考试结果并按分数排序
     */
    List<ExamResult> findByExamOrderByFinalScoreDesc(Exam exam);
    
    /**
     * 根据考试查找考试结果并按提交时间排序
     */
    List<ExamResult> findByExamOrderBySubmitTimeDesc(Exam exam);
    
    /**
     * 统计考试的参与人数
     */
    @Query("SELECT COUNT(er) FROM ExamResult er WHERE er.exam = :exam")
    long countByExam(@Param("exam") Exam exam);
    
    /**
     * 统计学生的考试次数
     */
    @Query("SELECT COUNT(er) FROM ExamResult er WHERE er.student = :student")
    long countByStudent(@Param("student") Student student);
    
    /**
     * 计算考试的平均分
     */
    @Query("SELECT AVG(er.finalScore) FROM ExamResult er WHERE er.exam = :exam AND er.finalScore IS NOT NULL")
    Double getAverageScoreByExam(@Param("exam") Exam exam);
    
    /**
     * 计算学生的平均分
     */
    @Query("SELECT AVG(er.finalScore) FROM ExamResult er WHERE er.student = :student AND er.finalScore IS NOT NULL")
    Double getAverageScoreByStudent(@Param("student") Student student);
    
    /**
     * 获取考试的最高分
     */
    @Query("SELECT MAX(er.finalScore) FROM ExamResult er WHERE er.exam = :exam")
    Double getMaxScoreByExam(@Param("exam") Exam exam);
    
    /**
     * 获取考试的最低分
     */
    @Query("SELECT MIN(er.finalScore) FROM ExamResult er WHERE er.exam = :exam")
    Double getMinScoreByExam(@Param("exam") Exam exam);
    
    /**
     * 根据学生ID和课程ID查找所有考试结果，按提交时间排序
     */
    @Query("SELECT er FROM ExamResult er JOIN er.exam e WHERE er.studentId = :studentId AND e.course.id = :courseId ORDER BY er.submitTime ASC")
    List<ExamResult> findByStudentIdAndCourseIdOrderBySubmitTime(@Param("studentId") Long studentId, @Param("courseId") Long courseId);
} 