package com.example.smartedu.repository;

import com.example.smartedu.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    
    List<ExamResult> findByExam_Id(Long examId);
    
    List<ExamResult> findByStudentId(Long studentId);
    
    List<ExamResult> findByGradeStatus(String gradeStatus);
    
    @Query("SELECT AVG(r.score) FROM ExamResult r WHERE r.exam.id = ?1")
    Double getAverageScoreByExamId(Long examId);
    
    // 统计指定考试列表中特定状态的数量
    @Query("SELECT COUNT(r) FROM ExamResult r WHERE r.exam.id IN :examIds AND r.gradeStatus = :gradeStatus")
    long countByExamIdInAndGradeStatus(@Param("examIds") List<Long> examIds, @Param("gradeStatus") String gradeStatus);
    
    // 获取指定教师的平均成绩
    @Query("SELECT AVG(r.finalScore) FROM ExamResult r WHERE r.exam.course.teacherId = :teacherId AND r.finalScore IS NOT NULL")
    Double getAverageScoreByTeacherId(@Param("teacherId") Long teacherId);
} 