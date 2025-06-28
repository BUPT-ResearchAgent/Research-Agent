package com.example.smartedu.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "teaching_reports")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TeachingReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title; // 报告标题
    
    @Column(name = "file_name")
    private String fileName; // PDF文件名
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // 报告内容（Markdown格式）
    
    @Column(name = "analysis_scope")
    private String analysisScope; // 分析范围：COURSE, CHAPTER等
    
    @Column(name = "scope_text")
    private String scopeText; // 分析范围显示文本
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Teacher teacher; // 生成报告的教师
    
    @Column(name = "teacher_id", insertable = false, updatable = false)
    private Long teacherId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Course course; // 关联的课程（可选）
    
    @Column(name = "course_id", insertable = false, updatable = false)
    private Long courseId;
    
    @Column(name = "course_text")
    private String courseText; // 课程显示文本
    
    @Column(name = "generated_at")
    private LocalDateTime generatedAt; // AI生成时间
    
    @Column(name = "created_at")
    private LocalDateTime createdAt; // 记录创建时间
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 记录更新时间
    
    @Column(name = "file_size")
    private Long fileSize; // PDF文件大小（字节）
    
    @Column(name = "download_count")
    private Integer downloadCount = 0; // 下载次数
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false; // 软删除标记
    
    // 构造函数
    public TeachingReport() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.generatedAt = LocalDateTime.now();
    }
    
    public TeachingReport(String title, String content, Teacher teacher) {
        this();
        this.title = title;
        this.content = content;
        this.teacher = teacher;
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
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getAnalysisScope() {
        return analysisScope;
    }
    
    public void setAnalysisScope(String analysisScope) {
        this.analysisScope = analysisScope;
    }
    
    public String getScopeText() {
        return scopeText;
    }
    
    public void setScopeText(String scopeText) {
        this.scopeText = scopeText;
    }
    
    public Teacher getTeacher() {
        return teacher;
    }
    
    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }
    
    public Long getTeacherId() {
        return teacherId;
    }
    
    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }
    
    public Course getCourse() {
        return course;
    }
    
    public void setCourse(Course course) {
        this.course = course;
    }
    
    public Long getCourseId() {
        return courseId;
    }
    
    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
    
    public String getCourseText() {
        return courseText;
    }
    
    public void setCourseText(String courseText) {
        this.courseText = courseText;
    }
    
    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }
    
    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
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
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public Integer getDownloadCount() {
        return downloadCount;
    }
    
    public void setDownloadCount(Integer downloadCount) {
        this.downloadCount = downloadCount;
    }
    
    public Boolean getIsDeleted() {
        return isDeleted;
    }
    
    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }
    
    // 便利方法
    public void incrementDownloadCount() {
        this.downloadCount = (this.downloadCount == null ? 0 : this.downloadCount) + 1;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void markAsDeleted() {
        this.isDeleted = true;
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
} 