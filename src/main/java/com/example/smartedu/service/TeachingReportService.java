package com.example.smartedu.service;

import com.example.smartedu.entity.TeachingReport;
import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.Course;
import com.example.smartedu.repository.TeachingReportRepository;
import com.example.smartedu.repository.TeacherRepository;
import com.example.smartedu.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TeachingReportService {
    
    @Autowired
    private TeachingReportRepository teachingReportRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    /**
     * 保存教学改进建议报告
     */
    public TeachingReport saveReport(Long teacherId, String title, String content, String fileName, 
                                   String analysisScope, String scopeText, Long courseId, String courseText) {
        // 查找教师
        Optional<Teacher> teacherOpt = teacherRepository.findById(teacherId);
        if (!teacherOpt.isPresent()) {
            throw new RuntimeException("教师不存在");
        }
        
        Teacher teacher = teacherOpt.get();
        TeachingReport report = new TeachingReport(title, content, teacher);
        
        // 设置基本信息
        report.setFileName(fileName);
        report.setAnalysisScope(analysisScope);
        report.setScopeText(scopeText);
        report.setCourseText(courseText);
        
        // 设置课程关联（如果有）
        if (courseId != null) {
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (courseOpt.isPresent()) {
                report.setCourse(courseOpt.get());
            }
        }
        
        return teachingReportRepository.save(report);
    }
    
    /**
     * 获取教师的所有报告
     */
    public List<TeachingReport> getReportsByTeacher(Long teacherId) {
        return teachingReportRepository.findByTeacherIdAndIsDeletedFalseOrderByCreatedAtDesc(teacherId);
    }
    
    /**
     * 获取教师的最近N个报告
     */
    public List<TeachingReport> getRecentReportsByTeacher(Long teacherId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<TeachingReport> allReports = teachingReportRepository.findRecentReportsByTeacherId(teacherId);
        return allReports.stream().limit(limit).toList();
    }
    
    /**
     * 根据ID获取报告详情
     */
    public Optional<TeachingReport> getReportById(Long reportId) {
        return teachingReportRepository.findById(reportId);
    }
    
    /**
     * 根据ID和教师ID获取报告（安全检查）
     */
    public Optional<TeachingReport> getReportByIdAndTeacher(Long reportId, Long teacherId) {
        Optional<TeachingReport> reportOpt = teachingReportRepository.findById(reportId);
        if (reportOpt.isPresent() && reportOpt.get().getTeacherId().equals(teacherId) && !reportOpt.get().getIsDeleted()) {
            return reportOpt;
        }
        return Optional.empty();
    }
    
    /**
     * 增加报告下载次数
     */
    public void incrementDownloadCount(Long reportId, Long teacherId) {
        Optional<TeachingReport> reportOpt = getReportByIdAndTeacher(reportId, teacherId);
        if (reportOpt.isPresent()) {
            TeachingReport report = reportOpt.get();
            report.incrementDownloadCount();
            teachingReportRepository.save(report);
        }
    }
    
    /**
     * 删除报告（软删除）
     */
    public boolean deleteReport(Long reportId, Long teacherId) {
        Optional<TeachingReport> reportOpt = getReportByIdAndTeacher(reportId, teacherId);
        if (reportOpt.isPresent()) {
            TeachingReport report = reportOpt.get();
            report.markAsDeleted();
            teachingReportRepository.save(report);
            return true;
        }
        return false;
    }
    
    /**
     * 批量删除教师的所有报告
     */
    public int deleteAllReportsByTeacher(Long teacherId) {
        List<TeachingReport> reports = getReportsByTeacher(teacherId);
        int deletedCount = 0;
        for (TeachingReport report : reports) {
            report.markAsDeleted();
            teachingReportRepository.save(report);
            deletedCount++;
        }
        return deletedCount;
    }
    
    /**
     * 根据课程获取报告
     */
    public List<TeachingReport> getReportsByCourse(Long courseId) {
        return teachingReportRepository.findByCourseIdAndIsDeletedFalseOrderByCreatedAtDesc(courseId);
    }
    
    /**
     * 根据教师和课程获取报告
     */
    public List<TeachingReport> getReportsByTeacherAndCourse(Long teacherId, Long courseId) {
        return teachingReportRepository.findByTeacherIdAndCourseIdAndIsDeletedFalseOrderByCreatedAtDesc(teacherId, courseId);
    }
    
    /**
     * 根据分析范围获取报告
     */
    public List<TeachingReport> getReportsByScope(String analysisScope) {
        return teachingReportRepository.findByAnalysisScopeAndIsDeletedFalseOrderByCreatedAtDesc(analysisScope);
    }
    
    /**
     * 根据时间范围获取报告
     */
    public List<TeachingReport> getReportsByDateRange(Long teacherId, LocalDateTime startDate, LocalDateTime endDate) {
        return teachingReportRepository.findByTeacherIdAndDateRange(teacherId, startDate, endDate);
    }
    
    /**
     * 搜索报告
     */
    public List<TeachingReport> searchReports(Long teacherId, String keyword) {
        return teachingReportRepository.findByTeacherIdAndTitleContaining(teacherId, keyword);
    }
    
    /**
     * 获取教师报告统计
     */
    public long getReportCountByTeacher(Long teacherId) {
        return teachingReportRepository.countByTeacherId(teacherId);
    }
    
    /**
     * 获取课程报告统计
     */
    public long getReportCountByCourse(Long courseId) {
        return teachingReportRepository.countByCourseId(courseId);
    }
    
    /**
     * 获取最受欢迎的报告
     */
    public List<TeachingReport> getMostDownloadedReports(Long teacherId, int limit) {
        List<TeachingReport> allReports = teachingReportRepository.findMostDownloadedByTeacherId(teacherId);
        return allReports.stream().limit(limit).toList();
    }
    
    /**
     * 检查报告是否属于指定教师
     */
    public boolean isReportOwnedByTeacher(Long reportId, Long teacherId) {
        Optional<TeachingReport> reportOpt = teachingReportRepository.findById(reportId);
        return reportOpt.isPresent() && 
               reportOpt.get().getTeacherId().equals(teacherId) && 
               !reportOpt.get().getIsDeleted();
    }
    
    /**
     * 更新报告信息
     */
    public TeachingReport updateReport(Long reportId, Long teacherId, String title, String content) {
        Optional<TeachingReport> reportOpt = getReportByIdAndTeacher(reportId, teacherId);
        if (reportOpt.isPresent()) {
            TeachingReport report = reportOpt.get();
            if (title != null) report.setTitle(title);
            if (content != null) report.setContent(content);
            return teachingReportRepository.save(report);
        }
        throw new RuntimeException("报告不存在或无权限修改");
    }
    
    /**
     * 获取系统总报告数（管理员功能）
     */
    public long getTotalActiveReports() {
        return teachingReportRepository.countAllActiveReports();
    }
    
    /**
     * 获取指定时间段的报告统计（管理员功能）
     */
    public long getReportCountByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return teachingReportRepository.countReportsByDateRange(startDate, endDate);
    }
} 