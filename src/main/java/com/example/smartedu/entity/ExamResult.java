package com.example.smartedu.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results")
public class ExamResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnore
    private Student student;
    
    @Column(name = "student_id", insertable = false, updatable = false)
    private Long studentId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    @JsonIgnore
    private Exam exam;
    
    @Column(name = "exam_id", insertable = false, updatable = false)
    private Long examId;
    
    private Integer score; // 得分
    
    private Integer totalScore; // 总分
    
    @Column(name = "submit_time")
    private LocalDateTime submitTime;
    
    @Column(name = "start_time")
    private LocalDateTime startTime; // 开始答题时间
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes; // 实际用时（分钟）
    
    @Column(name = "is_corrected")
    private Boolean isCorrected = false; // 是否已批改
    
    @Column(name = "grade_status")
    private String gradeStatus = "PENDING"; // 批改状态：PENDING待批改, AI_GRADED AI已批改, MANUAL_GRADED 人工已批改
    
    @Column(name = "final_score")
    private Double finalScore; // 最终得分
    
    @Column(name = "ai_score")
    private Double aiScore; // AI评分
    
    @Column(name = "teacher_comments", columnDefinition = "TEXT")
    private String teacherComments; // 教师评语
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public ExamResult() {
        this.createdAt = LocalDateTime.now();
    }
    
    public ExamResult(Student student, Exam exam) {
        this();
        this.student = student;
        this.exam = exam;
        this.startTime = LocalDateTime.now();
    }
    
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Student getStudent() {
        return student;
    }
    
    public void setStudent(Student student) {
        this.student = student;
    }
    
    public Long getStudentId() {
        return studentId;
    }
    
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
    
    public Exam getExam() {
        return exam;
    }
    
    public void setExam(Exam exam) {
        this.exam = exam;
    }
    
    public Long getExamId() {
        return examId;
    }
    
    public void setExamId(Long examId) {
        this.examId = examId;
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
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public Integer getDurationMinutes() {
        return durationMinutes;
    }
    
    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
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
    
    public String getTeacherComments() {
        return teacherComments;
    }
    
    public void setTeacherComments(String teacherComments) {
        this.teacherComments = teacherComments;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    // 便捷方法：获取学生姓名
    public String getStudentName() {
        return student != null ? student.getRealName() : null;
    }
    
    // 便捷方法：获取考试标题
    public String getExamTitle() {
        return exam != null ? exam.getTitle() : null;
    }
} 