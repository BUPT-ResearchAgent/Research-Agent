package com.example.smartedu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "classroom_participants")
public class ClassroomParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ClassroomSession session;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "user_name", nullable = false)
    private String userName;
    
    @Column(name = "user_type", nullable = false)
    private String userType; // teacher, student
    
    @Column(name = "join_time")
    private LocalDateTime joinTime;
    
    @Column(name = "leave_time")
    private LocalDateTime leaveTime;
    
    @Column(name = "is_online")
    private Boolean isOnline = true;
    
    @Column(name = "is_muted")
    private Boolean isMuted = false;
    
    @Column(name = "is_hand_raised")
    private Boolean isHandRaised = false;
    
    @Column(name = "permission_level")
    private String permissionLevel = "participant"; // host, moderator, participant
    
    @Column(name = "last_activity")
    private LocalDateTime lastActivity;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public ClassroomParticipant() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.joinTime = LocalDateTime.now();
        this.lastActivity = LocalDateTime.now();
    }
    
    public ClassroomParticipant(ClassroomSession session, Long userId, String userName, String userType) {
        this();
        this.session = session;
        this.userId = userId;
        this.userName = userName;
        this.userType = userType;
        if ("teacher".equals(userType)) {
            this.permissionLevel = "host";
        }
    }
    
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public ClassroomSession getSession() {
        return session;
    }
    
    public void setSession(ClassroomSession session) {
        this.session = session;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    
    public String getUserType() {
        return userType;
    }
    
    public void setUserType(String userType) {
        this.userType = userType;
    }
    
    public LocalDateTime getJoinTime() {
        return joinTime;
    }
    
    public void setJoinTime(LocalDateTime joinTime) {
        this.joinTime = joinTime;
    }
    
    public LocalDateTime getLeaveTime() {
        return leaveTime;
    }
    
    public void setLeaveTime(LocalDateTime leaveTime) {
        this.leaveTime = leaveTime;
    }
    
    public Boolean getIsOnline() {
        return isOnline;
    }
    
    public void setIsOnline(Boolean isOnline) {
        this.isOnline = isOnline;
    }
    
    public Boolean getIsMuted() {
        return isMuted;
    }
    
    public void setIsMuted(Boolean isMuted) {
        this.isMuted = isMuted;
    }
    
    public Boolean getIsHandRaised() {
        return isHandRaised;
    }
    
    public void setIsHandRaised(Boolean isHandRaised) {
        this.isHandRaised = isHandRaised;
    }
    
    public String getPermissionLevel() {
        return permissionLevel;
    }
    
    public void setPermissionLevel(String permissionLevel) {
        this.permissionLevel = permissionLevel;
    }
    
    public LocalDateTime getLastActivity() {
        return lastActivity;
    }
    
    public void setLastActivity(LocalDateTime lastActivity) {
        this.lastActivity = lastActivity;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // 更新最后活动时间
    public void updateLastActivity() {
        this.lastActivity = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // 离开会话
    public void leave() {
        this.isOnline = false;
        this.leaveTime = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // 重新加入会话
    public void rejoin() {
        this.isOnline = true;
        this.leaveTime = null;
        this.lastActivity = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
} 