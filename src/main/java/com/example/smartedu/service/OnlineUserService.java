package com.example.smartedu.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OnlineUserService {
    
    // 存储在线用户信息：userId -> 最后活跃时间
    private final Map<Long, LocalDateTime> onlineUsers = new ConcurrentHashMap<>();
    
    // 在线状态超时时间（分钟）
    private static final int ONLINE_TIMEOUT_MINUTES = 30;
    
    /**
     * 用户上线
     */
    public void userOnline(Long userId) {
        onlineUsers.put(userId, LocalDateTime.now());
    }
    
    /**
     * 用户下线
     */
    public void userOffline(Long userId) {
        onlineUsers.remove(userId);
    }
    
    /**
     * 更新用户活跃时间
     */
    public void updateUserActivity(Long userId) {
        if (onlineUsers.containsKey(userId)) {
            onlineUsers.put(userId, LocalDateTime.now());
        }
    }
    
    /**
     * 检查用户是否在线
     */
    public boolean isUserOnline(Long userId) {
        LocalDateTime lastActivity = onlineUsers.get(userId);
        if (lastActivity == null) {
            return false;
        }
        
        // 检查是否超时
        LocalDateTime timeout = LocalDateTime.now().minusMinutes(ONLINE_TIMEOUT_MINUTES);
        if (lastActivity.isBefore(timeout)) {
            // 超时，移除用户
            onlineUsers.remove(userId);
            return false;
        }
        
        return true;
    }
    
    /**
     * 获取所有在线用户ID
     */
    public Set<Long> getOnlineUserIds() {
        // 清理超时用户
        LocalDateTime timeout = LocalDateTime.now().minusMinutes(ONLINE_TIMEOUT_MINUTES);
        onlineUsers.entrySet().removeIf(entry -> entry.getValue().isBefore(timeout));
        
        return onlineUsers.keySet();
    }
    
    /**
     * 获取在线用户数量
     */
    public int getOnlineUserCount() {
        return getOnlineUserIds().size();
    }
    
    /**
     * 清理超时用户
     */
    public void cleanupExpiredUsers() {
        LocalDateTime timeout = LocalDateTime.now().minusMinutes(ONLINE_TIMEOUT_MINUTES);
        onlineUsers.entrySet().removeIf(entry -> entry.getValue().isBefore(timeout));
    }
} 