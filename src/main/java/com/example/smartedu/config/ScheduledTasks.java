package com.example.smartedu.config;

import com.example.smartedu.service.OnlineUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasks {
    
    @Autowired
    private OnlineUserService onlineUserService;
    
    /**
     * 每5分钟清理一次过期的在线用户
     */
    @Scheduled(fixedRate = 300000) // 5分钟 = 300000毫秒
    public void cleanupExpiredOnlineUsers() {
        onlineUserService.cleanupExpiredUsers();
    }
} 