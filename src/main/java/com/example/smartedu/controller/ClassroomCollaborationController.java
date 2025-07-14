package com.example.smartedu.controller;

import com.example.smartedu.entity.ClassroomSession;
import com.example.smartedu.entity.ClassroomMessage;
import com.example.smartedu.entity.ClassroomParticipant;
import com.example.smartedu.service.ClassroomCollaborationService;
import com.example.smartedu.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/classroom")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ClassroomCollaborationController {
    
    @Autowired
    private ClassroomCollaborationService collaborationService;
    
    // ========== 会话管理 ==========
    
    // 创建新会话
    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<ClassroomSession>> createSession(@RequestBody Map<String, Object> request) {
        try {
            Long teacherId = Long.valueOf(request.get("teacherId").toString());
            Long courseId = Long.valueOf(request.get("courseId").toString());
            String sessionName = request.get("sessionName").toString();
            String sessionType = request.get("sessionType").toString();
            String description = request.getOrDefault("description", "").toString();
            
            ClassroomSession session = collaborationService.createSession(teacherId, courseId, sessionName, sessionType, description);
            return ResponseEntity.ok(new ApiResponse<>(true, "会话创建成功", session));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "创建失败: " + e.getMessage(), null));
        }
    }
    
    // 获取教师的会话列表
    @GetMapping("/sessions/teacher/{teacherId}")
    public ResponseEntity<ApiResponse<List<ClassroomSession>>> getTeacherSessions(
            @PathVariable Long teacherId, 
            @RequestParam(defaultValue = "true") Boolean isActive) {
        try {
            List<ClassroomSession> sessions = collaborationService.getTeacherSessions(teacherId, isActive);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", sessions));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 根据会话代码查找会话
    @GetMapping("/sessions/code/{sessionCode}")
    public ResponseEntity<ApiResponse<ClassroomSession>> findSessionByCode(@PathVariable String sessionCode) {
        try {
            Optional<ClassroomSession> sessionOpt = collaborationService.findSessionByCode(sessionCode);
            if (sessionOpt.isPresent()) {
                return ResponseEntity.ok(new ApiResponse<>(true, "会话找到", sessionOpt.get()));
            } else {
                return ResponseEntity.ok(new ApiResponse<>(false, "会话不存在", null));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "查找失败: " + e.getMessage(), null));
        }
    }
    
    // 获取会话详情
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<ClassroomSession>> getSessionDetails(@PathVariable Long sessionId) {
        try {
            Optional<ClassroomSession> sessionOpt = collaborationService.getSessionDetails(sessionId);
            if (sessionOpt.isPresent()) {
                return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", sessionOpt.get()));
            } else {
                return ResponseEntity.ok(new ApiResponse<>(false, "会话不存在", null));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 结束会话
    @PutMapping("/sessions/{sessionId}/end")
    public ResponseEntity<ApiResponse<String>> endSession(@PathVariable Long sessionId, @RequestBody Map<String, Object> request) {
        try {
            Long teacherId = Long.valueOf(request.get("teacherId").toString());
            collaborationService.endSession(sessionId, teacherId);
            return ResponseEntity.ok(new ApiResponse<>(true, "会话已结束", "success"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "结束失败: " + e.getMessage(), null));
        }
    }
    
    // ========== 参与者管理 ==========
    
    // 加入会话
    @PostMapping("/sessions/{sessionId}/join")
    public ResponseEntity<ApiResponse<ClassroomParticipant>> joinSession(
            @PathVariable Long sessionId, 
            @RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String userName = request.get("userName").toString();
            String userType = request.get("userType").toString();
            
            ClassroomParticipant participant = collaborationService.joinSession(sessionId, userId, userName, userType);
            return ResponseEntity.ok(new ApiResponse<>(true, "加入成功", participant));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "加入失败: " + e.getMessage(), null));
        }
    }
    
    // 离开会话
    @PostMapping("/sessions/{sessionId}/leave")
    public ResponseEntity<ApiResponse<String>> leaveSession(
            @PathVariable Long sessionId, 
            @RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            collaborationService.leaveSession(sessionId, userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "已离开会话", "success"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "离开失败: " + e.getMessage(), null));
        }
    }
    
    // 获取会话参与者列表
    @GetMapping("/sessions/{sessionId}/participants")
    public ResponseEntity<ApiResponse<List<ClassroomParticipant>>> getSessionParticipants(@PathVariable Long sessionId) {
        try {
            List<ClassroomParticipant> participants = collaborationService.getSessionParticipants(sessionId);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", participants));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 举手/取消举手
    @PostMapping("/sessions/{sessionId}/hand-raise")
    public ResponseEntity<ApiResponse<String>> toggleHandRaise(
            @PathVariable Long sessionId, 
            @RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            collaborationService.toggleHandRaise(sessionId, userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "操作成功", "success"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "操作失败: " + e.getMessage(), null));
        }
    }
    
    // 静音/取消静音
    @PostMapping("/sessions/{sessionId}/mute")
    public ResponseEntity<ApiResponse<String>> toggleMute(
            @PathVariable Long sessionId, 
            @RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long operatorId = Long.valueOf(request.get("operatorId").toString());
            collaborationService.toggleMute(sessionId, userId, operatorId);
            return ResponseEntity.ok(new ApiResponse<>(true, "操作成功", "success"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "操作失败: " + e.getMessage(), null));
        }
    }
    
    // ========== 消息管理 ==========
    
    // 发送消息
    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ApiResponse<ClassroomMessage>> sendMessage(
            @PathVariable Long sessionId, 
            @RequestBody Map<String, Object> request) {
        try {
            Long senderId = Long.valueOf(request.get("senderId").toString());
            String senderName = request.get("senderName").toString();
            String senderType = request.get("senderType").toString();
            String messageType = request.getOrDefault("messageType", "text").toString();
            String content = request.get("content").toString();
            String fileUrl = request.getOrDefault("fileUrl", "").toString();
            String fileName = request.getOrDefault("fileName", "").toString();
            
            ClassroomMessage message = collaborationService.sendMessage(sessionId, senderId, senderName, senderType, messageType, content, fileUrl, fileName);
            return ResponseEntity.ok(new ApiResponse<>(true, "消息发送成功", message));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "发送失败: " + e.getMessage(), null));
        }
    }
    
    // 获取会话消息列表
    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ApiResponse<List<ClassroomMessage>>> getSessionMessages(@PathVariable Long sessionId) {
        try {
            List<ClassroomMessage> messages = collaborationService.getSessionMessages(sessionId);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", messages));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 删除消息
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<String>> deleteMessage(
            @PathVariable Long messageId, 
            @RequestBody Map<String, Object> request) {
        try {
            Long operatorId = Long.valueOf(request.get("operatorId").toString());
            collaborationService.deleteMessage(messageId, operatorId);
            return ResponseEntity.ok(new ApiResponse<>(true, "消息已删除", "success"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "删除失败: " + e.getMessage(), null));
        }
    }
    
    // ========== 统计信息 ==========
    
    // 获取会话统计信息
    @GetMapping("/sessions/{sessionId}/stats")
    public ResponseEntity<ApiResponse<ClassroomCollaborationService.SessionStats>> getSessionStats(@PathVariable Long sessionId) {
        try {
            ClassroomCollaborationService.SessionStats stats = collaborationService.getSessionStats(sessionId);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", stats));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
} 