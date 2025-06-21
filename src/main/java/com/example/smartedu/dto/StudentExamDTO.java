package com.example.smartedu.dto;

import com.example.smartedu.entity.Exam;
import com.example.smartedu.entity.Question;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 学生端考试信息DTO
 */
public class StudentExamDTO {
    private Long id;
    private String title;
    private String description;
    private String chapter;
    private String examType;
    private Integer duration; // 考试时长（分钟）
    private Integer totalScore;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean isPublished;
    private Boolean isAnswerPublished;
    private LocalDateTime publishedAt;
    private String courseName;
    private Long courseId;
    private List<StudentQuestionDTO> questions;
    private String examStatus; // UPCOMING, ONGOING, FINISHED, EXPIRED
    private Boolean canTakeExam; // 是否可以参加考试
    private Boolean hasSubmitted; // 是否已提交
    private Integer remainingMinutes; // 剩余时间（分钟）
    private Integer totalQuestions; // 总题数
    
    public StudentExamDTO() {}
    
    public StudentExamDTO(Exam exam) {
        this.id = exam.getId();
        this.title = exam.getTitle();
        this.description = exam.getDescription();
        this.chapter = exam.getChapter();
        this.examType = exam.getExamType();
        this.duration = exam.getDuration();
        this.totalScore = exam.getTotalScore();
        this.startTime = exam.getStartTime();
        this.endTime = exam.getEndTime();
        this.isPublished = exam.getIsPublished();
        this.isAnswerPublished = exam.getIsAnswerPublished();
        this.publishedAt = exam.getPublishedAt();
        
        if (exam.getCourse() != null) {
            this.courseName = exam.getCourse().getName();
            this.courseId = exam.getCourse().getId();
        }
        
        // 计算考试状态
        this.examStatus = calculateExamStatus();
        this.canTakeExam = calculateCanTakeExam();
        
        // 设置题目数量
        if (exam.getQuestions() != null) {
            this.totalQuestions = exam.getQuestions().size();
        }
    }
    
    public StudentExamDTO(Exam exam, boolean includeQuestions, boolean showAnswers) {
        this(exam);
        
        if (includeQuestions && exam.getQuestions() != null) {
            this.questions = exam.getQuestions().stream()
                    .map(q -> new StudentQuestionDTO(q, showAnswers))
                    .collect(Collectors.toList());
        }
    }
    
    private String calculateExamStatus() {
        LocalDateTime now = LocalDateTime.now();
        
        if (!isPublished) {
            return "UNPUBLISHED";
        }
        
        // 如果有明确的开始时间和结束时间
        if (startTime != null && endTime != null) {
            if (now.isBefore(startTime)) {
                return "UPCOMING";
            } else if (now.isAfter(endTime)) {
                return "EXPIRED";
            } else {
                return "ONGOING";
            }
        }
        
        // 如果只有开始时间，没有结束时间
        if (startTime != null && endTime == null) {
            if (now.isBefore(startTime)) {
                return "UPCOMING";
            } else {
                // 考试已开始但没有明确结束时间，认为正在进行
                return "ONGOING";
            }
        }
        
        // 如果只有结束时间，没有开始时间
        if (startTime == null && endTime != null) {
            if (now.isAfter(endTime)) {
                return "EXPIRED";
            } else {
                // 还没到结束时间，认为正在进行
                return "ONGOING";
            }
        }
        
        // 如果都没有设置时间，但已发布，认为正在进行
        if (startTime == null && endTime == null) {
            return "ONGOING";
        }
        
        return "ONGOING";
    }
    
    private Boolean calculateCanTakeExam() {
        return isPublished && "ONGOING".equals(calculateExamStatus());
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getChapter() { return chapter; }
    public void setChapter(String chapter) { this.chapter = chapter; }
    
    public String getExamType() { return examType; }
    public void setExamType(String examType) { this.examType = examType; }
    
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    
    public Integer getTotalScore() { return totalScore; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    
    public Boolean getIsPublished() { return isPublished; }
    public void setIsPublished(Boolean isPublished) { this.isPublished = isPublished; }
    
    public Boolean getIsAnswerPublished() { return isAnswerPublished; }
    public void setIsAnswerPublished(Boolean isAnswerPublished) { this.isAnswerPublished = isAnswerPublished; }
    
    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
    
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    
    public List<StudentQuestionDTO> getQuestions() { return questions; }
    public void setQuestions(List<StudentQuestionDTO> questions) { this.questions = questions; }
    
    public String getExamStatus() { return examStatus; }
    public void setExamStatus(String examStatus) { this.examStatus = examStatus; }
    
    public Boolean getCanTakeExam() { return canTakeExam; }
    public void setCanTakeExam(Boolean canTakeExam) { this.canTakeExam = canTakeExam; }
    
    public Boolean getHasSubmitted() { return hasSubmitted; }
    public void setHasSubmitted(Boolean hasSubmitted) { this.hasSubmitted = hasSubmitted; }
    
    public Integer getRemainingMinutes() { return remainingMinutes; }
    public void setRemainingMinutes(Integer remainingMinutes) { this.remainingMinutes = remainingMinutes; }
    
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
} 