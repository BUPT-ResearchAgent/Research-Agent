package com.example.smartedu.dto;

import com.example.smartedu.entity.Exam;
import com.example.smartedu.entity.Question;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ExamDTO {
    private Long id;
    private String title;
    private String description;
    private String chapter;
    private String examType;
    private Integer duration;
    private Integer totalScore;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean isPublished;
    private Boolean isAnswerPublished;
    private LocalDateTime createdAt;
    private List<QuestionDTO> questions;
    
    // 课程信息
    private Long courseId;
    private String courseName;
    private String courseCode;
    
    public ExamDTO() {}
    
    public ExamDTO(Exam exam) {
        this.id = exam.getId();
        this.title = exam.getTitle();
        this.description = exam.getDescription();
        this.chapter = exam.getChapter();
        this.examType = exam.getExamType();
        this.duration = exam.getDuration();
        this.totalScore = exam.getTotalScore();
        this.startTime = exam.getStartTime();
        this.endTime = exam.getEndTime();
        this.isPublished = exam.getIsPublished();
        this.isAnswerPublished = exam.getIsAnswerPublished();
        this.createdAt = exam.getCreatedAt();
        
        // 设置课程信息
        if (exam.getCourse() != null) {
            this.courseId = exam.getCourse().getId();
            this.courseName = exam.getCourse().getName();
            this.courseCode = exam.getCourse().getCourseCode();
        }
        
        if (exam.getQuestions() != null) {
            this.questions = exam.getQuestions().stream()
                    .map(QuestionDTO::new)
                    .collect(Collectors.toList());
        }
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
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getChapter() {
        return chapter;
    }
    
    public void setChapter(String chapter) {
        this.chapter = chapter;
    }
    
    public String getExamType() {
        return examType;
    }
    
    public void setExamType(String examType) {
        this.examType = examType;
    }
    
    public Integer getDuration() {
        return duration;
    }
    
    public void setDuration(Integer duration) {
        this.duration = duration;
    }
    
    public Integer getTotalScore() {
        return totalScore;
    }
    
    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    public Boolean getIsPublished() {
        return isPublished;
    }
    
    public void setIsPublished(Boolean isPublished) {
        this.isPublished = isPublished;
    }
    
    public Boolean getIsAnswerPublished() {
        return isAnswerPublished;
    }
    
    public void setIsAnswerPublished(Boolean isAnswerPublished) {
        this.isAnswerPublished = isAnswerPublished;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public List<QuestionDTO> getQuestions() {
        return questions;
    }
    
    public void setQuestions(List<QuestionDTO> questions) {
        this.questions = questions;
    }
    
    public Long getCourseId() {
        return courseId;
    }
    
    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
    
    public String getCourseName() {
        return courseName;
    }
    
    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }
    
    public String getCourseCode() {
        return courseCode;
    }
    
    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }
    
    // 内部QuestionDTO类
    public static class QuestionDTO {
        private Long id;
        private String type;
        private String content;
        private String options;
        private String answer;
        private String explanation;
        private Integer score;
        private String knowledgePoint; // 知识点
        
        public QuestionDTO() {}
        
        public QuestionDTO(Question question) {
            this.id = question.getId();
            this.type = question.getType();
            this.content = question.getContent();
            this.options = question.getOptions();
            this.answer = question.getAnswer();
            this.explanation = question.getExplanation();
            this.score = question.getScore();
            this.knowledgePoint = question.getKnowledgePoint();
        }
        
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
    }
} 