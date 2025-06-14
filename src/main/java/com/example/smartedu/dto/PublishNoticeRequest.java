package com.example.smartedu.dto;

import java.time.LocalDateTime;

public class PublishNoticeRequest {
    private String title;
    private String content;
    private String targetType = "COURSE"; // 固定为COURSE
    private Long courseId; // 必填
    private String priority = "NORMAL"; // NORMAL, IMPORTANT, URGENT
    private String pushTime = "now"; // now, scheduled
    private LocalDateTime scheduledTime; // 当pushTime为scheduled时必填
    
    // 构造函数
    public PublishNoticeRequest() {}
    
    // Getter和Setter方法
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getTargetType() {
        return targetType;
    }
    
    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }
    
    public Long getCourseId() {
        return courseId;
    }
    
    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public String getPushTime() {
        return pushTime;
    }
    
    public void setPushTime(String pushTime) {
        this.pushTime = pushTime;
    }
    
    public LocalDateTime getScheduledTime() {
        return scheduledTime;
    }
    
    public void setScheduledTime(LocalDateTime scheduledTime) {
        this.scheduledTime = scheduledTime;
    }
} 