package com.example.smartedu.service;

import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ClassroomCollaborationService {
    
    @Autowired
    private ClassroomSessionRepository sessionRepository;
    
    @Autowired
    private ClassroomMessageRepository messageRepository;
    
    @Autowired
    private ClassroomParticipantRepository participantRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    // ========== 会话管理 ==========
    
    // 创建新的课堂会话
    public ClassroomSession createSession(Long teacherId, Long courseId, String sessionName, String sessionType, String description) {
        Optional<Teacher> teacherOpt = teacherRepository.findById(teacherId);
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        
        if (!teacherOpt.isPresent() || !courseOpt.isPresent()) {
            throw new RuntimeException("教师或课程不存在");
        }
        
        Teacher teacher = teacherOpt.get();
        Course course = courseOpt.get();
        
        // 生成唯一的会话代码
        String sessionCode = generateSessionCode();
        
        ClassroomSession session = new ClassroomSession(sessionName, sessionCode, course, teacher);
        session.setSessionType(sessionType);
        session.setDescription(description);
        
        ClassroomSession savedSession = sessionRepository.save(session);
        
        // 教师自动加入会话
        joinSession(savedSession.getId(), teacherId, teacher.getRealName(), "teacher");
        
        return savedSession;
    }
    
    // 生成会话代码
    private String generateSessionCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    // 结束会话
    public void endSession(Long sessionId, Long teacherId) {
        Optional<ClassroomSession> sessionOpt = sessionRepository.findById(sessionId);
        if (!sessionOpt.isPresent()) {
            throw new RuntimeException("会话不存在");
        }
        
        ClassroomSession session = sessionOpt.get();
        if (!session.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("只有会话创建者可以结束会话");
        }
        
        session.setIsActive(false);
        session.setEndTime(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);
        
        // 发送系统消息
        sendSystemMessage(sessionId, "会话已结束");
    }
    
    // 根据会话代码查找会话
    public Optional<ClassroomSession> findSessionByCode(String sessionCode) {
        return sessionRepository.findBySessionCode(sessionCode);
    }
    
    // 获取教师的会话列表
    public List<ClassroomSession> getTeacherSessions(Long teacherId, Boolean isActive) {
        return sessionRepository.findByTeacherIdAndIsActiveOrderByCreatedAtDesc(teacherId, isActive);
    }
    
    // 获取会话详情
    public Optional<ClassroomSession> getSessionDetails(Long sessionId) {
        return sessionRepository.findById(sessionId);
    }
    
    // ========== 参与者管理 ==========
    
    // 加入会话
    public ClassroomParticipant joinSession(Long sessionId, Long userId, String userName, String userType) {
        Optional<ClassroomSession> sessionOpt = sessionRepository.findById(sessionId);
        if (!sessionOpt.isPresent()) {
            throw new RuntimeException("会话不存在");
        }
        
        ClassroomSession session = sessionOpt.get();
        if (!session.canJoin()) {
            throw new RuntimeException("会话已满或已结束");
        }
        
        // 检查是否已经在会话中
        Optional<ClassroomParticipant> existingParticipant = 
            participantRepository.findBySessionIdAndUserId(sessionId, userId);
        
        if (existingParticipant.isPresent()) {
            ClassroomParticipant participant = existingParticipant.get();
            if (!participant.getIsOnline()) {
                // 重新加入
                participant.rejoin();
                participantRepository.save(participant);
                session.incrementParticipants();
                sessionRepository.save(session);
            }
            return participant;
        }
        
        // 创建新参与者
        ClassroomParticipant participant = new ClassroomParticipant(session, userId, userName, userType);
        ClassroomParticipant savedParticipant = participantRepository.save(participant);
        
        // 更新会话参与者数量
        session.incrementParticipants();
        sessionRepository.save(session);
        
        // 发送系统消息
        if (!"teacher".equals(userType)) {
            sendSystemMessage(sessionId, userName + " 加入了会话");
        }
        
        return savedParticipant;
    }
    
    // 离开会话
    public void leaveSession(Long sessionId, Long userId) {
        Optional<ClassroomParticipant> participantOpt = 
            participantRepository.findBySessionIdAndUserId(sessionId, userId);
        
        if (participantOpt.isPresent()) {
            ClassroomParticipant participant = participantOpt.get();
            participant.leave();
            participantRepository.save(participant);
            
            // 更新会话参与者数量
            Optional<ClassroomSession> sessionOpt = sessionRepository.findById(sessionId);
            if (sessionOpt.isPresent()) {
                ClassroomSession session = sessionOpt.get();
                session.decrementParticipants();
                sessionRepository.save(session);
                
                // 发送系统消息
                if (!"teacher".equals(participant.getUserType())) {
                    sendSystemMessage(sessionId, participant.getUserName() + " 离开了会话");
                }
            }
        }
    }
    
    // 获取会话参与者列表
    public List<ClassroomParticipant> getSessionParticipants(Long sessionId) {
        return participantRepository.findBySessionIdAndIsOnlineOrderByJoinTimeAsc(sessionId, true);
    }
    
    // 举手/取消举手
    public void toggleHandRaise(Long sessionId, Long userId) {
        Optional<ClassroomParticipant> participantOpt = 
            participantRepository.findBySessionIdAndUserId(sessionId, userId);
        
        if (participantOpt.isPresent()) {
            ClassroomParticipant participant = participantOpt.get();
            boolean newState = !participant.getIsHandRaised();
            participant.setIsHandRaised(newState);
            participant.updateLastActivity();
            participantRepository.save(participant);
            
            // 发送系统消息
            String action = newState ? "举手" : "放下手";
            sendSystemMessage(sessionId, participant.getUserName() + " " + action);
        }
    }
    
    // 静音/取消静音
    public void toggleMute(Long sessionId, Long userId, Long operatorId) {
        Optional<ClassroomParticipant> participantOpt = 
            participantRepository.findBySessionIdAndUserId(sessionId, userId);
        Optional<ClassroomParticipant> operatorOpt = 
            participantRepository.findBySessionIdAndUserId(sessionId, operatorId);
        
        if (participantOpt.isPresent() && operatorOpt.isPresent()) {
            ClassroomParticipant participant = participantOpt.get();
            ClassroomParticipant operator = operatorOpt.get();
            
            // 检查权限
            if (!"host".equals(operator.getPermissionLevel()) && !"moderator".equals(operator.getPermissionLevel())) {
                throw new RuntimeException("权限不足");
            }
            
            boolean newState = !participant.getIsMuted();
            participant.setIsMuted(newState);
            participant.updateLastActivity();
            participantRepository.save(participant);
            
            // 发送系统消息
            String action = newState ? "静音" : "取消静音";
            sendSystemMessage(sessionId, operator.getUserName() + " " + action + " 了 " + participant.getUserName());
        }
    }
    
    // ========== 消息管理 ==========
    
    // 发送消息
    public ClassroomMessage sendMessage(Long sessionId, Long senderId, String senderName, String senderType, 
                                       String messageType, String content, String fileUrl, String fileName) {
        Optional<ClassroomSession> sessionOpt = sessionRepository.findById(sessionId);
        if (!sessionOpt.isPresent()) {
            throw new RuntimeException("会话不存在");
        }
        
        ClassroomSession session = sessionOpt.get();
        if (!session.getIsActive()) {
            throw new RuntimeException("会话已结束");
        }
        
        ClassroomMessage message = new ClassroomMessage(session, senderId, senderName, senderType, messageType, content);
        message.setFileUrl(fileUrl);
        message.setFileName(fileName);
        
        ClassroomMessage savedMessage = messageRepository.save(message);
        
        // 更新参与者活动时间
        Optional<ClassroomParticipant> participantOpt = 
            participantRepository.findBySessionIdAndUserId(sessionId, senderId);
        if (participantOpt.isPresent()) {
            ClassroomParticipant participant = participantOpt.get();
            participant.updateLastActivity();
            participantRepository.save(participant);
        }
        
        return savedMessage;
    }
    
    // 发送系统消息
    public ClassroomMessage sendSystemMessage(Long sessionId, String content) {
        Optional<ClassroomSession> sessionOpt = sessionRepository.findById(sessionId);
        if (!sessionOpt.isPresent()) {
            throw new RuntimeException("会话不存在");
        }
        
        ClassroomSession session = sessionOpt.get();
        ClassroomMessage message = new ClassroomMessage(session, 0L, "系统", "system", "text", content);
        message.setIsSystemMessage(true);
        
        return messageRepository.save(message);
    }
    
    // 获取会话消息列表
    public List<ClassroomMessage> getSessionMessages(Long sessionId) {
        return messageRepository.findBySessionIdAndIsDeletedOrderByCreatedAtAsc(sessionId, false);
    }
    
    // 删除消息
    public void deleteMessage(Long messageId, Long operatorId) {
        Optional<ClassroomMessage> messageOpt = messageRepository.findById(messageId);
        if (!messageOpt.isPresent()) {
            throw new RuntimeException("消息不存在");
        }
        
        ClassroomMessage message = messageOpt.get();
        Long sessionId = message.getSession().getId();
        
        // 检查权限：只有消息发送者或主持人可以删除
        Optional<ClassroomParticipant> operatorOpt = 
            participantRepository.findBySessionIdAndUserId(sessionId, operatorId);
        
        if (operatorOpt.isPresent()) {
            ClassroomParticipant operator = operatorOpt.get();
            boolean canDelete = message.getSenderId().equals(operatorId) || 
                              "host".equals(operator.getPermissionLevel()) || 
                              "moderator".equals(operator.getPermissionLevel());
            
            if (canDelete) {
                message.setIsDeleted(true);
                message.setUpdatedAt(LocalDateTime.now());
                messageRepository.save(message);
            } else {
                throw new RuntimeException("权限不足");
            }
        }
    }
    
    // ========== 统计信息 ==========
    
    // 获取会话统计信息
    public SessionStats getSessionStats(Long sessionId) {
        SessionStats stats = new SessionStats();
        stats.setSessionId(sessionId);
        stats.setParticipantCount(participantRepository.countBySessionIdAndIsOnline(sessionId, true));
        stats.setMessageCount(messageRepository.countBySessionIdAndIsDeleted(sessionId, false));
        stats.setHandRaisedCount((long) participantRepository.findBySessionIdAndIsHandRaisedOrderByJoinTimeAsc(sessionId, true).size());
        return stats;
    }
    
    // 清理过期会话
    public void cleanupExpiredSessions() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
        List<ClassroomSession> expiredSessions = 
            sessionRepository.findByUpdatedAtBeforeAndIsActive(cutoffTime, true);
        
        for (ClassroomSession session : expiredSessions) {
            session.setIsActive(false);
            session.setEndTime(LocalDateTime.now());
            sessionRepository.save(session);
        }
    }
    
    // 内部统计类
    public static class SessionStats {
        private Long sessionId;
        private Long participantCount;
        private Long messageCount;
        private Long handRaisedCount;
        
        // Getter和Setter方法
        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        
        public Long getParticipantCount() { return participantCount; }
        public void setParticipantCount(Long participantCount) { this.participantCount = participantCount; }
        
        public Long getMessageCount() { return messageCount; }
        public void setMessageCount(Long messageCount) { this.messageCount = messageCount; }
        
        public Long getHandRaisedCount() { return handRaisedCount; }
        public void setHandRaisedCount(Long handRaisedCount) { this.handRaisedCount = handRaisedCount; }
    }
} 