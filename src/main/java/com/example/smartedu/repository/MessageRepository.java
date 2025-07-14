package com.example.smartedu.repository;

import com.example.smartedu.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // 获取两个用户之间的对话记录
    @Query("SELECT m FROM Message m WHERE " +
           "((m.senderId = :userId1 AND m.senderType = :userType1 AND m.receiverId = :userId2 AND m.receiverType = :userType2) OR " +
           "(m.senderId = :userId2 AND m.senderType = :userType2 AND m.receiverId = :userId1 AND m.receiverType = :userType1)) " +
           "ORDER BY m.sentAt ASC")
    List<Message> findConversation(@Param("userId1") Long userId1, @Param("userType1") String userType1,
                                  @Param("userId2") Long userId2, @Param("userType2") String userType2);
    
    // 获取用户的所有对话列表（最新消息）
    @Query("SELECT m FROM Message m WHERE m.id IN (" +
           "SELECT MAX(m2.id) FROM Message m2 WHERE " +
           "(m2.senderId = :userId AND m2.senderType = :userType) OR " +
           "(m2.receiverId = :userId AND m2.receiverType = :userType) " +
           "GROUP BY " +
           "CASE WHEN m2.senderId = :userId AND m2.senderType = :userType " +
           "     THEN CONCAT(m2.receiverType, '_', m2.receiverId) " +
           "     ELSE CONCAT(m2.senderType, '_', m2.senderId) END" +
           ") ORDER BY m.sentAt DESC")
    List<Message> findUserConversations(@Param("userId") Long userId, @Param("userType") String userType);
    
    // 获取用户的未读消息数量
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiverId = :userId AND m.receiverType = :userType AND m.isRead = false")
    Long countUnreadMessages(@Param("userId") Long userId, @Param("userType") String userType);
    
    // 获取特定对话的未读消息数量
    @Query("SELECT COUNT(m) FROM Message m WHERE " +
           "m.receiverId = :receiverId AND m.receiverType = :receiverType AND " +
           "m.senderId = :senderId AND m.senderType = :senderType AND " +
           "m.isRead = false")
    Long countUnreadMessagesInConversation(@Param("receiverId") Long receiverId, @Param("receiverType") String receiverType,
                                          @Param("senderId") Long senderId, @Param("senderType") String senderType);
    
    // 标记对话中的所有消息为已读
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP WHERE " +
           "m.receiverId = :receiverId AND m.receiverType = :receiverType AND " +
           "m.senderId = :senderId AND m.senderType = :senderType AND " +
           "m.isRead = false")
    void markConversationAsRead(@Param("receiverId") Long receiverId, @Param("receiverType") String receiverType,
                               @Param("senderId") Long senderId, @Param("senderType") String senderType);
    
    // 获取课程内的所有消息（管理员功能）
    List<Message> findByCourseIdOrderBySentAtDesc(Long courseId);
    
    // 查找用户在特定课程中的对话伙伴
    @Query("SELECT DISTINCT " +
           "CASE WHEN m.senderId = :userId AND m.senderType = :userType " +
           "     THEN CONCAT(m.receiverType, '_', m.receiverId, '_', m.receiverName) " +
           "     ELSE CONCAT(m.senderType, '_', m.senderId, '_', m.senderName) END " +
           "FROM Message m WHERE " +
           "m.courseId = :courseId AND " +
           "((m.senderId = :userId AND m.senderType = :userType) OR " +
           "(m.receiverId = :userId AND m.receiverType = :userType))")
    List<String> findConversationPartnersInCourse(@Param("userId") Long userId, @Param("userType") String userType, 
                                                  @Param("courseId") Long courseId);
} 