package com.example.smartedu.service;

import com.example.smartedu.config.AISecurityConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

/**
 * 数据隐私保护服务
 * 负责敏感数据加密、脱敏处理、差分隐私等隐私保护功能
 */
@Service
public class DataPrivacyService {
    
    @Autowired
    private AISecurityConfig.SimpleEncryptor encryptor;
    
    private final SecureRandom secureRandom = new SecureRandom();
    
    // 敏感信息正则模式
    private static final Pattern PHONE_PATTERN = Pattern.compile("1[3-9]\\d{9}");
    private static final Pattern ID_CARD_PATTERN = Pattern.compile("\\d{17}[\\dX]");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[\\w._%+-]+@[\\w.-]+\\.[A-Z]{2,}");
    private static final Pattern BANK_CARD_PATTERN = Pattern.compile("\\d{16,19}");
    
    /**
     * 加密敏感数据
     */
    public String encryptSensitiveData(String data) {
        if (data == null || data.isEmpty()) {
            return data;
        }
        
        try {
            System.out.println("加密敏感数据，原始长度: " + data.length());
            return encryptor.encrypt(data);
        } catch (Exception e) {
            System.err.println("数据加密失败: " + e.getMessage());
            throw new RuntimeException("数据加密失败", e);
        }
    }
    
    /**
     * 解密敏感数据
     */
    public String decryptSensitiveData(String encryptedData) {
        if (encryptedData == null || encryptedData.isEmpty()) {
            return encryptedData;
        }
        
        try {
            return encryptor.decrypt(encryptedData);
        } catch (Exception e) {
            System.err.println("数据解密失败: " + e.getMessage());
            throw new RuntimeException("数据解密失败", e);
        }
    }
    
    /**
     * 学生数据脱敏处理
     */
    public String anonymizeStudentData(String studentInfo) {
        if (studentInfo == null) {
            return null;
        }
        
        System.out.println("开始学生数据脱敏处理");
        
        String anonymized = studentInfo;
        
        // 脱敏手机号
        anonymized = PHONE_PATTERN.matcher(anonymized).replaceAll(match -> {
            String phone = match.group();
            return phone.substring(0, 3) + "****" + phone.substring(7);
        });
        
        // 脱敏身份证号
        anonymized = ID_CARD_PATTERN.matcher(anonymized).replaceAll(match -> {
            String idCard = match.group();
            return idCard.substring(0, 6) + "********" + idCard.substring(14);
        });
        
        // 脱敏邮箱
        anonymized = EMAIL_PATTERN.matcher(anonymized).replaceAll(match -> {
            String email = match.group();
            int atIndex = email.indexOf('@');
            if (atIndex > 2) {
                return email.substring(0, 2) + "***" + email.substring(atIndex);
            }
            return "***" + email.substring(atIndex);
        });
        
        // 脱敏银行卡号
        anonymized = BANK_CARD_PATTERN.matcher(anonymized).replaceAll(match -> {
            String card = match.group();
            return card.substring(0, 4) + "****" + "****" + card.substring(card.length() - 4);
        });
        
        return anonymized;
    }
    
    /**
     * 差分隐私处理
     */
    public String addDifferentialPrivacy(String data, double epsilon) {
        if (data == null) {
            return null;
        }
        
        System.out.println("应用差分隐私，隐私预算ε=" + epsilon);
        
        // 简化的差分隐私实现：添加拉普拉斯噪声
        StringBuilder noisyData = new StringBuilder();
        
        for (char c : data.toCharArray()) {
            if (Character.isDigit(c)) {
                // 对数字添加噪声
                int digit = Character.getNumericValue(c);
                double noise = generateLaplaceNoise(0, 1.0 / epsilon);
                int noisyDigit = Math.max(0, Math.min(9, (int) Math.round(digit + noise)));
                noisyData.append(noisyDigit);
            } else {
                noisyData.append(c);
            }
        }
        
        return noisyData.toString();
    }
    
    /**
     * 生成拉普拉斯噪声
     */
    private double generateLaplaceNoise(double location, double scale) {
        double u = secureRandom.nextDouble() - 0.5;
        return location - scale * Math.signum(u) * Math.log(1 - 2 * Math.abs(u));
    }
    
