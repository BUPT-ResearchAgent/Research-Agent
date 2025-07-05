package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.Notice;
import com.example.smartedu.repository.NoticeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.*;

@RestController
@RequestMapping("/api/notices")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class NoticeController {
    
    @Autowired
    private NoticeRepository noticeRepository;
    
    /**
     * 获取系统通知（教师端使用）
     */
    @GetMapping("/system")
    public ApiResponse<List<Map<String, Object>>> getSystemNotices(HttpSession session) {
        try {
            // 验证用户权限
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role) && !"student".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 根据用户角色获取适当的通知
            List<Notice> systemNotices = new ArrayList<>();
            
            if ("teacher".equals(role)) {
                // 教师可以看到全体通知和教师通知
                List<Notice> allNotices = noticeRepository.findByTargetTypeOrderByCreatedAtDesc("ALL");
                List<Notice> teacherNotices = noticeRepository.findByTargetTypeOrderByCreatedAtDesc("TEACHER");
                systemNotices.addAll(allNotices);
                systemNotices.addAll(teacherNotices);
            } else if ("student".equals(role)) {
                // 学生可以看到全体通知和学生通知
                List<Notice> allNotices = noticeRepository.findByTargetTypeOrderByCreatedAtDesc("ALL");
                List<Notice> studentNotices = noticeRepository.findByTargetTypeOrderByCreatedAtDesc("STUDENT");
                systemNotices.addAll(allNotices);
                systemNotices.addAll(studentNotices);
            }
            
            // 按创建时间倒序排序
            systemNotices.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            
            // 构建返回数据
            List<Map<String, Object>> result = new ArrayList<>();
            for (Notice notice : systemNotices) {
                Map<String, Object> noticeData = new HashMap<>();
                noticeData.put("id", notice.getId());
                noticeData.put("title", notice.getTitle());
                noticeData.put("content", notice.getContent());
                noticeData.put("targetType", notice.getTargetType());
                noticeData.put("pushTime", notice.getPushTime());
                noticeData.put("scheduledTime", notice.getScheduledTime());
                noticeData.put("status", notice.getStatus());
                noticeData.put("createdAt", notice.getCreatedAt());
                noticeData.put("updatedAt", notice.getUpdatedAt());
                
                result.add(noticeData);
            }
            
            System.out.println("📢 " + role + "获取系统通知: " + result.size() + " 条");
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            System.err.println("❌ 获取系统通知失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("获取系统通知失败：" + e.getMessage());
        }
    }
} 