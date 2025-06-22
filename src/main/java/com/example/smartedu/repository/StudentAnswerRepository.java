package com.example.smartedu.repository;

import com.example.smartedu.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {
    
    /**
     * 根据学生ID和题目ID查找答案
     */
    Optional<StudentAnswer> findByStudentIdAndQuestionId(Long studentId, Long questionId);
    
    /**
     * 根据考试结果ID查找所有答案
     */
    List<StudentAnswer> findByExamResultId(Long examResultId);
    
    /**
     * 根据学生ID和考试结果ID查找所有答案
     */
    List<StudentAnswer> findByStudentIdAndExamResultId(Long studentId, Long examResultId);
    
    /**
     * 根据学生ID和考试ID查找所有答案
     */
    @Query("SELECT sa FROM StudentAnswer sa JOIN sa.question q WHERE sa.studentId = :studentId AND q.exam.id = :examId")
    List<StudentAnswer> findByStudentIdAndExamId(@Param("studentId") Long studentId, @Param("examId") Long examId);
    
    /**
     * 根据题目ID查找所有学生答案
     */
    List<StudentAnswer> findByQuestionId(Long questionId);
    
    /**
     * 根据考试结果ID和题目ID查找学生答案
     */
    List<StudentAnswer> findByExamResultIdAndQuestionId(Long examResultId, Long questionId);
    
    /**
     * 检查学生是否已经回答了某个题目
     */
    boolean existsByStudentIdAndQuestionId(Long studentId, Long questionId);
} 