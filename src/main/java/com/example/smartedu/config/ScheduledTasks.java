package com.example.smartedu.config;

import com.example.smartedu.service.OnlineUserService;
import com.example.smartedu.service.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasks {
    
    @Autowired
    private OnlineUserService onlineUserService;
    
    @Autowired
    private ExamService examService;
    
    /**
     * 每5分钟清理一次过期的在线用户
     */
    @Scheduled(fixedRate = 300000) // 5分钟 = 300000毫秒
    public void cleanupExpiredOnlineUsers() {
        onlineUserService.cleanupExpiredUsers();
    }
    
    /**
     * 每分钟检查一次定时发布的试卷
     */
    @Scheduled(fixedRate = 60000) // 1分钟 = 60000毫秒
    public void processScheduledExamPublish() {
        try {
            examService.processScheduledPublish();
        } catch (Exception e) {
            System.err.println("处理定时发布试卷时发生错误: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 