package com.example.smartedu.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "questions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String type; // 题目类型：选择、填空、判断、计算、解答等
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // 题目内容
    
    @Column(columnDefinition = "TEXT")
    private String options; // 选择题选项，JSON格式存储
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String answer; // 正确答案
    
    @Column(columnDefinition = "TEXT")
    private String explanation; // 题目解析
    
    private Integer score; // 分值
    
    @Column(length = 100)
    private String knowledgePoint; // 知识点标记
    
    @Column(name = "training_objective", length = 500)
    private String trainingObjective; // 关联的培养目标
    
    @Column(name = "primary_capability", length = 50)
    private String primaryCapability; // 主要考核的能力维度
    
    @Column(name = "secondary_capabilities", columnDefinition = "TEXT")
    private String secondaryCapabilities; // 次要考核的能力维度，JSON格式
    
    @Column(name = "difficulty_level")
    private Integer difficultyLevel = 3; // 能力难度等级，1-5级
    
    @Column(name = "cognitive_level", length = 20)
    private String cognitiveLevel = "application"; // 认知层次
    
    @Column(name = "assignment_requirement", columnDefinition = "TEXT")
    private String assignmentRequirement; // 大作业具体要求，用于AI评分
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    @JsonBackReference
    private Exam exam;
    
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<StudentAnswer> studentAnswers;
    
    public Question() {}
    
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getOptions() {
        return options;
    }
    
    public void setOptions(String options) {
        this.options = options;
    }
    
    public String getAnswer() {
        return answer;
    }
    
    public void setAnswer(String answer) {
        this.answer = answer;
    }
    
    public String getExplanation() {
        return explanation;
    }
    
    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
    
    public Integer getScore() {
        return score;
    }
    
    public void setScore(Integer score) {
        this.score = score;
    }
    
    public String getKnowledgePoint() {
        return knowledgePoint;
    }
    
    public void setKnowledgePoint(String knowledgePoint) {
        this.knowledgePoint = knowledgePoint;
    }
    
    public String getTrainingObjective() {
        return trainingObjective;
    }
    
    public void setTrainingObjective(String trainingObjective) {
        this.trainingObjective = trainingObjective;
    }
    
    public String getPrimaryCapability() {
        return primaryCapability;
    }
    
    public void setPrimaryCapability(String primaryCapability) {
        this.primaryCapability = primaryCapability;
    }
    
    public String getSecondaryCapabilities() {
        return secondaryCapabilities;
    }
    
    public void setSecondaryCapabilities(String secondaryCapabilities) {
        this.secondaryCapabilities = secondaryCapabilities;
    }
    
    public Integer getDifficultyLevel() {
        return difficultyLevel;
    }
    
    public void setDifficultyLevel(Integer difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }
    
    public String getCognitiveLevel() {
        return cognitiveLevel;
    }
    
    public void setCognitiveLevel(String cognitiveLevel) {
        this.cognitiveLevel = cognitiveLevel;
    }
    
    public Exam getExam() {
        return exam;
    }
    
    public void setExam(Exam exam) {
        this.exam = exam;
    }
    
    public List<StudentAnswer> getStudentAnswers() {
        return studentAnswers;
    }
    
    public void setStudentAnswers(List<StudentAnswer> studentAnswers) {
        this.studentAnswers = studentAnswers;
    }
    
    public String getAssignmentRequirement() {
        return assignmentRequirement;
    }
    
    public void setAssignmentRequirement(String assignmentRequirement) {
        this.assignmentRequirement = assignmentRequirement;
    }
} 