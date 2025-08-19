package com.example.smartedu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hot_topics")
public class HotTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String summary;
    
    @Column(nullable = false, length = 1000)
    private String url;
    
    @Column(name = "source_website", length = 100)
    private String sourceWebsite;
    
    @Column(name = "publish_time")
    private LocalDateTime publishTime;
    
    @Column(name = "created_time")
    private LocalDateTime createdTime;
    
    @Column(name = "view_count")
    private Integer viewCount = 0;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(length = 50)
    private String category;
    
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    
    // 构造函数
    public HotTopic() {
        this.createdTime = LocalDateTime.now();
    }
    
    public HotTopic(String title, String summary, String url, String sourceWebsite) {
        this();
        this.title = title;
        this.summary = summary;
        this.url = url;
        this.sourceWebsite = sourceWebsite;
        this.publishTime = LocalDateTime.now();
    }
    
    // Getters and Setters
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
    
    public String getSummary() {
        return summary;
    }
    
    public void setSummary(String summary) {
        this.summary = summary;
    }
    
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public String getSourceWebsite() {
        return sourceWebsite;
    }
    
    public void setSourceWebsite(String sourceWebsite) {
        this.sourceWebsite = sourceWebsite;
    }
    
    public LocalDateTime getPublishTime() {
        return publishTime;
    }
    
    public void setPublishTime(LocalDateTime publishTime) {
        this.publishTime = publishTime;
    }
    
    public LocalDateTime getCreatedTime() {
        return createdTime;
    }
    
    public void setCreatedTime(LocalDateTime createdTime) {
        this.createdTime = createdTime;
    }
    
    public Integer getViewCount() {
        return viewCount;
    }
    
    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getImageUrl() {
        return imageUrl;
    }
    
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    // 增加浏览次数
    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }
    
    @Override
    public String toString() {
        return "HotTopic{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", sourceWebsite='" + sourceWebsite + '\'' +
                ", publishTime=" + publishTime +
                ", viewCount=" + viewCount +
                '}';
    }
}
