package com.example.smartedu.service;

import com.example.smartedu.config.AISecurityConfig;
import com.example.smartedu.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * AI访问控制服务
 * 负责权限验证、频率限制、安全检查等功能
 */
@Service
public class AIAccessControlService {
    
    @Autowired
    private AISecurityConfig.APIRateLimitConfig rateLimitConfig;
    
    // 用户API调用频率记录 userId -> APICallRecord
    private final Map<Long, APICallRecord> userCallRecords = new ConcurrentHashMap<>();
    
    // 黑名单用户（临时封禁）
    private final Map<Long, LocalDateTime> blacklistedUsers = new ConcurrentHashMap<>();
    
    // 可疑行为记录
    private final Map<Long, SuspiciousActivityRecord> suspiciousActivities = new ConcurrentHashMap<>();
    
    /**
     * 检查用户是否有AI操作权限
     */
    public boolean hasAIPermission(User user, String operation) {
        if (user == null) {
            return false;
        }
        
        // 检查用户是否在黑名单中
        if (isUserBlacklisted(user.getId())) {
            return false;
        }
        
        // 基于角色的权限控制
        String role = user.getRole();
        switch (operation.toLowerCase()) {
            case "grading":
                return "teacher".equals(role) || "admin".equals(role);
            case "question_generation":
                return "teacher".equals(role) || "admin".equals(role);
            case "learning_assistant":
                return "student".equals(role) || "teacher".equals(role) || "admin".equals(role);
            case "content_analysis":
                return "teacher".equals(role) || "admin".equals(role);
            case "ai_detection":
                return "teacher".equals(role) || "admin".equals(role);
            default:
                return false;
        }
    }
    
    /**
     * 检查API调用频率限制
     */
    public boolean checkRateLimit(Long userId, String apiType) {
        APICallRecord record = userCallRecords.computeIfAbsent(userId, k -> new APICallRecord());
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneMinuteAgo = now.minus(1, ChronoUnit.MINUTES);
        
        // 清理过期记录
        record.callTimes.removeIf(time -> time.isBefore(oneMinuteAgo));
        
        // 检查是否超过限制
        if (record.callTimes.size() >= rateLimitConfig.getMaxRequestsPerMinute()) {
            // 记录可疑行为
            recordSuspiciousActivity(userId, "RATE_LIMIT_EXCEEDED", 
                "用户在1分钟内调用API次数超过限制: " + record.callTimes.size());
            return false;
        }
        
        // 记录本次调用
        record.callTimes.add(now);
        record.totalCalls.incrementAndGet();
        
        return true;
    }
    
    /**
     * 执行安全检查
     */
    public SecurityCheckResult performSecurityCheck(AIRequest request) {
        SecurityCheckResult result = new SecurityCheckResult();
        result.setRequestId(request.getRequestId());
        result.setUserId(request.getUserId());
        result.setTimestamp(LocalDateTime.now());
        
        // 1. 检查请求频率
        if (!checkRateLimit(request.getUserId(), request.getApiType())) {
            result.setBlocked(true);
            result.addReason("API调用频率超限");
        }
        
        // 2. 检查内容安全性
        if (containsSensitiveContent(request.getContent())) {
            result.setBlocked(true);
            result.addReason("包含敏感内容");
            recordSuspiciousActivity(request.getUserId(), "SENSITIVE_CONTENT", 
                "请求包含可能的敏感内容");
        }
        
        // 3. 检查请求大小
        if (request.getContent() != null && request.getContent().length() > 10000) {
            result.setBlocked(true);
            result.addReason("请求内容过大");
        }
        
        // 4. 检查用户是否被封禁
        if (isUserBlacklisted(request.getUserId())) {
            result.setBlocked(true);
            result.addReason("用户已被临时封禁");
        }
        
        return result;
    }
    
    /**
     * 检查用户是否在黑名单中
     */
    private boolean isUserBlacklisted(Long userId) {
        LocalDateTime banExpiry = blacklistedUsers.get(userId);
        if (banExpiry != null) {
            if (LocalDateTime.now().isBefore(banExpiry)) {
                return true;
            } else {
                // 封禁已过期，移除黑名单
                blacklistedUsers.remove(userId);
            }
        }
        return false;
    }
    
    /**
     * 临时封禁用户
     */
    public void banUser(Long userId, int minutes, String reason) {
        LocalDateTime banExpiry = LocalDateTime.now().plus(minutes, ChronoUnit.MINUTES);
        blacklistedUsers.put(userId, banExpiry);
        
        recordSuspiciousActivity(userId, "USER_BANNED", 
            String.format("用户被封禁 %d 分钟，原因: %s", minutes, reason));
    }
    
    /**
     * 检查内容是否包含敏感信息
     */
    private boolean containsSensitiveContent(String content) {
        if (content == null) return false;
        
        String lowerContent = content.toLowerCase();
        
        // 检查敏感关键词
        String[] sensitiveKeywords = {
            "password", "密码", "身份证", "手机号", "银行卡",
            "api_key", "secret", "token", "私钥", "access_key"
        };
        
        for (String keyword : sensitiveKeywords) {
            if (lowerContent.contains(keyword)) {
                return true;
            }
        }
        
        // 检查格式化的敏感信息（如手机号、身份证号等）
        return content.matches(".*\\b1[3-9]\\d{9}\\b.*") ||  // 手机号
               content.matches(".*\\b\\d{17}[\\dX]\\b.*") ||   // 身份证号
               content.matches(".*\\b\\d{16,19}\\b.*");        // 银行卡号
    }
    
