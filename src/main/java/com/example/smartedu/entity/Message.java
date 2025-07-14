package com.example.smartedu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    @Column(name = "sender_type", nullable = false, length = 20)
    private String senderType; // "teacher" 或 "student"
    
    @Column(name = "sender_name", nullable = false, length = 100)
    private String senderName;
    
    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;
    
    @Column(name = "receiver_type", nullable = false, length = 20)
    private String receiverType; // "teacher" 或 "student"
    
    @Column(name = "receiver_name", nullable = false, length = 100)
    private String receiverName;
    
    @Column(name = "course_id")
    private Long courseId; // 关联的课程ID，用于权限控制
    
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "message_type", length = 20, nullable = false)
    private String messageType = "text"; // "text", "image", "file"
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    // 无参构造函数
    public Message() {
        this.sentAt = LocalDateTime.now();
    }
    
    // 构造函数
    public Message(Long senderId, String senderType, String senderName, 
                   Long receiverId, String receiverType, String receiverName, 
                   Long courseId, String content) {
        this();
        this.senderId = senderId;
        this.senderType = senderType;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.receiverType = receiverType;
        this.receiverName = receiverName;
        this.courseId = courseId;
        this.content = content;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getSenderId() {
        return senderId;
    }
    
    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }
    
    public String getSenderType() {
        return senderType;
    }
    
    public void setSenderType(String senderType) {
        this.senderType = senderType;
    }
    
    public String getSenderName() {
        return senderName;
    }
    
    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }
    
    public Long getReceiverId() {
        return receiverId;
    }
    
    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }
    
    public String getReceiverType() {
        return receiverType;
    }
    
    public void setReceiverType(String receiverType) {
        this.receiverType = receiverType;
    }
    
    public String getReceiverName() {
        return receiverName;
    }
    
    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }
    
    public Long getCourseId() {
        return courseId;
    }
    
    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getMessageType() {
        return messageType;
    }
    
    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }
    
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
        if (isRead && this.readAt == null) {
            this.readAt = LocalDateTime.now();
        }
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    // 标记为已读
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
    
    // 生成对话标识符（用于分组聊天记录）
    public String getConversationId() {
        String id1 = senderType + "_" + senderId;
        String id2 = receiverType + "_" + receiverId;
        // 确保对话ID的一致性（无论发送者和接收者的顺序）
        if (id1.compareTo(id2) < 0) {
            return id1 + "__" + id2;
        } else {
            return id2 + "__" + id1;
        }
    }
} 