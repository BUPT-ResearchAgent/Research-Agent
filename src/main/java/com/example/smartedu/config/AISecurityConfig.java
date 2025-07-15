package com.example.smartedu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AI系统安全配置类
 * 负责加密、访问控制、安全通信等核心安全功能
 */
@Configuration
public class AISecurityConfig {
    
    @Value("${security.api.encryption.key:#{null}}")
    private String encryptionKey;
    
    @Value("${security.deepseek.api.rate-limit:100}")
    private int apiRateLimit;
    
    @Value("${security.deepseek.api.timeout:30}")
    private int apiTimeout;
    
    /**
     * 简单加密器
     */
    @Bean
    public SimpleEncryptor simpleEncryptor() {
        String key = encryptionKey != null ? encryptionKey : generateSecureKey();
        return new SimpleEncryptor(key);
    }
    
    /**
     * 安全随机数生成器
     */
    @Bean
    public SecureRandom secureRandom() {
        return new SecureRandom();
    }
    
    /**
     * API访问限制配置
     */
    @Bean
    public APIRateLimitConfig apiRateLimitConfig() {
        APIRateLimitConfig config = new APIRateLimitConfig();
        config.setMaxRequestsPerMinute(apiRateLimit);
        config.setTimeoutSeconds(apiTimeout);
        config.setRetryAttempts(3);
        config.setBackoffMultiplier(2.0);
        return config;
    }
    
    /**
     * 生成安全密钥
     */
    private String generateSecureKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
            keyGenerator.init(256, new SecureRandom());
            SecretKey secretKey = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            // 降级到简单密钥生成
            return Base64.getEncoder().encodeToString("SmartEduDefaultKey123456789012".getBytes());
        }
    }
    
    /**
     * 简单加密器实现类
     */
    public static class SimpleEncryptor {
        private static final String ALGORITHM = "AES";
        private static final String TRANSFORMATION = "AES/ECB/PKCS5Padding";
        private final String secretKey;
        
        public SimpleEncryptor(String secretKey) {
            this.secretKey = secretKey;
        }
        
        /**
         * 加密文本
         */
        public String encrypt(String plainText) {
            try {
                Cipher cipher = Cipher.getInstance(TRANSFORMATION);
                SecretKeySpec keySpec = new SecretKeySpec(getKey(), ALGORITHM);
                cipher.init(Cipher.ENCRYPT_MODE, keySpec);
                byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
                return Base64.getEncoder().encodeToString(encrypted);
            } catch (Exception e) {
                throw new RuntimeException("加密失败", e);
            }
        }
        
        /**
         * 解密文本
         */
        public String decrypt(String encryptedText) {
            try {
                Cipher cipher = Cipher.getInstance(TRANSFORMATION);
                SecretKeySpec keySpec = new SecretKeySpec(getKey(), ALGORITHM);
                cipher.init(Cipher.DECRYPT_MODE, keySpec);
                byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
                return new String(decrypted, StandardCharsets.UTF_8);
            } catch (Exception e) {
                throw new RuntimeException("解密失败", e);
            }
        }
        
        /**
         * 获取密钥字节数组
         */
        private byte[] getKey() throws Exception {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] key = sha.digest(secretKey.getBytes(StandardCharsets.UTF_8));
            // 取前16字节作为AES密钥
            byte[] shortKey = new byte[16];
            System.arraycopy(key, 0, shortKey, 0, 16);
            return shortKey;
        }
        
        /**
         * 生成哈希值（用于密码验证等）
         */
        public String hash(String input) {
            try {
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
                return Base64.getEncoder().encodeToString(hash);
            } catch (Exception e) {
                throw new RuntimeException("哈希生成失败", e);
            }
        }
    }
    
    /**
     * API限制配置类
     */
    public static class APIRateLimitConfig {
        private int maxRequestsPerMinute;
        private int timeoutSeconds;
        private int retryAttempts;
        private double backoffMultiplier;
        
        // Getters and Setters
        public int getMaxRequestsPerMinute() { return maxRequestsPerMinute; }
        public void setMaxRequestsPerMinute(int maxRequestsPerMinute) { this.maxRequestsPerMinute = maxRequestsPerMinute; }
        
        public int getTimeoutSeconds() { return timeoutSeconds; }
        public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
        
        public int getRetryAttempts() { return retryAttempts; }
        public void setRetryAttempts(int retryAttempts) { this.retryAttempts = retryAttempts; }
        
        public double getBackoffMultiplier() { return backoffMultiplier; }
        public void setBackoffMultiplier(double backoffMultiplier) { this.backoffMultiplier = backoffMultiplier; }
    }
} 