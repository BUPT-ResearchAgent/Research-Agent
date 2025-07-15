package com.example.smartedu.service;

import com.example.smartedu.config.AISecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * AI安全审计服务
 * 负责监控所有AI API调用、记录决策过程、检测异常行为
 */
@Service
public class AISecurityAuditService {
    
    @Autowired
    private AISecurityConfig.SimpleEncryptor encryptor;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // 审计日志存储（实际应用中应该持久化到数据库）
    private final Map<String, AIAuditLog> auditLogs = new ConcurrentHashMap<>();
    
    // 性能监控数据
    private final Map<String, APIPerformanceMetrics> performanceMetrics = new ConcurrentHashMap<>();
    
    // 异常检测阈值
    private final AtomicLong auditLogCounter = new AtomicLong(0);
    
    /**
     * 记录AI API调用开始
     */
    public String startAIOperation(AIOperationRequest request) {
        String auditId = generateAuditId();
        
        AIAuditLog auditLog = new AIAuditLog();
        auditLog.setAuditId(auditId);
        auditLog.setUserId(request.getUserId());
        auditLog.setOperationType(request.getOperationType());
        auditLog.setApiEndpoint(request.getApiEndpoint());
        auditLog.setStartTime(LocalDateTime.now());
        auditLog.setRequestData(encryptSensitiveData(request.getInputData()));
        auditLog.setSessionId(request.getSessionId());
        auditLog.setClientIP(request.getClientIP());
        auditLog.setUserAgent(request.getUserAgent());
        
        auditLogs.put(auditId, auditLog);
        
        System.out.println("AI操作审计开始 - ID: " + auditId + ", 操作类型: " + request.getOperationType());
        return auditId;
    }
    
    /**
     * 记录AI API调用完成
     */
    public void completeAIOperation(String auditId, AIOperationResult result) {
        AIAuditLog auditLog = auditLogs.get(auditId);
        if (auditLog == null) {
            System.err.println("未找到审计记录: " + auditId);
            return;
        }
        
        auditLog.setEndTime(LocalDateTime.now());
        auditLog.setExecutionTimeMs(calculateExecutionTime(auditLog.getStartTime(), auditLog.getEndTime()));
        auditLog.setResponseData(encryptSensitiveData(result.getOutputData()));
        auditLog.setConfidenceScore(result.getConfidenceScore());
        auditLog.setStatus(result.isSuccess() ? "SUCCESS" : "FAILED");
        auditLog.setErrorMessage(result.getErrorMessage());
        
        // 更新性能指标
        updatePerformanceMetrics(auditLog);
        
        // 检测异常行为
        detectAnomalies(auditLog);
        
        System.out.println("AI操作审计完成 - ID: " + auditId + 
                          ", 执行时间: " + auditLog.getExecutionTimeMs() + "ms" +
                          ", 状态: " + auditLog.getStatus());
    }
    
    /**
     * 记录AI决策过程
     */
    public void recordDecisionProcess(String auditId, AIDecisionProcess decisionProcess) {
        AIAuditLog auditLog = auditLogs.get(auditId);
        if (auditLog == null) {
            System.err.println("未找到审计记录: " + auditId);
            return;
        }
        
        auditLog.setDecisionSteps(decisionProcess.getSteps());
        auditLog.setReasoningChain(decisionProcess.getReasoningChain());
        auditLog.setFeatureImportance(decisionProcess.getFeatureImportance());
        auditLog.setAlternativeOptions(decisionProcess.getAlternativeOptions());
    }
    
    /**
     * 记录人工干预
     */
    public void recordHumanIntervention(String auditId, HumanIntervention intervention) {
        AIAuditLog auditLog = auditLogs.get(auditId);
        if (auditLog == null) {
            System.err.println("未找到审计记录: " + auditId);
            return;
        }
        
        auditLog.setHumanIntervention(intervention);
        auditLog.setInterventionReason(intervention.getReason());
        auditLog.setOriginalResult(intervention.getOriginalResult());
        auditLog.setModifiedResult(intervention.getModifiedResult());
        
        System.out.println("记录人工干预 - 审计ID: " + auditId + ", 干预原因: " + intervention.getReason());
    }
    
