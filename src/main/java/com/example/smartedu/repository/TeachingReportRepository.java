package com.example.smartedu.repository;

import com.example.smartedu.entity.TeachingReport;
import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TeachingReportRepository extends JpaRepository<TeachingReport, Long> {
    
    /**
     * 根据教师ID查找报告（未删除的）
     */
    List<TeachingReport> findByTeacherIdAndIsDeletedFalseOrderByCreatedAtDesc(Long teacherId);
    
    /**
     * 根据教师查找报告（未删除的）
     */
    List<TeachingReport> findByTeacherAndIsDeletedFalseOrderByCreatedAtDesc(Teacher teacher);
    
    /**
     * 根据课程ID查找报告（未删除的）
     */
    List<TeachingReport> findByCourseIdAndIsDeletedFalseOrderByCreatedAtDesc(Long courseId);
    
    /**
     * 根据课程查找报告（未删除的）
     */
    List<TeachingReport> findByCourseAndIsDeletedFalseOrderByCreatedAtDesc(Course course);
    
    /**
     * 根据教师ID和课程ID查找报告
     */
    List<TeachingReport> findByTeacherIdAndCourseIdAndIsDeletedFalseOrderByCreatedAtDesc(Long teacherId, Long courseId);
    
    /**
     * 根据分析范围查找报告
     */
    List<TeachingReport> findByAnalysisScopeAndIsDeletedFalseOrderByCreatedAtDesc(String analysisScope);
    
    /**
     * 查找指定时间范围内的报告
     */
    @Query("SELECT tr FROM TeachingReport tr WHERE tr.teacherId = :teacherId AND tr.isDeleted = false AND tr.createdAt BETWEEN :startDate AND :endDate ORDER BY tr.createdAt DESC")
    List<TeachingReport> findByTeacherIdAndDateRange(@Param("teacherId") Long teacherId, 
                                                    @Param("startDate") LocalDateTime startDate, 
                                                    @Param("endDate") LocalDateTime endDate);
    
    /**
     * 统计教师的报告总数
     */
    @Query("SELECT COUNT(tr) FROM TeachingReport tr WHERE tr.teacherId = :teacherId AND tr.isDeleted = false")
    long countByTeacherId(@Param("teacherId") Long teacherId);
    
    /**
     * 统计课程的报告总数
     */
    @Query("SELECT COUNT(tr) FROM TeachingReport tr WHERE tr.courseId = :courseId AND tr.isDeleted = false")
    long countByCourseId(@Param("courseId") Long courseId);
    
    /**
     * 获取教师最近的N个报告
     */
    @Query("SELECT tr FROM TeachingReport tr WHERE tr.teacherId = :teacherId AND tr.isDeleted = false ORDER BY tr.createdAt DESC")
    List<TeachingReport> findRecentReportsByTeacherId(@Param("teacherId") Long teacherId);
    
    /**
     * 根据标题模糊查询报告
     */
    @Query("SELECT tr FROM TeachingReport tr WHERE tr.teacherId = :teacherId AND tr.isDeleted = false AND tr.title LIKE %:title% ORDER BY tr.createdAt DESC")
    List<TeachingReport> findByTeacherIdAndTitleContaining(@Param("teacherId") Long teacherId, @Param("title") String title);
    
    /**
     * 获取系统中所有报告的统计信息（管理员用）
     */
    @Query("SELECT COUNT(tr) FROM TeachingReport tr WHERE tr.isDeleted = false")
    long countAllActiveReports();
    
    /**
     * 获取指定时间段内的报告统计
     */
    @Query("SELECT COUNT(tr) FROM TeachingReport tr WHERE tr.isDeleted = false AND tr.createdAt BETWEEN :startDate AND :endDate")
    long countReportsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 获取最受欢迎的报告（按下载次数排序）
     */
    @Query("SELECT tr FROM TeachingReport tr WHERE tr.teacherId = :teacherId AND tr.isDeleted = false ORDER BY tr.downloadCount DESC")
    List<TeachingReport> findMostDownloadedByTeacherId(@Param("teacherId") Long teacherId);
    
    /**
     * 软删除报告
     */
    @Query("UPDATE TeachingReport tr SET tr.isDeleted = true, tr.updatedAt = CURRENT_TIMESTAMP WHERE tr.id = :reportId AND tr.teacherId = :teacherId")
    int softDeleteReport(@Param("reportId") Long reportId, @Param("teacherId") Long teacherId);
} 