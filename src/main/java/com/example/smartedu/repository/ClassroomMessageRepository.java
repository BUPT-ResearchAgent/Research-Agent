package com.example.smartedu.repository;

import com.example.smartedu.entity.ClassroomMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClassroomMessageRepository extends JpaRepository<ClassroomMessage, Long> {
    
    // 根据会话ID查找消息
    List<ClassroomMessage> findBySessionIdAndIsDeletedOrderByCreatedAtAsc(Long sessionId, Boolean isDeleted);
    
    // 根据会话ID和消息类型查找消息
    List<ClassroomMessage> findBySessionIdAndMessageTypeAndIsDeletedOrderByCreatedAtAsc(
        Long sessionId, String messageType, Boolean isDeleted);
    
    // 根据发送者ID查找消息
    List<ClassroomMessage> findBySenderIdAndIsDeletedOrderByCreatedAtDesc(Long senderId, Boolean isDeleted);
    
    // 根据会话ID查找最新的n条消息
    @Query("SELECT m FROM ClassroomMessage m WHERE m.session.id = :sessionId AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<ClassroomMessage> findLatestMessagesBySessionId(@Param("sessionId") Long sessionId);
    
    // 根据时间范围查找消息
    List<ClassroomMessage> findBySessionIdAndCreatedAtBetweenAndIsDeletedOrderByCreatedAtAsc(
        Long sessionId, LocalDateTime start, LocalDateTime end, Boolean isDeleted);
    
    // 查找回复某条消息的所有消息
    List<ClassroomMessage> findByReplyToIdAndIsDeletedOrderByCreatedAtAsc(Long replyToId, Boolean isDeleted);
    
    // 查找系统消息
    List<ClassroomMessage> findBySessionIdAndIsSystemMessageAndIsDeletedOrderByCreatedAtAsc(
        Long sessionId, Boolean isSystemMessage, Boolean isDeleted);
    
    // 统计会话中的消息数量
    Long countBySessionIdAndIsDeleted(Long sessionId, Boolean isDeleted);
    
    // 统计发送者的消息数量
    Long countBySenderIdAndIsDeleted(Long senderId, Boolean isDeleted);
    
    // 查找包含特定内容的消息
    @Query("SELECT m FROM ClassroomMessage m WHERE m.session.id = :sessionId AND " +
           "m.content LIKE %:content% AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<ClassroomMessage> findBySessionIdAndContentContaining(@Param("sessionId") Long sessionId, 
                                                                @Param("content") String content);
} 