    /**
     * 检测异常行为
     */
    private void detectAnomalies(AIAuditLog auditLog) {
        List<String> anomalies = new ArrayList<>();
        
        // 1. 执行时间异常
        if (auditLog.getExecutionTimeMs() > 30000) { // 超过30秒
            anomalies.add("执行时间异常: " + auditLog.getExecutionTimeMs() + "ms");
        }
        
        // 2. 置信度异常
        if (auditLog.getConfidenceScore() != null && auditLog.getConfidenceScore() < 0.3) {
            anomalies.add("AI置信度过低: " + auditLog.getConfidenceScore());
        }
        
        // 3. 频繁失败
        String userKey = auditLog.getUserId() + "_" + auditLog.getOperationType();
        APIPerformanceMetrics metrics = performanceMetrics.get(userKey);
        if (metrics != null && metrics.getFailureRate() > 0.5) {
            anomalies.add("用户操作失败率过高: " + String.format("%.2f%%", metrics.getFailureRate() * 100));
        }
        
        // 4. 异常访问模式
        if (isAbnormalAccessPattern(auditLog)) {
            anomalies.add("检测到异常访问模式");
        }
        
        if (!anomalies.isEmpty()) {
            auditLog.setAnomalies(anomalies);
            System.out.println("检测到异常行为 - 审计ID: " + auditLog.getAuditId() + ", 异常: " + anomalies);
        }
    }
    
    /**
     * 检测异常访问模式
     */
    private boolean isAbnormalAccessPattern(AIAuditLog auditLog) {
        // 检查短时间内大量请求
        long recentRequests = auditLogs.values().stream()
            .filter(log -> log.getUserId().equals(auditLog.getUserId()))
            .filter(log -> log.getStartTime().isAfter(LocalDateTime.now().minusMinutes(5)))
            .count();
        
        return recentRequests > 50; // 5分钟内超过50次请求
    }
    
    /**
     * 更新性能指标
     */
    private void updatePerformanceMetrics(AIAuditLog auditLog) {
        String key = auditLog.getUserId() + "_" + auditLog.getOperationType();
        APIPerformanceMetrics metrics = performanceMetrics.computeIfAbsent(
            key, k -> new APIPerformanceMetrics(auditLog.getUserId(), auditLog.getOperationType()));
        
        metrics.incrementTotalCalls();
        metrics.addExecutionTime(auditLog.getExecutionTimeMs());
        
        if ("FAILED".equals(auditLog.getStatus())) {
            metrics.incrementFailures();
        }
        
        if (auditLog.getConfidenceScore() != null) {
            metrics.addConfidenceScore(auditLog.getConfidenceScore());
        }
    }
    
    /**
     * 加密敏感数据
     */
    private String encryptSensitiveData(String data) {
        if (data == null || data.isEmpty()) {
            return data;
        }
        
        try {
            // 对于长文本，只加密前500字符作为示例
            String dataToEncrypt = data.length() > 500 ? data.substring(0, 500) + "..." : data;
            return encryptor.encrypt(dataToEncrypt);
        } catch (Exception e) {
            System.err.println("数据加密失败: " + e.getMessage());
            return "[加密失败]";
        }
    }
    
    /**
     * 生成审计ID
     */
    private String generateAuditId() {
        return "AUDIT_" + System.currentTimeMillis() + "_" + auditLogCounter.incrementAndGet();
    }
    
    /**
     * 计算执行时间
     */
    private long calculateExecutionTime(LocalDateTime start, LocalDateTime end) {
        return java.time.Duration.between(start, end).toMillis();
    }
    
