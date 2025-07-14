package com.example.smartedu.config;

import com.example.smartedu.service.OnlineUserService;
import com.example.smartedu.service.ExamService;
import com.example.smartedu.service.IndustryInfoService;
import com.example.smartedu.service.ClassroomCollaborationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasks {
    
    @Autowired
    private OnlineUserService onlineUserService;
    
    @Autowired
    private ExamService examService;
    
    @Autowired
    private IndustryInfoService industryInfoService;
    
    @Autowired
    private ClassroomCollaborationService classroomCollaborationService;
    
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
    
    /**
     * 每2小时抓取一次教学产业信息
     */
    @Scheduled(fixedRate = 7200000) // 2小时 = 7200000毫秒
    public void crawlIndustryInfo() {
        try {
            industryInfoService.crawlAndProcessExternalInfo();
            System.out.println("教学产业信息抓取完成");
        } catch (Exception e) {
            System.err.println("抓取教学产业信息时发生错误: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 每6小时清理一次过期的课堂会话
     */
    @Scheduled(fixedRate = 21600000) // 6小时 = 21600000毫秒
    public void cleanupExpiredClassroomSessions() {
        try {
            classroomCollaborationService.cleanupExpiredSessions();
            System.out.println("过期课堂会话清理完成");
        } catch (Exception e) {
            System.err.println("清理过期课堂会话时发生错误: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 