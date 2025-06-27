package com.example.smartedu.dto;

import com.example.smartedu.entity.Exam;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ExamListDTO {
    private Long id;
    private String title;
    private String courseName;
    private Integer questionCount;
    private Integer duration;
    private String status;
    private Long participantCount;
    private String publishTime;
    private String examType;
    private Integer totalScore;
    private LocalDateTime createdAt;
    private Boolean isPublished;
    
    public ExamListDTO() {}
    
    public ExamListDTO(Exam exam) {
        this.id = exam.getId();
        this.title = exam.getTitle();
        this.courseName = exam.getCourse() != null ? exam.getCourse().getName() : "未知课程";
        this.questionCount = exam.getQuestions() != null ? exam.getQuestions().size() : 0;
        this.duration = exam.getDuration();
        this.examType = exam.getExamType();
        this.totalScore = exam.getTotalScore();
        this.createdAt = exam.getCreatedAt();
        this.isPublished = exam.getIsPublished();
        
        // 设置状态
        if (exam.getIsPublished() == null || !exam.getIsPublished()) {
            this.status = "DRAFT";
        } else if (exam.getStartTime() != null && exam.getEndTime() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (now.isBefore(exam.getStartTime())) {
                this.status = "PUBLISHED";
            } else if (now.isAfter(exam.getEndTime())) {
                this.status = "FINISHED";
            } else {
                this.status = "ONGOING";
            }
        } else {
            this.status = "PUBLISHED";
        }
        
        // 格式化发布时间
        if (exam.getIsPublished() != null && exam.getIsPublished() && exam.getPublishedAt() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            this.publishTime = exam.getPublishedAt().format(formatter);
        } else {
            this.publishTime = "未发布";
        }
        
        // 参与人数默认为0，在Service层中会设置实际值
        this.participantCount = 0L;
    }
    
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getCourseName() {
        return courseName;
    }
    
    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }
    
    public Integer getQuestionCount() {
        return questionCount;
    }
    
    public void setQuestionCount(Integer questionCount) {
        this.questionCount = questionCount;
    }
    
    public Integer getDuration() {
        return duration;
    }
    
    public void setDuration(Integer duration) {
        this.duration = duration;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Long getParticipantCount() {
        return participantCount;
    }
    
    public void setParticipantCount(Long participantCount) {
        this.participantCount = participantCount;
    }
    
    public String getPublishTime() {
        return publishTime;
    }
    
    public void setPublishTime(String publishTime) {
        this.publishTime = publishTime;
    }
    
    public String getExamType() {
        return examType;
    }
    
    public void setExamType(String examType) {
        this.examType = examType;
    }
    
    public Integer getTotalScore() {
        return totalScore;
    }
    
    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Boolean getIsPublished() {
        return isPublished;
    }
    
    public void setIsPublished(Boolean isPublished) {
        this.isPublished = isPublished;
    }
} 