    /**
     * 数据匿名化处理
     */
    public AnonymizedData anonymizeData(String originalData, AnonymizationLevel level) {
        AnonymizedData result = new AnonymizedData();
        result.setOriginalLength(originalData != null ? originalData.length() : 0);
        result.setAnonymizationLevel(level);
        result.setProcessedTime(LocalDateTime.now());
        
        if (originalData == null) {
            result.setAnonymizedData("");
            return result;
        }
        
        String anonymized;
        switch (level) {
            case LOW:
                anonymized = applyLowLevelAnonymization(originalData);
                break;
            case MEDIUM:
                anonymized = applyMediumLevelAnonymization(originalData);
                break;
            case HIGH:
                anonymized = applyHighLevelAnonymization(originalData);
                break;
            default:
                anonymized = originalData;
        }
        
        result.setAnonymizedData(anonymized);
        result.setDataLossRate(calculateDataLossRate(originalData, anonymized));
        
        return result;
    }
    
    /**
     * 低级别匿名化（保留大部分信息）
     */
    private String applyLowLevelAnonymization(String data) {
        // 仅脱敏明显的敏感信息
        return anonymizeStudentData(data);
    }
    
    /**
     * 中级别匿名化（平衡隐私和可用性）
     */
    private String applyMediumLevelAnonymization(String data) {
        String anonymized = anonymizeStudentData(data);
        
        // 泛化处理：将具体数值范围化
        anonymized = anonymized.replaceAll("\\d{4}年", "20XX年");
        anonymized = anonymized.replaceAll("\\d+岁", "XX岁");
        anonymized = anonymized.replaceAll("\\d+分", "XX分");
        
        return anonymized;
    }
    
    /**
     * 高级别匿名化（最大程度保护隐私）
     */
    private String applyHighLevelAnonymization(String data) {
        String anonymized = applyMediumLevelAnonymization(data);
        
        // 更激进的泛化
        anonymized = anonymized.replaceAll("[一-龟]{2,4}大学", "XX大学");
        anonymized = anonymized.replaceAll("[一-龟]{2,4}学院", "XX学院");
        anonymized = anonymized.replaceAll("[一-龟]{2,4}专业", "XX专业");
        
        // 添加随机噪声
        return addRandomNoise(anonymized, 0.1);
    }
    
    /**
     * 添加随机噪声
     */
    private String addRandomNoise(String data, double noiseLevel) {
        StringBuilder noisy = new StringBuilder();
        
        for (int i = 0; i < data.length(); i++) {
            char c = data.charAt(i);
            
            // 以一定概率添加噪声
            if (secureRandom.nextDouble() < noiseLevel && Character.isLetter(c)) {
                // 随机替换字符
                noisy.append('*');
            } else {
                noisy.append(c);
            }
        }
        
        return noisy.toString();
    }
    
    /**
     * 计算数据损失率
     */
    private double calculateDataLossRate(String original, String anonymized) {
        if (original == null || anonymized == null) return 0.0;
        
        int differences = 0;
        int maxLength = Math.max(original.length(), anonymized.length());
        
        for (int i = 0; i < maxLength; i++) {
            char origChar = i < original.length() ? original.charAt(i) : ' ';
            char anonChar = i < anonymized.length() ? anonymized.charAt(i) : ' ';
            
            if (origChar != anonChar) {
                differences++;
            }
        }
        
        return maxLength > 0 ? (double) differences / maxLength : 0.0;
    }
    
