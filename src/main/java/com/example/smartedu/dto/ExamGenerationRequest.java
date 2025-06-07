package com.example.smartedu.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ExamGenerationRequest {
    private Long courseId;
    private String title;
    private String chapter;
    private List<String> questionTypes; // 题目类型列表
    private Integer duration; // 考试时长（分钟）
    private LocalDateTime startTime;
    private String classId; // 测评班级
    
    public ExamGenerationRequest() {}
    
    // Getter和Setter方法
    public Long getCourseId() {
        return courseId;
    }
    
    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getChapter() {
        return chapter;
    }
    
    public void setChapter(String chapter) {
        this.chapter = chapter;
    }
    
    public List<String> getQuestionTypes() {
        return questionTypes;
    }
    
    public void setQuestionTypes(List<String> questionTypes) {
        this.questionTypes = questionTypes;
    }
    
    public Integer getDuration() {
        return duration;
    }
    
    public void setDuration(Integer duration) {
        this.duration = duration;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public String getClassId() {
        return classId;
    }
    
    public void setClassId(String classId) {
        this.classId = classId;
    }
} 