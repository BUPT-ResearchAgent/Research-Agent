package com.example.smartedu.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_capability_assessment")
public class StudentCapabilityAssessment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    
    @Column(name = "course_id", nullable = false)
    private Long courseId;
    
    @Column(name = "exam_id")
    private Long examId;
    
    @Column(name = "capability_dimension", nullable = false, length = 50)
    private String capabilityDimension;
    
    @Column(name = "score", nullable = false, precision = 5, scale = 2)
    private BigDecimal score;
    
    @Column(name = "level_achieved", nullable = false)
    private Integer levelAchieved;
    
    @Column(name = "assessment_date")
    private LocalDateTime assessmentDate;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 关联实体
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", insertable = false, updatable = false)
    private Student student;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", insertable = false, updatable = false)
    private Course course;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", insertable = false, updatable = false)
    private Exam exam;
    
    public StudentCapabilityAssessment() {
        this.assessmentDate = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
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
    
    public Long getCourseId() {
        return courseId;
    }
    
    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
    
    public Long getExamId() {
        return examId;
    }
    
    public void setExamId(Long examId) {
        this.examId = examId;
    }
    
    public String getCapabilityDimension() {
        return capabilityDimension;
    }
    
    public void setCapabilityDimension(String capabilityDimension) {
        this.capabilityDimension = capabilityDimension;
    }
    
    public BigDecimal getScore() {
        return score;
    }
    
    public void setScore(BigDecimal score) {
        this.score = score;
    }
    
    public Integer getLevelAchieved() {
        return levelAchieved;
    }
    
    public void setLevelAchieved(Integer levelAchieved) {
        this.levelAchieved = levelAchieved;
    }
    
    public LocalDateTime getAssessmentDate() {
        return assessmentDate;
    }
    
    public void setAssessmentDate(LocalDateTime assessmentDate) {
        this.assessmentDate = assessmentDate;
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
    
    public Student getStudent() {
        return student;
    }
    
    public void setStudent(Student student) {
        this.student = student;
    }
    
    public Course getCourse() {
        return course;
    }
    
    public void setCourse(Course course) {
        this.course = course;
    }
    
    public Exam getExam() {
        return exam;
    }
    
    public void setExam(Exam exam) {
        this.exam = exam;
    }
    
    /**
     * 获取能力维度枚举
     */
    public CapabilityDimension getCapabilityDimensionEnum() {
        return CapabilityDimension.fromCode(this.capabilityDimension);
    }
    
    /**
     * 设置能力维度枚举
     */
    public void setCapabilityDimensionEnum(CapabilityDimension dimension) {
        this.capabilityDimension = dimension.getCode();
    }
    
    /**
     * 获取能力等级描述
     */
    public String getLevelDescription() {
        CapabilityDimension dimension = getCapabilityDimensionEnum();
        if (dimension != null) {
            return dimension.getLevelDescription(this.levelAchieved);
        }
        return "等级 " + this.levelAchieved;
    }
} 