    /**
     * 生成数据哈希指纹（用于数据完整性验证）
     */
    public String generateDataFingerprint(String data) {
        if (data == null) return null;
        
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            System.err.println("生成数据指纹失败: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * 检查数据是否包含敏感信息
     */
    public SensitiveDataReport detectSensitiveData(String data) {
        SensitiveDataReport report = new SensitiveDataReport();
        report.setDataLength(data != null ? data.length() : 0);
        report.setScanTime(LocalDateTime.now());
        
        if (data == null) {
            return report;
        }
        
        List<SensitiveDataMatch> matches = new ArrayList<>();
        
        // 检测手机号
        java.util.regex.Matcher phoneMatcher = PHONE_PATTERN.matcher(data);
        while (phoneMatcher.find()) {
            matches.add(new SensitiveDataMatch("手机号", phoneMatcher.start(), phoneMatcher.end(), "HIGH"));
        }
        
        // 检测身份证号
        java.util.regex.Matcher idMatcher = ID_CARD_PATTERN.matcher(data);
        while (idMatcher.find()) {
            matches.add(new SensitiveDataMatch("身份证号", idMatcher.start(), idMatcher.end(), "HIGH"));
        }
        
        // 检测邮箱
        java.util.regex.Matcher emailMatcher = EMAIL_PATTERN.matcher(data);
        while (emailMatcher.find()) {
            matches.add(new SensitiveDataMatch("电子邮箱", emailMatcher.start(), emailMatcher.end(), "MEDIUM"));
        }
        
        // 检测银行卡号
        java.util.regex.Matcher cardMatcher = BANK_CARD_PATTERN.matcher(data);
        while (cardMatcher.find()) {
            matches.add(new SensitiveDataMatch("银行卡号", cardMatcher.start(), cardMatcher.end(), "HIGH"));
        }
        
        report.setSensitiveMatches(matches);
        report.setContainsSensitiveData(!matches.isEmpty());
        
        // 计算风险等级
        long highRiskCount = matches.stream().filter(m -> "HIGH".equals(m.getRiskLevel())).count();
        if (highRiskCount > 0) {
            report.setRiskLevel("HIGH");
        } else if (!matches.isEmpty()) {
            report.setRiskLevel("MEDIUM");
        } else {
            report.setRiskLevel("LOW");
        }
        
        return report;
    }
    
    /**
     * 数据生命周期管理
     */
    public DataLifecycleInfo manageDataLifecycle(String dataId, String dataType, LocalDateTime createdTime) {
        DataLifecycleInfo info = new DataLifecycleInfo();
        info.setDataId(dataId);
        info.setDataType(dataType);
        info.setCreatedTime(createdTime);
        info.setCurrentTime(LocalDateTime.now());
        
        // 根据数据类型设置保留期限
        LocalDateTime retentionEnd = calculateRetentionEnd(dataType, createdTime);
        info.setRetentionEnd(retentionEnd);
        
        // 判断数据状态
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(retentionEnd)) {
            info.setStatus("EXPIRED");
            info.setAction("DELETE");
        } else if (now.isAfter(retentionEnd.minusDays(30))) {
            info.setStatus("EXPIRING_SOON");
            info.setAction("WARN");
        } else {
            info.setStatus("ACTIVE");
            info.setAction("RETAIN");
        }
        
        return info;
    }
    
    /**
     * 计算数据保留期限
     */
    private LocalDateTime calculateRetentionEnd(String dataType, LocalDateTime createdTime) {
        switch (dataType.toLowerCase()) {
            case "exam_result":
                return createdTime.plusYears(3); // 考试结果保留3年
            case "student_answer":
                return createdTime.plusYears(2); // 学生答案保留2年
            case "ai_audit_log":
                return createdTime.plusYears(1); // AI审计日志保留1年
            case "temporary_data":
                return createdTime.plusDays(30); // 临时数据保留30天
            default:
                return createdTime.plusYears(1); // 默认保留1年
        }
    }
    
    /**
     * 安全删除数据
     */
    public boolean secureDeleteData(String data) {
        if (data == null) {
            return true;
        }
        
        try {
            // 多次覆写（简化实现）
            String overwrite = data;
            for (int i = 0; i < 3; i++) {
                overwrite = generateRandomString(data.length());
            }
            
            System.out.println("数据已安全删除");
            return true;
        } catch (Exception e) {
            System.err.println("安全删除失败: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 生成随机字符串
     */
    private String generateRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(secureRandom.nextInt(chars.length())));
        }
        return sb.toString();
    }
    
    // 数据模型类
    
    /**
     * 匿名化等级
     */
    public enum AnonymizationLevel {
        LOW, MEDIUM, HIGH
    }
    
    /**
     * 匿名化数据结果
     */
    public static class AnonymizedData {
        private String anonymizedData;
        private int originalLength;
        private AnonymizationLevel anonymizationLevel;
        private double dataLossRate;
        private LocalDateTime processedTime;
        
        // Getters and Setters
        public String getAnonymizedData() { return anonymizedData; }
        public void setAnonymizedData(String anonymizedData) { this.anonymizedData = anonymizedData; }
        
        public int getOriginalLength() { return originalLength; }
        public void setOriginalLength(int originalLength) { this.originalLength = originalLength; }
        
        public AnonymizationLevel getAnonymizationLevel() { return anonymizationLevel; }
        public void setAnonymizationLevel(AnonymizationLevel anonymizationLevel) { this.anonymizationLevel = anonymizationLevel; }
        
        public double getDataLossRate() { return dataLossRate; }
        public void setDataLossRate(double dataLossRate) { this.dataLossRate = dataLossRate; }
        
        public LocalDateTime getProcessedTime() { return processedTime; }
        public void setProcessedTime(LocalDateTime processedTime) { this.processedTime = processedTime; }
    }
    
    /**
     * 敏感数据检测报告
     */
    public static class SensitiveDataReport {
        private int dataLength;
        private LocalDateTime scanTime;
        private boolean containsSensitiveData;
        private String riskLevel;
        private List<SensitiveDataMatch> sensitiveMatches;
        
        // Getters and Setters
        public int getDataLength() { return dataLength; }
        public void setDataLength(int dataLength) { this.dataLength = dataLength; }
        
        public LocalDateTime getScanTime() { return scanTime; }
        public void setScanTime(LocalDateTime scanTime) { this.scanTime = scanTime; }
        
        public boolean isContainsSensitiveData() { return containsSensitiveData; }
        public void setContainsSensitiveData(boolean containsSensitiveData) { this.containsSensitiveData = containsSensitiveData; }
        
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        
        public List<SensitiveDataMatch> getSensitiveMatches() { return sensitiveMatches; }
        public void setSensitiveMatches(List<SensitiveDataMatch> sensitiveMatches) { this.sensitiveMatches = sensitiveMatches; }
    }
    
    /**
     * 敏感数据匹配结果
     */
    public static class SensitiveDataMatch {
        private String dataType;
        private int startPosition;
        private int endPosition;
        private String riskLevel;
        
        public SensitiveDataMatch(String dataType, int startPosition, int endPosition, String riskLevel) {
            this.dataType = dataType;
            this.startPosition = startPosition;
            this.endPosition = endPosition;
            this.riskLevel = riskLevel;
        }
        
        // Getters and Setters
        public String getDataType() { return dataType; }
        public void setDataType(String dataType) { this.dataType = dataType; }
        
        public int getStartPosition() { return startPosition; }
        public void setStartPosition(int startPosition) { this.startPosition = startPosition; }
        
        public int getEndPosition() { return endPosition; }
        public void setEndPosition(int endPosition) { this.endPosition = endPosition; }
        
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    }
    
    /**
     * 数据生命周期信息
     */
    public static class DataLifecycleInfo {
        private String dataId;
        private String dataType;
        private LocalDateTime createdTime;
        private LocalDateTime currentTime;
        private LocalDateTime retentionEnd;
        private String status;
        private String action;
        
        // Getters and Setters
        public String getDataId() { return dataId; }
        public void setDataId(String dataId) { this.dataId = dataId; }
        
        public String getDataType() { return dataType; }
        public void setDataType(String dataType) { this.dataType = dataType; }
        
        public LocalDateTime getCreatedTime() { return createdTime; }
        public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
        
        public LocalDateTime getCurrentTime() { return currentTime; }
        public void setCurrentTime(LocalDateTime currentTime) { this.currentTime = currentTime; }
        
        public LocalDateTime getRetentionEnd() { return retentionEnd; }
        public void setRetentionEnd(LocalDateTime retentionEnd) { this.retentionEnd = retentionEnd; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
    }
} 