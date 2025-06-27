package com.example.smartedu.dto;

import com.example.smartedu.entity.Question;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;

/**
 * 学生端题目信息DTO
 */
public class StudentQuestionDTO {
    private Long id;
    private String type;
    private String content;
    private List<String> options;
    private String answer; // 只有在答案发布后才显示
    private String explanation; // 只有在答案发布后才显示
    private Integer score;
    private String studentAnswer; // 学生的答案
    private Integer studentScore; // 学生得分
    private Boolean isCorrect; // 是否正确
    private String teacherFeedback; // 教师反馈
    private String knowledgePoint; // 知识点（学生查看试卷时显示）
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    public StudentQuestionDTO() {}
    
    public StudentQuestionDTO(Question question, boolean showAnswers) {
        this(question, showAnswers, true); // 默认显示知识点
    }
    
    public StudentQuestionDTO(Question question, boolean showAnswers, boolean showKnowledgePoint) {
        this.id = question.getId();
        this.type = question.getType();
        this.content = question.getContent();
        this.score = question.getScore();
        
        // 根据参数决定是否显示知识点
        if (showKnowledgePoint) {
            this.knowledgePoint = question.getKnowledgePoint();
        }
        
        // 解析选项
        if (question.getOptions() != null && !question.getOptions().isEmpty()) {
            try {
                this.options = objectMapper.readValue(question.getOptions(), 
                    new TypeReference<List<String>>() {});
            } catch (Exception e) {
                // 如果解析失败，尝试简单分割
                this.options = List.of(question.getOptions().split("\n"));
            }
        }
        
        // 只有在答案发布后才显示答案和解析
        if (showAnswers) {
            this.answer = question.getAnswer();
            this.explanation = question.getExplanation();
        }
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }
    
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    
    public String getStudentAnswer() { return studentAnswer; }
    public void setStudentAnswer(String studentAnswer) { this.studentAnswer = studentAnswer; }
    
    public Integer getStudentScore() { return studentScore; }
    public void setStudentScore(Integer studentScore) { this.studentScore = studentScore; }
    
    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
    
    public String getTeacherFeedback() { return teacherFeedback; }
    public void setTeacherFeedback(String teacherFeedback) { this.teacherFeedback = teacherFeedback; }
    
    public String getKnowledgePoint() { return knowledgePoint; }
    public void setKnowledgePoint(String knowledgePoint) { this.knowledgePoint = knowledgePoint; }
} 