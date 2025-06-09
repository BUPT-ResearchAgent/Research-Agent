package com.example.smartedu.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ExamGenerationRequest {
    private Long courseId;
    private List<Long> materialIds; // 选中的资料ID列表
    private String title;
    private String chapter;
    private Object questionTypes; // 题目类型配置（可以是Map或List）
    private Object difficulty; // 难度配置
    private Integer duration; // 考试时长（分钟）
    private Integer totalScore; // 总分
    private String specialRequirements; // 特殊要求（可选）
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
    
    public List<Long> getMaterialIds() {
        return materialIds;
    }
    
    public void setMaterialIds(List<Long> materialIds) {
        this.materialIds = materialIds;
    }
    
    public Object getQuestionTypes() {
        return questionTypes;
    }
    
    public void setQuestionTypes(Object questionTypes) {
        this.questionTypes = questionTypes;
    }
    
    public Object getDifficulty() {
        return difficulty;
    }
    
    public void setDifficulty(Object difficulty) {
        this.difficulty = difficulty;
    }
    
    public Integer getTotalScore() {
        return totalScore;
    }
    
    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
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
    
    public String getSpecialRequirements() {
        return specialRequirements;
    }
    
    public void setSpecialRequirements(String specialRequirements) {
        this.specialRequirements = specialRequirements;
    }
} 