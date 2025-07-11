package com.example.smartedu.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "course_code", unique = true, nullable = false)
    private String courseCode;
    
    private String description;
    
    private Integer credit;
    
    private Integer hours;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnore
    private Teacher teacher;
    
    @Column(name = "teacher_id", insertable = false, updatable = false)
    private Long teacherId;
    
    @Column(name = "semester")
    private String semester; // 学期
    
    @Column(name = "academic_year")
    private String academicYear; // 学年
    
    @Column(name = "class_time")
    private String classTime; // 上课时间
    
    @Column(name = "class_location")
    private String classLocation; // 上课地点
    
    @Column(name = "max_students")
    private Integer maxStudents; // 最大学生数
    
    @Column(name = "current_students")
    private Integer currentStudents = 0; // 当前学生数
    
    @Column(name = "status")
    private String status = "active"; // active, inactive, completed
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "training_objectives", columnDefinition = "TEXT")
    private String trainingObjectives; // 培养目标，JSON格式存储
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CourseMaterial> materials;
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Notice> notices;
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Exam> exams;
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TeachingOutline> teachingOutlines;
    
    // 构造函数
    public Course() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Course(String name, String description, Teacher teacher) {
        this();
        this.name = name;
        this.description = description;
        this.teacher = teacher;
    }
    
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCourseCode() {
        return courseCode;
    }
    
    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getCredit() {
        return credit;
    }
    
    public void setCredit(Integer credit) {
        this.credit = credit;
    }
    
    public Integer getHours() {
        return hours;
    }
    
    public void setHours(Integer hours) {
        this.hours = hours;
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
    
    public String getSemester() {
        return semester;
    }
    
    public void setSemester(String semester) {
        this.semester = semester;
    }
    
    public String getAcademicYear() {
        return academicYear;
    }
    
    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }
    
    public String getClassTime() {
        return classTime;
    }
    
    public void setClassTime(String classTime) {
        this.classTime = classTime;
    }
    
    public String getClassLocation() {
        return classLocation;
    }
    
    public void setClassLocation(String classLocation) {
        this.classLocation = classLocation;
    }
    
    public Integer getMaxStudents() {
        return maxStudents;
    }
    
    public void setMaxStudents(Integer maxStudents) {
        this.maxStudents = maxStudents;
    }
    
    public Integer getCurrentStudents() {
        return currentStudents;
    }
    
    public void setCurrentStudents(Integer currentStudents) {
        this.currentStudents = currentStudents;
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
    
    public List<CourseMaterial> getMaterials() {
        return materials;
    }
    
    public void setMaterials(List<CourseMaterial> materials) {
        this.materials = materials;
    }
    
    public List<Notice> getNotices() {
        return notices;
    }
    
    public void setNotices(List<Notice> notices) {
        this.notices = notices;
    }
    
    public List<Exam> getExams() {
        return exams;
    }
    
    public void setExams(List<Exam> exams) {
        this.exams = exams;
    }
    
    public List<TeachingOutline> getTeachingOutlines() {
        return teachingOutlines;
    }
    
    public void setTeachingOutlines(List<TeachingOutline> teachingOutlines) {
        this.teachingOutlines = teachingOutlines;
    }
    
    public String getTrainingObjectives() {
        return trainingObjectives;
    }
    
    public void setTrainingObjectives(String trainingObjectives) {
        this.trainingObjectives = trainingObjectives;
    }
    
    // 便捷方法：获取教师姓名
    public String getTeacherName() {
        return teacher != null ? teacher.getRealName() : null;
    }
    
    // 用于JSON序列化的教师信息
    @JsonIgnore
    public Teacher getTeacherInfo() {
        return teacher;
    }
} 