    /**
     * 获取审计统计信息
     */
    public AuditStatistics getAuditStatistics(LocalDateTime startTime, LocalDateTime endTime) {
        List<AIAuditLog> filteredLogs = auditLogs.values().stream()
            .filter(log -> log.getStartTime().isAfter(startTime) && log.getStartTime().isBefore(endTime))
            .toList();
        
        AuditStatistics stats = new AuditStatistics();
        stats.setTotalOperations(filteredLogs.size());
        stats.setSuccessfulOperations((int) filteredLogs.stream().filter(log -> "SUCCESS".equals(log.getStatus())).count());
        stats.setFailedOperations((int) filteredLogs.stream().filter(log -> "FAILED".equals(log.getStatus())).count());
        
        OptionalDouble avgExecutionTime = filteredLogs.stream()
            .mapToLong(AIAuditLog::getExecutionTimeMs)
            .average();
        stats.setAverageExecutionTime(avgExecutionTime.orElse(0.0));
        
        long anomalyCount = filteredLogs.stream()
            .filter(log -> log.getAnomalies() != null && !log.getAnomalies().isEmpty())
            .count();
        stats.setAnomalyCount((int) anomalyCount);
        
        // 按操作类型统计
        Map<String, Long> operationStats = filteredLogs.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                AIAuditLog::getOperationType,
                java.util.stream.Collectors.counting()));
        stats.setOperationTypeStats(operationStats);
        
        return stats;
    }
    
    /**
     * 获取用户的审计记录
     */
    public List<AIAuditLog> getUserAuditLogs(Long userId, int limit) {
        return auditLogs.values().stream()
            .filter(log -> log.getUserId().equals(userId))
            .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
            .limit(limit)
            .toList();
    }
    
    /**
     * 获取异常记录
     */
    public List<AIAuditLog> getAnomalousLogs(int limit) {
        return auditLogs.values().stream()
            .filter(log -> log.getAnomalies() != null && !log.getAnomalies().isEmpty())
            .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
            .limit(limit)
            .toList();
    }
    
    /**
     * AI操作请求
     */
    public static class AIOperationRequest {
        private Long userId;
        private String operationType;
        private String apiEndpoint;
        private String inputData;
        private String sessionId;
        private String clientIP;
        private String userAgent;
        
        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getOperationType() { return operationType; }
        public void setOperationType(String operationType) { this.operationType = operationType; }
        
        public String getApiEndpoint() { return apiEndpoint; }
        public void setApiEndpoint(String apiEndpoint) { this.apiEndpoint = apiEndpoint; }
        
        public String getInputData() { return inputData; }
        public void setInputData(String inputData) { this.inputData = inputData; }
        
        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        
        public String getClientIP() { return clientIP; }
        public void setClientIP(String clientIP) { this.clientIP = clientIP; }
        
        public String getUserAgent() { return userAgent; }
        public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    }
    
    /**
     * AI操作结果
     */
    public static class AIOperationResult {
        private boolean success;
        private String outputData;
        private Double confidenceScore;
        private String errorMessage;
        
        // Getters and Setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getOutputData() { return outputData; }
        public void setOutputData(String outputData) { this.outputData = outputData; }
        
        public Double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
        
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }
    
    /**
     * AI决策过程
     */
    public static class AIDecisionProcess {
        private List<String> steps;
        private String reasoningChain;
        private Map<String, Double> featureImportance;
        private List<String> alternativeOptions;
        
        // Getters and Setters
        public List<String> getSteps() { return steps; }
        public void setSteps(List<String> steps) { this.steps = steps; }
        
        public String getReasoningChain() { return reasoningChain; }
        public void setReasoningChain(String reasoningChain) { this.reasoningChain = reasoningChain; }
        
        public Map<String, Double> getFeatureImportance() { return featureImportance; }
        public void setFeatureImportance(Map<String, Double> featureImportance) { this.featureImportance = featureImportance; }
        
        public List<String> getAlternativeOptions() { return alternativeOptions; }
        public void setAlternativeOptions(List<String> alternativeOptions) { this.alternativeOptions = alternativeOptions; }
    }
    
    /**
     * 人工干预记录
     */
    public static class HumanIntervention {
        private Long teacherId;
        private LocalDateTime interventionTime;
        private String reason;
        private String originalResult;
        private String modifiedResult;
        private String comments;
        
        // Getters and Setters
        public Long getTeacherId() { return teacherId; }
        public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }
        
        public LocalDateTime getInterventionTime() { return interventionTime; }
        public void setInterventionTime(LocalDateTime interventionTime) { this.interventionTime = interventionTime; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        
        public String getOriginalResult() { return originalResult; }
        public void setOriginalResult(String originalResult) { this.originalResult = originalResult; }
        
        public String getModifiedResult() { return modifiedResult; }
        public void setModifiedResult(String modifiedResult) { this.modifiedResult = modifiedResult; }
        
        public String getComments() { return comments; }
        public void setComments(String comments) { this.comments = comments; }
    }
    
    /**
     * AI审计日志
     */
    public static class AIAuditLog {
        private String auditId;
        private Long userId;
        private String operationType;
        private String apiEndpoint;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private long executionTimeMs;
        private String requestData;
        private String responseData;
        private Double confidenceScore;
        private String status;
        private String errorMessage;
        private String sessionId;
        private String clientIP;
        private String userAgent;
        
        // AI决策相关
        private List<String> decisionSteps;
        private String reasoningChain;
        private Map<String, Double> featureImportance;
        private List<String> alternativeOptions;
        
        // 人工干预相关
        private HumanIntervention humanIntervention;
        private String interventionReason;
        private String originalResult;
        private String modifiedResult;
        
        // 异常检测
        private List<String> anomalies;
        
        // Getters and Setters
        public String getAuditId() { return auditId; }
        public void setAuditId(String auditId) { this.auditId = auditId; }
        
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getOperationType() { return operationType; }
        public void setOperationType(String operationType) { this.operationType = operationType; }
        
        public String getApiEndpoint() { return apiEndpoint; }
        public void setApiEndpoint(String apiEndpoint) { this.apiEndpoint = apiEndpoint; }
        
        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        
        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
        
        public long getExecutionTimeMs() { return executionTimeMs; }
        public void setExecutionTimeMs(long executionTimeMs) { this.executionTimeMs = executionTimeMs; }
        
        public String getRequestData() { return requestData; }
        public void setRequestData(String requestData) { this.requestData = requestData; }
        
        public String getResponseData() { return responseData; }
        public void setResponseData(String responseData) { this.responseData = responseData; }
        
        public Double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        
        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        
        public String getClientIP() { return clientIP; }
        public void setClientIP(String clientIP) { this.clientIP = clientIP; }
        
        public String getUserAgent() { return userAgent; }
        public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
        
        public List<String> getDecisionSteps() { return decisionSteps; }
        public void setDecisionSteps(List<String> decisionSteps) { this.decisionSteps = decisionSteps; }
        
        public String getReasoningChain() { return reasoningChain; }
        public void setReasoningChain(String reasoningChain) { this.reasoningChain = reasoningChain; }
        
        public Map<String, Double> getFeatureImportance() { return featureImportance; }
        public void setFeatureImportance(Map<String, Double> featureImportance) { this.featureImportance = featureImportance; }
        
        public List<String> getAlternativeOptions() { return alternativeOptions; }
        public void setAlternativeOptions(List<String> alternativeOptions) { this.alternativeOptions = alternativeOptions; }
        
        public HumanIntervention getHumanIntervention() { return humanIntervention; }
        public void setHumanIntervention(HumanIntervention humanIntervention) { this.humanIntervention = humanIntervention; }
        
        public String getInterventionReason() { return interventionReason; }
        public void setInterventionReason(String interventionReason) { this.interventionReason = interventionReason; }
        
        public String getOriginalResult() { return originalResult; }
        public void setOriginalResult(String originalResult) { this.originalResult = originalResult; }
        
        public String getModifiedResult() { return modifiedResult; }
        public void setModifiedResult(String modifiedResult) { this.modifiedResult = modifiedResult; }
        
        public List<String> getAnomalies() { return anomalies; }
        public void setAnomalies(List<String> anomalies) { this.anomalies = anomalies; }
    }
    
    /**
     * API性能指标
     */
    private static class APIPerformanceMetrics {
        private final Long userId;
        private final String operationType;
        private int totalCalls = 0;
        private int failedCalls = 0;
        private final List<Long> executionTimes = new ArrayList<>();
        private final List<Double> confidenceScores = new ArrayList<>();
        
        public APIPerformanceMetrics(Long userId, String operationType) {
            this.userId = userId;
            this.operationType = operationType;
        }
        
        public void incrementTotalCalls() { totalCalls++; }
        public void incrementFailures() { failedCalls++; }
        public void addExecutionTime(long time) { executionTimes.add(time); }
        public void addConfidenceScore(double score) { confidenceScores.add(score); }
        
        public double getFailureRate() {
            return totalCalls == 0 ? 0.0 : (double) failedCalls / totalCalls;
        }
        
        public double getAverageExecutionTime() {
            return executionTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
        }
        
        public double getAverageConfidence() {
            return confidenceScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        }
    }
    
    /**
     * 审计统计信息
     */
    public static class AuditStatistics {
        private int totalOperations;
        private int successfulOperations;
        private int failedOperations;
        private double averageExecutionTime;
        private int anomalyCount;
        private Map<String, Long> operationTypeStats;
        
        // Getters and Setters
        public int getTotalOperations() { return totalOperations; }
        public void setTotalOperations(int totalOperations) { this.totalOperations = totalOperations; }
        
        public int getSuccessfulOperations() { return successfulOperations; }
        public void setSuccessfulOperations(int successfulOperations) { this.successfulOperations = successfulOperations; }
        
        public int getFailedOperations() { return failedOperations; }
        public void setFailedOperations(int failedOperations) { this.failedOperations = failedOperations; }
        
        public double getAverageExecutionTime() { return averageExecutionTime; }
        public void setAverageExecutionTime(double averageExecutionTime) { this.averageExecutionTime = averageExecutionTime; }
        
        public int getAnomalyCount() { return anomalyCount; }
        public void setAnomalyCount(int anomalyCount) { this.anomalyCount = anomalyCount; }
        
        public Map<String, Long> getOperationTypeStats() { return operationTypeStats; }
        public void setOperationTypeStats(Map<String, Long> operationTypeStats) { this.operationTypeStats = operationTypeStats; }
    }
} 