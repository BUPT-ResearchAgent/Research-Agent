package com.example.smartedu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "industry_info")
public class IndustryInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Column(nullable = false)
    private String source; // 信息来源
    
    @Column(nullable = false)
    private String type; // 类型: hot_topic, industry_trend, policy_update, research_report
    
    @Column(name = "subject_category")
    private String subjectCategory; // 学科分类
    
    @Column(name = "importance_level")
    private Integer importanceLevel; // 重要性级别 1-5
    
    @Column(name = "source_url")
    private String sourceUrl; // 原始链接
    
    @Column(name = "published_at")
    private LocalDateTime publishedAt; // 发布时间
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "is_active")
    private Boolean isActive = true; // 是否激活
    
    @Column(name = "view_count")
    private Integer viewCount = 0; // 查看次数
    
    @Column(name = "keywords")
    private String keywords; // 关键词，用逗号分隔
    
    public IndustryInfo() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public IndustryInfo(String title, String content, String source, String type) {
        this();
        this.title = title;
        this.content = content;
        this.source = source;
        this.type = type;
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
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getSource() {
        return source;
    }
    
    public void setSource(String source) {
        this.source = source;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getSubjectCategory() {
        return subjectCategory;
    }
    
    public void setSubjectCategory(String subjectCategory) {
        this.subjectCategory = subjectCategory;
    }
    
    public Integer getImportanceLevel() {
        return importanceLevel;
    }
    
    public void setImportanceLevel(Integer importanceLevel) {
        this.importanceLevel = importanceLevel;
    }
    
    public String getSourceUrl() {
        return sourceUrl;
    }
    
    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }
    
    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }
    
    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
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
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public Integer getViewCount() {
        return viewCount;
    }
    
    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }
    
    public String getKeywords() {
        return keywords;
    }
    
    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }
    
    // 增加查看次数
    public void incrementViewCount() {
        this.viewCount = this.viewCount + 1;
    }
} 