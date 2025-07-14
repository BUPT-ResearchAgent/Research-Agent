package com.example.smartedu.repository;

import com.example.smartedu.entity.ClassroomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomParticipantRepository extends JpaRepository<ClassroomParticipant, Long> {
    
    // 根据会话ID查找参与者
    List<ClassroomParticipant> findBySessionIdOrderByJoinTimeAsc(Long sessionId);
    
    // 根据会话ID查找在线参与者
    List<ClassroomParticipant> findBySessionIdAndIsOnlineOrderByJoinTimeAsc(Long sessionId, Boolean isOnline);
    
    // 根据会话ID和用户ID查找参与者
    Optional<ClassroomParticipant> findBySessionIdAndUserId(Long sessionId, Long userId);
    
    // 根据用户ID查找参与的会话
    List<ClassroomParticipant> findByUserIdOrderByJoinTimeDesc(Long userId);
    
    // 根据会话ID和用户类型查找参与者
    List<ClassroomParticipant> findBySessionIdAndUserTypeOrderByJoinTimeAsc(Long sessionId, String userType);
    
    // 根据会话ID查找举手的参与者
    List<ClassroomParticipant> findBySessionIdAndIsHandRaisedOrderByJoinTimeAsc(Long sessionId, Boolean isHandRaised);
    
    // 根据会话ID查找被静音的参与者
    List<ClassroomParticipant> findBySessionIdAndIsMutedOrderByJoinTimeAsc(Long sessionId, Boolean isMuted);
    
    // 根据权限级别查找参与者
    List<ClassroomParticipant> findBySessionIdAndPermissionLevelOrderByJoinTimeAsc(Long sessionId, String permissionLevel);
    
    // 统计会话中的参与者数量
    Long countBySessionId(Long sessionId);
    
    // 统计会话中的在线参与者数量
    Long countBySessionIdAndIsOnline(Long sessionId, Boolean isOnline);
    
    // 统计用户参与的会话数量
    Long countByUserId(Long userId);
    
    // 查找长时间未活动的参与者
    List<ClassroomParticipant> findBySessionIdAndLastActivityBeforeAndIsOnline(
        Long sessionId, LocalDateTime dateTime, Boolean isOnline);
    
    // 查找指定时间范围内加入的参与者
    List<ClassroomParticipant> findBySessionIdAndJoinTimeBetweenOrderByJoinTimeAsc(
        Long sessionId, LocalDateTime start, LocalDateTime end);
    
    // 删除指定会话的所有参与者
    void deleteBySessionId(Long sessionId);
} 