    /**
     * 记录可疑行为
     */
    private void recordSuspiciousActivity(Long userId, String activityType, String description) {
        SuspiciousActivityRecord record = suspiciousActivities.computeIfAbsent(
            userId, k -> new SuspiciousActivityRecord(userId));
        
        record.addActivity(activityType, description);
        
        // 如果可疑行为过多，自动封禁
        if (record.getActivityCount() > 5) {
            banUser(userId, 30, "可疑行为过多");
        }
    }
    
    /**
     * 获取用户的安全状态
     */
    public UserSecurityStatus getUserSecurityStatus(Long userId) {
        UserSecurityStatus status = new UserSecurityStatus();
        status.setUserId(userId);
        status.setBlacklisted(isUserBlacklisted(userId));
        
        APICallRecord callRecord = userCallRecords.get(userId);
        if (callRecord != null) {
            status.setTotalAPICalls(callRecord.totalCalls.get());
            status.setRecentCallCount(callRecord.callTimes.size());
        }
        
        SuspiciousActivityRecord activityRecord = suspiciousActivities.get(userId);
        if (activityRecord != null) {
            status.setSuspiciousActivityCount(activityRecord.getActivityCount());
            status.setLastSuspiciousActivity(activityRecord.getLastActivity());
        }
        
        return status;
    }
    
    /**
     * 清理过期数据（定期调用）
     */
    public void cleanupExpiredData() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minus(1, ChronoUnit.HOURS);
        
        // 清理过期的API调用记录
        userCallRecords.values().forEach(record -> 
            record.callTimes.removeIf(time -> time.isBefore(oneHourAgo)));
        
        // 清理过期的黑名单
        blacklistedUsers.entrySet().removeIf(entry -> 
            LocalDateTime.now().isAfter(entry.getValue()));
    }
    
    /**
     * API调用记录
     */
    private static class APICallRecord {
        private final java.util.List<LocalDateTime> callTimes = new java.util.ArrayList<>();
        private final AtomicInteger totalCalls = new AtomicInteger(0);
    }
    
    /**
     * 可疑行为记录
     */
    private static class SuspiciousActivityRecord {
        private final Long userId;
        private final java.util.List<SuspiciousActivity> activities = new java.util.ArrayList<>();
        
        public SuspiciousActivityRecord(Long userId) {
            this.userId = userId;
        }
        
        public void addActivity(String type, String description) {
            activities.add(new SuspiciousActivity(type, description, LocalDateTime.now()));
        }
        
        public int getActivityCount() {
            return activities.size();
        }
        
        public SuspiciousActivity getLastActivity() {
            return activities.isEmpty() ? null : activities.get(activities.size() - 1);
        }
    }
    
    /**
     * 可疑行为记录
     */
    public static class SuspiciousActivity {
        private String type;
        private String description;
        private LocalDateTime timestamp;
        
        public SuspiciousActivity(String type, String description, LocalDateTime timestamp) {
            this.type = type;
            this.description = description;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }
    
    /**
     * AI请求对象
     */
    public static class AIRequest {
        private String requestId;
        private Long userId;
        private String apiType;
        private String content;
        
        // Getters and Setters
        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }
        
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getApiType() { return apiType; }
        public void setApiType(String apiType) { this.apiType = apiType; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
    
    /**
     * 安全检查结果
     */
    public static class SecurityCheckResult {
        private String requestId;
        private Long userId;
        private LocalDateTime timestamp;
        private boolean blocked = false;
        private java.util.List<String> reasons = new java.util.ArrayList<>();
        
        public void addReason(String reason) {
            reasons.add(reason);
        }
        
        // Getters and Setters
        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }
        
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        
        public boolean isBlocked() { return blocked; }
        public void setBlocked(boolean blocked) { this.blocked = blocked; }
        
        public java.util.List<String> getReasons() { return reasons; }
        public void setReasons(java.util.List<String> reasons) { this.reasons = reasons; }
    }
    
    /**
     * 用户安全状态
     */
    public static class UserSecurityStatus {
        private Long userId;
        private boolean blacklisted;
        private int totalAPICalls;
        private int recentCallCount;
        private int suspiciousActivityCount;
        private SuspiciousActivity lastSuspiciousActivity;
        
        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public boolean isBlacklisted() { return blacklisted; }
        public void setBlacklisted(boolean blacklisted) { this.blacklisted = blacklisted; }
        
        public int getTotalAPICalls() { return totalAPICalls; }
        public void setTotalAPICalls(int totalAPICalls) { this.totalAPICalls = totalAPICalls; }
        
        public int getRecentCallCount() { return recentCallCount; }
        public void setRecentCallCount(int recentCallCount) { this.recentCallCount = recentCallCount; }
        
        public int getSuspiciousActivityCount() { return suspiciousActivityCount; }
        public void setSuspiciousActivityCount(int suspiciousActivityCount) { this.suspiciousActivityCount = suspiciousActivityCount; }
        
        public SuspiciousActivity getLastSuspiciousActivity() { return lastSuspiciousActivity; }
        public void setLastSuspiciousActivity(SuspiciousActivity lastSuspiciousActivity) { this.lastSuspiciousActivity = lastSuspiciousActivity; }
    }
} 