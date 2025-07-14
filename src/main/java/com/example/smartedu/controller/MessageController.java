package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.Message;
import com.example.smartedu.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    /**
     * 发送消息
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Message>> sendMessage(@RequestBody Map<String, Object> request) {
        try {
            Long senderId = Long.valueOf(request.get("senderId").toString());
            String senderType = (String) request.get("senderType");
            Long receiverId = Long.valueOf(request.get("receiverId").toString());
            String receiverType = (String) request.get("receiverType");
            String content = (String) request.get("content");
            Long courseId = request.get("courseId") != null ? 
                    Long.valueOf(request.get("courseId").toString()) : null;
            
            System.out.println("收到发送消息请求:");
            System.out.println("  发送者: " + senderId + " (" + senderType + ")");
            System.out.println("  接收者: " + receiverId + " (" + receiverType + ")");
            System.out.println("  内容: " + content);
            System.out.println("  课程ID: " + courseId);
            
            Message message = messageService.sendMessage(
                senderId, senderType, receiverId, receiverType, courseId, content);
            
            System.out.println("消息发送成功，消息ID: " + message.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "消息发送成功", message));
        } catch (Exception e) {
            System.err.println("发送消息失败: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ApiResponse<>(false, "发送失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 获取对话记录
     */
    @GetMapping("/conversation")
    public ResponseEntity<ApiResponse<List<Message>>> getConversation(
            @RequestParam Long userId1,
            @RequestParam String userType1,
            @RequestParam Long userId2,
            @RequestParam String userType2) {
        try {
            List<Message> messages = messageService.getConversation(userId1, userType1, userId2, userType2);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", messages));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 获取用户的对话列表
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserConversations(
            @RequestParam Long userId,
            @RequestParam String userType) {
        try {
            List<Map<String, Object>> conversations = messageService.getUserConversations(userId, userType);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", conversations));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 获取未读消息数量
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadMessageCount(
            @RequestParam Long userId,
            @RequestParam String userType) {
        try {
            Long count = messageService.getUnreadMessageCount(userId, userType);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", count));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), 0L));
        }
    }
    
    /**
     * 标记对话为已读
     */
    @PostMapping("/mark-read")
    public ResponseEntity<ApiResponse<String>> markConversationAsRead(@RequestBody Map<String, Object> request) {
        try {
            Long receiverId = Long.valueOf(request.get("receiverId").toString());
            String receiverType = (String) request.get("receiverType");
            Long senderId = Long.valueOf(request.get("senderId").toString());
            String senderType = (String) request.get("senderType");
            
            System.out.println("标记已读请求:");
            System.out.println("  接收者: " + receiverId + " (" + receiverType + ")");
            System.out.println("  发送者: " + senderId + " (" + senderType + ")");
            
            messageService.markConversationAsRead(receiverId, receiverType, senderId, senderType);
            return ResponseEntity.ok(new ApiResponse<>(true, "标记成功", "对话已标记为已读"));
        } catch (Exception e) {
            System.err.println("标记已读失败: " + e.getMessage());
            return ResponseEntity.ok(new ApiResponse<>(false, "标记失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 获取课程中可以聊天的用户列表
     */
    @GetMapping("/course/{courseId}/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getChatableUsers(
            @PathVariable Long courseId,
            @RequestParam Long userId,
            @RequestParam String userType) {
        try {
            List<Map<String, Object>> users = messageService.getChatableUsers(userId, userType, courseId);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", users));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 获取用户的课程列表
     */
    @GetMapping("/user-courses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserCourses(
            @RequestParam Long userId,
            @RequestParam String userType) {
        try {
            List<Map<String, Object>> courses = messageService.getUserCourses(userId, userType);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", courses));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
} 