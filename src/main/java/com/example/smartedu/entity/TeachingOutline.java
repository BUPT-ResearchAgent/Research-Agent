package com.example.smartedu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "teaching_outlines")
public class TeachingOutline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Column(columnDefinition = "TEXT")
    private String teachingObjective; // 教学目的
    
    @Column(columnDefinition = "TEXT")
    private String teachingIdea; // 教学思路
    
    @Column(columnDefinition = "TEXT")
    private String keyPoints; // 教学重点
    
    @Column(columnDefinition = "TEXT")
    private String difficulties; // 教学难点
    
    @Column(columnDefinition = "TEXT")
    private String ideologicalDesign; // 思政设计
    
    @Column(columnDefinition = "TEXT")
    private String teachingDesign; // 教学设计（表格形式）
    
    @Column(name = "hours")
    private Integer hours; // 教学学时
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public TeachingOutline() {
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
    
    public Course getCourse() {
        return course;
    }
    
    public void setCourse(Course course) {
        this.course = course;
    }
    
    public String getTeachingObjective() {
        return teachingObjective;
    }
    
    public void setTeachingObjective(String teachingObjective) {
        this.teachingObjective = teachingObjective;
    }
    
    public String getTeachingIdea() {
        return teachingIdea;
    }
    
    public void setTeachingIdea(String teachingIdea) {
        this.teachingIdea = teachingIdea;
    }
    
    public String getKeyPoints() {
        return keyPoints;
    }
    
    public void setKeyPoints(String keyPoints) {
        this.keyPoints = keyPoints;
    }
    
    public String getDifficulties() {
        return difficulties;
    }
    
    public void setDifficulties(String difficulties) {
        this.difficulties = difficulties;
    }
    
    public String getIdeologicalDesign() {
        return ideologicalDesign;
    }
    
    public void setIdeologicalDesign(String ideologicalDesign) {
        this.ideologicalDesign = ideologicalDesign;
    }
    
    public String getTeachingDesign() {
        return teachingDesign;
    }
    
    public void setTeachingDesign(String teachingDesign) {
        this.teachingDesign = teachingDesign;
    }
    
    public Integer getHours() {
        return hours;
    }
    
    public void setHours(Integer hours) {
        this.hours = hours;
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
} 