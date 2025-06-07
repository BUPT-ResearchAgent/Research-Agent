package com.example.smartedu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results")
public class ExamResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    
    @Column(name = "student_name")
    private String studentName;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;
    
    private Integer score; // 得分
    
    private Integer totalScore; // 总分
    
    @Column(name = "submit_time")
    private LocalDateTime submitTime;
    
    @Column(name = "is_corrected")
    private Boolean isCorrected = false; // 是否已批改
    
    @Column(name = "grade_status")
    private String gradeStatus = "PENDING"; // 批改状态：PENDING待批改, AI_GRADED AI已批改, MANUAL_GRADED 人工已批改
    
    @Column(name = "final_score")
    private Double finalScore; // 最终得分
    
    @Column(name = "ai_score")
    private Double aiScore; // AI评分
    
    public ExamResult() {}
    
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getStudentId() {
        return studentId;
    }
    
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
    
    public String getStudentName() {
        return studentName;
    }
    
    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }
    
    public Exam getExam() {
        return exam;
    }
    
    public void setExam(Exam exam) {
        this.exam = exam;
    }
    
    public Integer getScore() {
        return score;
    }
    
    public void setScore(Integer score) {
        this.score = score;
    }
    
    public Integer getTotalScore() {
        return totalScore;
    }
    
    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }
    
    public LocalDateTime getSubmitTime() {
        return submitTime;
    }
    
    public void setSubmitTime(LocalDateTime submitTime) {
        this.submitTime = submitTime;
    }
    
    public Boolean getIsCorrected() {
        return isCorrected;
    }
    
    public void setIsCorrected(Boolean isCorrected) {
        this.isCorrected = isCorrected;
    }
    
    public String getGradeStatus() {
        return gradeStatus;
    }
    
    public void setGradeStatus(String gradeStatus) {
        this.gradeStatus = gradeStatus;
    }
    
    public Double getFinalScore() {
        return finalScore;
    }
    
    public void setFinalScore(Double finalScore) {
        this.finalScore = finalScore;
    }
    
    public Double getAiScore() {
        return aiScore;
    }
    
    public void setAiScore(Double aiScore) {
        this.aiScore = aiScore;
    }
} 