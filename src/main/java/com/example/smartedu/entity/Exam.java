package com.example.smartedu.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "exams")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Exam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    private String description;
    
    @Column(nullable = false)
    private String chapter; // 章节
    
    @Column(nullable = false)
    private String examType; // 考试类型
    
    @Column(nullable = false)
    private Integer duration; // 考试时长（分钟）
    
    @Column(name = "total_score")
    private Integer totalScore; // 总分
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "is_published")
    private Boolean isPublished = false;
    
    @Column(name = "is_answer_published")
    private Boolean isAnswerPublished = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "exams"})
    private Course course;
    
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Question> questions;
    
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<ExamResult> results;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public Exam() {
        this.createdAt = LocalDateTime.now();
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
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getChapter() {
        return chapter;
    }
    
    public void setChapter(String chapter) {
        this.chapter = chapter;
    }
    
    public String getExamType() {
        return examType;
    }
    
    public void setExamType(String examType) {
        this.examType = examType;
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
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    public Boolean getIsPublished() {
        return isPublished;
    }
    
    public void setIsPublished(Boolean isPublished) {
        this.isPublished = isPublished;
    }
    
    public Boolean getIsAnswerPublished() {
        return isAnswerPublished;
    }
    
    public void setIsAnswerPublished(Boolean isAnswerPublished) {
        this.isAnswerPublished = isAnswerPublished;
    }
    
    public Course getCourse() {
        return course;
    }
    
    public void setCourse(Course course) {
        this.course = course;
    }
    
    public void setCourseId(Long courseId) {
        if (this.course == null) {
            this.course = new Course();
        }
        this.course.setId(courseId);
    }
    
    public Integer getTotalScore() {
        return totalScore;
    }
    
    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }
    
    public List<Question> getQuestions() {
        return questions;
    }
    
    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }
    
    public List<ExamResult> getResults() {
        return results;
    }
    
    public void setResults(List<ExamResult> results) {
        this.results = results;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 