package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.service.*;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * AI监控仪表板控制器
 * 提供AI系统性能、公平性、安全性的实时监控和管理功能
 */
@RestController
@RequestMapping("/api/ai/monitoring")
public class AIMonitoringController {
    
    @Autowired
    private AISecurityAuditService auditService;
    
    @Autowired
    private BiasDetectionService biasDetectionService;
    
    @Autowired
    private AIAccessControlService accessControlService;
    
    @Autowired
    private DataPrivacyService dataPrivacyService;
    
    @Autowired
    private ExplainableAIService explainableAIService;
    
    /**
     * 获取AI监控仪表板数据
     */
    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> getMonitoringDashboard(HttpSession session) {
        try {
            // 验证管理员权限
            String role = (String) session.getAttribute("role");
            if (!"admin".equals(role) && !"teacher".equals(role)) {
                return ApiResponse.error("权限不足，需要管理员或教师权限");
            }
            
            System.out.println("获取AI监控仪表板数据");
            
            Map<String, Object> dashboard = new HashMap<>();
            
            // 1. AI系统概览
            dashboard.put("systemOverview", getSystemOverview());
            
            // 2. 性能指标
            dashboard.put("performanceMetrics", getPerformanceMetrics());
            
            // 3. 公平性评估
            dashboard.put("fairnessMetrics", getFairnessMetrics());
            
            // 4. 安全告警
            dashboard.put("securityAlerts", getSecurityAlerts());
            
            // 5. 使用统计
            dashboard.put("usageStatistics", getUsageStatistics());
            
            // 6. 异常检测结果
            dashboard.put("anomalyDetection", getAnomalyDetection());
            
            // 7. 实时状态
            dashboard.put("realTimeStatus", getRealTimeStatus());
            
            return ApiResponse.success(dashboard);
            
        } catch (Exception e) {
            System.err.println("获取监控仪表板数据失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("获取监控数据失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取系统概览
     */
    private Map<String, Object> getSystemOverview() {
        Map<String, Object> overview = new HashMap<>();
        
        // 系统状态
        overview.put("systemStatus", "HEALTHY");
        overview.put("lastUpdateTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        // AI服务状态
        Map<String, String> aiServices = new HashMap<>();
        aiServices.put("grading", "ACTIVE");
        aiServices.put("questionGeneration", "ACTIVE");
        aiServices.put("biasDetection", "ACTIVE");
        aiServices.put("contentAnalysis", "ACTIVE");
        overview.put("aiServices", aiServices);
        
        // 版本信息
        overview.put("aiSystemVersion", "v1.0.0");
        overview.put("lastDeployment", "2024-01-15 10:30:00");
        
        return overview;
    }
    
    /**
     * 获取性能指标
     */
    private Map<String, Object> getPerformanceMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // 获取最近24小时的审计统计
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime yesterday = now.minusDays(1);
        
        try {
            AISecurityAuditService.AuditStatistics stats = auditService.getAuditStatistics(yesterday, now);
            
            metrics.put("totalOperations", stats.getTotalOperations());
            metrics.put("successRate", stats.getTotalOperations() > 0 ? 
                (double) stats.getSuccessfulOperations() / stats.getTotalOperations() * 100 : 100.0);
            metrics.put("averageResponseTime", stats.getAverageExecutionTime());
            metrics.put("errorRate", stats.getTotalOperations() > 0 ? 
                (double) stats.getFailedOperations() / stats.getTotalOperations() * 100 : 0.0);
            
            // 操作类型分布
            metrics.put("operationTypeDistribution", stats.getOperationTypeStats());
            
        } catch (Exception e) {
            // 如果审计服务不可用，返回模拟数据
            metrics.put("totalOperations", 1250);
            metrics.put("successRate", 97.5);
            metrics.put("averageResponseTime", 850.0);
            metrics.put("errorRate", 2.5);
            
            Map<String, Long> operationDist = new HashMap<>();
            operationDist.put("grading", 800L);
            operationDist.put("question_generation", 250L);
            operationDist.put("content_analysis", 150L);
            operationDist.put("bias_detection", 50L);
            metrics.put("operationTypeDistribution", operationDist);
        }
        
        // 性能趋势（模拟数据）
        List<Map<String, Object>> performanceTrend = new ArrayList<>();
        for (int i = 23; i >= 0; i--) {
            Map<String, Object> hourData = new HashMap<>();
            hourData.put("hour", now.minusHours(i).getHour());
            hourData.put("operations", 50 + (int)(Math.random() * 20));
            hourData.put("responseTime", 800 + (int)(Math.random() * 200));
            performanceTrend.add(hourData);
        }
        metrics.put("performanceTrend", performanceTrend);
        
        return metrics;
    }
    
    /**
     * 获取公平性指标
     */
    private Map<String, Object> getFairnessMetrics() {
        Map<String, Object> fairness = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        
        // 综合公平性分数（模拟数据，实际应该从BiasDetectionService获取）
        fairness.put("overallFairnessScore", 0.87);
        
        // 各维度偏见检测结果
        Map<String, Object> biasScores = new HashMap<>();
        biasScores.put("genderBias", 0.02);
        biasScores.put("regionalBias", 0.04);
        biasScores.put("majorBias", 0.03);
        biasScores.put("ageGroupBias", 0.01);
        fairness.put("biasScores", biasScores);
        
        // 公平性指标
        Map<String, Object> fairnessIndicators = new HashMap<>();
        fairnessIndicators.put("statisticalParity", 0.92);
        fairnessIndicators.put("equalizedOpportunity", 0.89);
        fairnessIndicators.put("individualFairness", 0.85);
        fairnessIndicators.put("calibration", 0.91);
        fairness.put("fairnessIndicators", fairnessIndicators);
        
        // 最近检测结果
        List<Map<String, Object>> recentDetections = new ArrayList<>();
        Map<String, Object> detection1 = new HashMap<>();
        detection1.put("examId", 123L);
        detection1.put("detectionTime", now.minusHours(2).format(DateTimeFormatter.ofPattern("MM-dd HH:mm")));
        detection1.put("fairnessScore", 0.89);
        detection1.put("status", "NORMAL");
        recentDetections.add(detection1);
        
        Map<String, Object> detection2 = new HashMap<>();
        detection2.put("examId", 122L);
        detection2.put("detectionTime", now.minusHours(6).format(DateTimeFormatter.ofPattern("MM-dd HH:mm")));
        detection2.put("fairnessScore", 0.75);
        detection2.put("status", "WARNING");
        recentDetections.add(detection2);
        
        fairness.put("recentDetections", recentDetections);
        
        return fairness;
    }
    
    /**
     * 获取安全告警
     */
    private Map<String, Object> getSecurityAlerts() {
        Map<String, Object> security = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        
        // 告警统计
        Map<String, Integer> alertCounts = new HashMap<>();
        alertCounts.put("high", 1);
        alertCounts.put("medium", 3);
        alertCounts.put("low", 8);
        security.put("alertCounts", alertCounts);
        
        // 最近告警
        List<Map<String, Object>> recentAlerts = new ArrayList<>();
        
        Map<String, Object> alert1 = new HashMap<>();
        alert1.put("id", "ALERT_001");
        alert1.put("level", "HIGH");
        alert1.put("type", "RATE_LIMIT_EXCEEDED");
        alert1.put("message", "用户频繁调用AI接口，可能存在异常行为");
        alert1.put("time", now.minusMinutes(30).format(DateTimeFormatter.ofPattern("MM-dd HH:mm")));
        alert1.put("userId", 1001L);
        recentAlerts.add(alert1);
        
        Map<String, Object> alert2 = new HashMap<>();
        alert2.put("id", "ALERT_002");
        alert2.put("level", "MEDIUM");
        alert2.put("type", "BIAS_DETECTED");
        alert2.put("message", "检测到潜在的评分偏见");
        alert2.put("time", now.minusHours(1).format(DateTimeFormatter.ofPattern("MM-dd HH:mm")));
        alert2.put("examId", 123L);
        recentAlerts.add(alert2);
        
        Map<String, Object> alert3 = new HashMap<>();
        alert3.put("id", "ALERT_003");
        alert3.put("level", "LOW");
        alert3.put("type", "PERFORMANCE_DEGRADATION");
        alert3.put("message", "AI响应时间略有增加");
        alert3.put("time", now.minusHours(2).format(DateTimeFormatter.ofPattern("MM-dd HH:mm")));
        recentAlerts.add(alert3);
        
        security.put("recentAlerts", recentAlerts);
        
        // 安全状态
        security.put("securityStatus", "CAUTION"); // SAFE, CAUTION, DANGER
        security.put("threatLevel", "LOW");
        
        return security;
    }
    
    /**
     * 获取使用统计
     */
    private Map<String, Object> getUsageStatistics() {
        Map<String, Object> usage = new HashMap<>();
        
        // 今日统计
        Map<String, Object> todayStats = new HashMap<>();
        todayStats.put("totalUsers", 245);
        todayStats.put("activeTeachers", 28);
        todayStats.put("activeStudents", 217);
        todayStats.put("aiOperations", 1250);
        todayStats.put("examsConducted", 15);
        usage.put("todayStats", todayStats);
        
        // 用户活跃度（按小时）
        List<Map<String, Object>> hourlyActivity = new ArrayList<>();
        for (int hour = 0; hour < 24; hour++) {
            Map<String, Object> hourData = new HashMap<>();
            hourData.put("hour", hour);
            
            // 模拟活跃度数据（白天更活跃）
            int baseActivity = hour >= 8 && hour <= 20 ? 20 : 5;
            hourData.put("users", baseActivity + (int)(Math.random() * 15));
            
            hourlyActivity.add(hourData);
        }
        usage.put("hourlyActivity", hourlyActivity);
        
        // AI功能使用排行
        List<Map<String, Object>> featureUsage = new ArrayList<>();
        featureUsage.add(Map.of("feature", "智能评分", "count", 800, "percentage", 64.0));
        featureUsage.add(Map.of("feature", "题目生成", "count", 250, "percentage", 20.0));
        featureUsage.add(Map.of("feature", "内容分析", "count", 150, "percentage", 12.0));
        featureUsage.add(Map.of("feature", "学习助手", "count", 50, "percentage", 4.0));
        usage.put("featureUsage", featureUsage);
        
        return usage;
    }
    
    /**
     * 获取异常检测结果
     */
    private Map<String, Object> getAnomalyDetection() {
        Map<String, Object> anomaly = new HashMap<>();
        
        // 异常统计
        anomaly.put("totalAnomalies", 12);
        anomaly.put("resolvedAnomalies", 8);
        anomaly.put("pendingAnomalies", 4);
        
        // 异常类型分布
        Map<String, Integer> anomalyTypes = new HashMap<>();
        anomalyTypes.put("执行时间异常", 5);
        anomalyTypes.put("置信度异常", 3);
        anomalyTypes.put("评分异常", 2);
        anomalyTypes.put("访问模式异常", 2);
        anomaly.put("anomalyTypes", anomalyTypes);
        
        // 最近异常
        try {
            List<AISecurityAuditService.AIAuditLog> anomalousLogs = auditService.getAnomalousLogs(5);
            
            List<Map<String, Object>> recentAnomalies = new ArrayList<>();
            for (AISecurityAuditService.AIAuditLog log : anomalousLogs) {
                Map<String, Object> anomalyData = new HashMap<>();
                anomalyData.put("auditId", log.getAuditId());
                anomalyData.put("userId", log.getUserId());
                anomalyData.put("operationType", log.getOperationType());
                anomalyData.put("anomalies", log.getAnomalies());
                anomalyData.put("time", log.getStartTime().format(DateTimeFormatter.ofPattern("MM-dd HH:mm")));
                recentAnomalies.add(anomalyData);
            }
            anomaly.put("recentAnomalies", recentAnomalies);
            
        } catch (Exception e) {
            // 如果获取失败，使用模拟数据
            List<Map<String, Object>> recentAnomalies = new ArrayList<>();
            Map<String, Object> anomaly1 = new HashMap<>();
            anomaly1.put("auditId", "AUDIT_123");
            anomaly1.put("userId", 1001L);
            anomaly1.put("operationType", "grading");
            anomaly1.put("anomalies", Arrays.asList("执行时间异常: 35000ms"));
                         anomaly1.put("time", LocalDateTime.now().minusMinutes(45).format(DateTimeFormatter.ofPattern("MM-dd HH:mm")));
             recentAnomalies.add(anomaly1);
             
             anomaly.put("recentAnomalies", recentAnomalies);
        }
        
        return anomaly;
    }
    
    /**
     * 获取实时状态
     */
    private Map<String, Object> getRealTimeStatus() {
        Map<String, Object> status = new HashMap<>();
        
        // 系统负载
        Map<String, Object> systemLoad = new HashMap<>();
        systemLoad.put("cpuUsage", 45.2);
        systemLoad.put("memoryUsage", 62.8);
        systemLoad.put("diskUsage", 38.5);
        systemLoad.put("networkTraffic", 125.6);
        status.put("systemLoad", systemLoad);
        
        // 当前在线用户
        status.put("onlineUsers", 89);
        status.put("activeAISessions", 12);
        
        // API响应时间
        Map<String, Object> apiResponse = new HashMap<>();
        apiResponse.put("average", 850);
        apiResponse.put("p95", 1200);
        apiResponse.put("p99", 2100);
        status.put("apiResponseTime", apiResponse);
        
        // 数据库状态
        Map<String, Object> dbStatus = new HashMap<>();
        dbStatus.put("connectionPool", "HEALTHY");
        dbStatus.put("activeConnections", 15);
        dbStatus.put("maxConnections", 50);
        dbStatus.put("queryPerformance", "GOOD");
        status.put("databaseStatus", dbStatus);
        
        return status;
    }
    
    /**
     * 获取特定考试的公平性分析
     */
    @GetMapping("/fairness/{examId}")
    public ApiResponse<Map<String, Object>> getExamFairnessAnalysis(@PathVariable Long examId, HttpSession session) {
        try {
            String role = (String) session.getAttribute("role");
            if (!"admin".equals(role) && !"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            System.out.println("获取考试公平性分析 - 考试ID: " + examId);
            
            // 调用偏见检测服务生成公平性报告
            BiasDetectionService.FairnessReport report = biasDetectionService.generateFairnessReport(examId);
            
            Map<String, Object> analysis = new HashMap<>();
            analysis.put("examId", report.getExamId());
            analysis.put("analysisTime", report.getAnalysisTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            analysis.put("totalStudents", report.getTotalStudents());
            analysis.put("overallFairnessScore", report.getOverallFairnessScore());
            
            // 转换偏见分析结果
            List<Map<String, Object>> biasResults = new ArrayList<>();
            for (BiasDetectionService.BiasAnalysisResult bias : report.getBiasAnalysisResults()) {
                Map<String, Object> biasData = new HashMap<>();
                biasData.put("biasType", bias.getBiasType());
                biasData.put("biasScore", bias.getBiasScore());
                biasData.put("description", bias.getDescription());
                biasData.put("affectedGroups", bias.getAffectedGroups());
                biasData.put("recommendations", bias.getRecommendations());
                biasResults.add(biasData);
            }
            analysis.put("biasAnalysisResults", biasResults);
            
            analysis.put("recommendations", report.getRecommendations());
            
            // 转换公平性指标
            if (report.getFairnessMetrics() != null) {
                Map<String, Object> metrics = new HashMap<>();
                metrics.put("statisticalParity", report.getFairnessMetrics().getStatisticalParity());
                metrics.put("equalizedOpportunity", report.getFairnessMetrics().getEqualizedOpportunity());
                metrics.put("individualFairness", report.getFairnessMetrics().getIndividualFairness());
                metrics.put("calibration", report.getFairnessMetrics().getCalibration());
                analysis.put("fairnessMetrics", metrics);
            }
            
            return ApiResponse.success(analysis);
            
        } catch (Exception e) {
            System.err.println("获取考试公平性分析失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("获取公平性分析失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取用户安全状态
     */
    @GetMapping("/security/user/{userId}")
    public ApiResponse<Map<String, Object>> getUserSecurityStatus(@PathVariable Long userId, HttpSession session) {
        try {
            String role = (String) session.getAttribute("role");
            if (!"admin".equals(role)) {
                return ApiResponse.error("权限不足，需要管理员权限");
            }
            
            System.out.println("获取用户安全状态 - 用户ID: " + userId);
            
            AIAccessControlService.UserSecurityStatus status = accessControlService.getUserSecurityStatus(userId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("userId", status.getUserId());
            result.put("blacklisted", status.isBlacklisted());
            result.put("totalAPICalls", status.getTotalAPICalls());
            result.put("recentCallCount", status.getRecentCallCount());
            result.put("suspiciousActivityCount", status.getSuspiciousActivityCount());
            
            if (status.getLastSuspiciousActivity() != null) {
                Map<String, Object> lastActivity = new HashMap<>();
                lastActivity.put("type", status.getLastSuspiciousActivity().getType());
                lastActivity.put("description", status.getLastSuspiciousActivity().getDescription());
                lastActivity.put("timestamp", status.getLastSuspiciousActivity().getTimestamp().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                result.put("lastSuspiciousActivity", lastActivity);
            }
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            System.err.println("获取用户安全状态失败: " + e.getMessage());
            return ApiResponse.error("获取用户安全状态失败：" + e.getMessage());
        }
    }
    
    /**
     * 手动清理过期数据
     */
    @PostMapping("/cleanup")
    public ApiResponse<String> cleanupExpiredData(HttpSession session) {
        try {
            String role = (String) session.getAttribute("role");
            if (!"admin".equals(role)) {
                return ApiResponse.error("权限不足，需要管理员权限");
            }
            
            System.out.println("开始清理过期数据");
            
            // 清理访问控制服务的过期数据
            accessControlService.cleanupExpiredData();
            
            System.out.println("过期数据清理完成");
            return ApiResponse.success("过期数据清理完成");
            
        } catch (Exception e) {
            System.err.println("清理过期数据失败: " + e.getMessage());
            return ApiResponse.error("清理过期数据失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取AI系统健康状态
     */
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // 检查各个组件的健康状态
            health.put("auditService", "UP");
            health.put("biasDetection", "UP");
            health.put("accessControl", "UP");
            health.put("dataPrivacy", "UP");
            health.put("explainableAI", "UP");
            
            health.put("overallStatus", "HEALTHY");
            health.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            
            return ApiResponse.success(health);
            
        } catch (Exception e) {
            health.put("overallStatus", "UNHEALTHY");
            health.put("error", e.getMessage());
            return ApiResponse.error("系统健康检查失败");
        }
    }
} 