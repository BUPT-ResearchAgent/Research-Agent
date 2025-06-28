package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.TeachingReport;
import com.example.smartedu.entity.Teacher;
import com.example.smartedu.service.TeachingReportService;
import com.example.smartedu.service.TeacherManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/teaching-reports")
public class TeachingReportController {
    
    @Autowired
    private TeachingReportService teachingReportService;
    
    @Autowired
    private TeacherManagementService teacherManagementService;
    
    /**
     * 保存教学改进建议报告
     */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse> saveReport(@RequestBody Map<String, Object> request, HttpSession session) {
        try {
            // 获取当前登录的教师
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.ok(ApiResponse.error("请先登录"));
            }
            
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ResponseEntity.ok(ApiResponse.error("教师信息不存在"));
            }
            
            Long teacherId = teacherOpt.get().getId();
            
            // 获取请求参数
            String title = (String) request.get("title");
            String content = (String) request.get("content");
            String fileName = (String) request.get("fileName");
            String analysisScope = (String) request.get("analysisScope");
            String scopeText = (String) request.get("scopeText");
            String courseText = (String) request.get("courseText");
            
            // 课程ID可能为null
            Long courseId = null;
            if (request.get("courseId") != null) {
                courseId = Long.valueOf(request.get("courseId").toString());
            }
            
            // 保存报告
            TeachingReport report = teachingReportService.saveReport(
                teacherId, title, content, fileName, 
                analysisScope, scopeText, courseId, courseText
            );
            
            return ResponseEntity.ok(ApiResponse.success("报告保存成功", report));
            
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("保存报告失败：" + e.getMessage()));
        }
    }
    
    /**
     * 获取当前教师的所有报告
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse> getReportsList(HttpSession session) {
        try {
            // 获取当前登录的教师
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.ok(ApiResponse.error("请先登录"));
            }
            
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ResponseEntity.ok(ApiResponse.error("教师信息不存在"));
            }
            
            Long teacherId = teacherOpt.get().getId();
            List<TeachingReport> reports = teachingReportService.getReportsByTeacher(teacherId);
            
            return ResponseEntity.ok(ApiResponse.success("获取报告列表成功", reports));
            
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("获取报告列表失败：" + e.getMessage()));
        }
    }
    
    /**
     * 根据ID获取报告详情
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse> getReportById(@PathVariable Long reportId, HttpSession session) {
        try {
            // 获取当前登录的教师
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.ok(ApiResponse.error("请先登录"));
            }
            
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ResponseEntity.ok(ApiResponse.error("教师信息不存在"));
            }
            
            Long teacherId = teacherOpt.get().getId();
            Optional<TeachingReport> reportOpt = teachingReportService.getReportByIdAndTeacher(reportId, teacherId);
            
            if (!reportOpt.isPresent()) {
                return ResponseEntity.ok(ApiResponse.error("报告不存在或无权限访问"));
            }
            
            return ResponseEntity.ok(ApiResponse.success("获取报告详情成功", reportOpt.get()));
            
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("获取报告详情失败：" + e.getMessage()));
        }
    }
    
    /**
     * 增加报告下载次数
     */
    @PostMapping("/{reportId}/download")
    public ResponseEntity<ApiResponse> incrementDownloadCount(@PathVariable Long reportId, HttpSession session) {
        try {
            // 获取当前登录的教师
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.ok(ApiResponse.error("请先登录"));
            }
            
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ResponseEntity.ok(ApiResponse.error("教师信息不存在"));
            }
            
            Long teacherId = teacherOpt.get().getId();
            teachingReportService.incrementDownloadCount(reportId, teacherId);
            
            return ResponseEntity.ok(ApiResponse.success("下载记录更新成功"));
            
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("更新下载记录失败：" + e.getMessage()));
        }
    }
    
    /**
     * 删除报告
     */
    @DeleteMapping("/{reportId}")
    public ResponseEntity<ApiResponse> deleteReport(@PathVariable Long reportId, HttpSession session) {
        try {
            // 获取当前登录的教师
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.ok(ApiResponse.error("请先登录"));
            }
            
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ResponseEntity.ok(ApiResponse.error("教师信息不存在"));
            }
            
            Long teacherId = teacherOpt.get().getId();
            boolean deleted = teachingReportService.deleteReport(reportId, teacherId);
            
            if (deleted) {
                return ResponseEntity.ok(ApiResponse.success("报告删除成功"));
            } else {
                return ResponseEntity.ok(ApiResponse.error("报告不存在或无权限删除"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("删除报告失败：" + e.getMessage()));
        }
    }
    
    /**
     * 清空所有报告
     */
    @DeleteMapping("/clear-all")
    public ResponseEntity<ApiResponse> clearAllReports(HttpSession session) {
        try {
            // 获取当前登录的教师
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.ok(ApiResponse.error("请先登录"));
            }
            
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ResponseEntity.ok(ApiResponse.error("教师信息不存在"));
            }
            
            Long teacherId = teacherOpt.get().getId();
            int deletedCount = teachingReportService.deleteAllReportsByTeacher(teacherId);
            
            return ResponseEntity.ok(ApiResponse.success("成功清空所有报告", 
                Map.of("deletedCount", deletedCount)));
            
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("清空报告失败：" + e.getMessage()));
        }
    }
} 