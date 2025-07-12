package com.example.smartedu.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_group_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_group_id", "student_id"})
})
public class StudentGroupMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_group_id", nullable = false)
    @JsonIgnore
    private StudentGroup studentGroup;
    
    @Column(name = "student_group_id", insertable = false, updatable = false)
    private Long studentGroupId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnore
    private Student student;
    
    @Column(name = "student_id", insertable = false, updatable = false)
    private Long studentId;
    
    @Column(name = "course_id")
    private Long courseId;
    
    @Column(name = "role")
    private String role = "member"; // member, leader
    
    @Column(name = "join_date")
    private LocalDateTime joinDate;
    
    @Column(name = "status")
    private String status = "active"; // active, inactive
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 构造函数
    public StudentGroupMember() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.joinDate = LocalDateTime.now();
    }
    
    public StudentGroupMember(StudentGroup studentGroup, Student student) {
        this();
        this.studentGroup = studentGroup;
        this.student = student;
    }
    
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public StudentGroup getStudentGroup() {
        return studentGroup;
    }
    
    public void setStudentGroup(StudentGroup studentGroup) {
        this.studentGroup = studentGroup;
    }
    
    public Long getStudentGroupId() {
        return studentGroupId;
    }
    
    public void setStudentGroupId(Long studentGroupId) {
        this.studentGroupId = studentGroupId;
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
    
    public Long getCourseId() {
        return courseId;
    }
    
    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public LocalDateTime getJoinDate() {
        return joinDate;
    }
    
    public void setJoinDate(LocalDateTime joinDate) {
        this.joinDate = joinDate;
    }
    
    // 别名方法，为了与Controller中的调用保持一致
    public LocalDateTime getJoinedAt() {
        return joinDate;
    }
    
    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinDate = joinedAt;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
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